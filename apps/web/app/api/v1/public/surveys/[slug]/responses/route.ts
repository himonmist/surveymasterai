import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getPublishedSurveyBySlug } from "@/lib/public-survey";
import { surveyToStructure } from "@/lib/survey-service";
import { validateResponse, type AnswerMap, type FlatQuestion } from "@surveymasterai/survey-engine";
import { assertWithinResponseLimit } from "@/lib/limits";
import { getCurrentSession } from "@/lib/session";
import { randomUUID } from "node:crypto";

const schema = z.object({
  responseId: z.string().optional(),
  anonymousId: z.string().optional(),
  answers: z.record(z.unknown()),
  complete: z.boolean().default(false),
});

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const result = await getPublishedSurveyBySlug(params.slug);
  if ("error" in result) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.status });
  }
  const { survey } = result;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });
  }

  const structure = surveyToStructure(survey);
  const flatQuestions: FlatQuestion[] = structure.sections.flatMap((s) => s.questions) as FlatQuestion[];
  const answers = parsed.data.answers as AnswerMap;

  if (parsed.data.complete) {
    const errors = validateResponse(flatQuestions, answers);
    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 422 });
    }
  }

  const session = await getCurrentSession();

  let responseId = parsed.data.responseId;
  const anonymousId = parsed.data.anonymousId ?? randomUUID();

  if (!responseId) {
    const limitError = await assertWithinResponseLimit(survey.organizationId);
    if (limitError) return NextResponse.json({ error: limitError }, { status: 402 });

    const forwardedFor = request.headers.get("x-forwarded-for");
    const created = await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        respondentId: session?.user?.id,
        anonymousId: survey.isAnonymous ? undefined : anonymousId,
        ipAddress: forwardedFor?.split(",")[0]?.trim(),
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });
    responseId = created.id;
  }

  const questionIds = new Set(flatQuestions.map((q) => q.id));

  await prisma.$transaction(
    Object.entries(answers)
      .filter(([questionId, value]) => questionIds.has(questionId) && value !== undefined && value !== null && value !== "")
      .map(([questionId, value]) =>
        prisma.responseAnswer.upsert({
          where: { responseId_questionId: { responseId: responseId!, questionId } },
          update: { value: value as never, textValue: typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : String(value) },
          create: {
            responseId: responseId!,
            questionId,
            value: value as never,
            textValue: typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : String(value),
          },
        }),
      ),
  );

  if (parsed.data.complete) {
    const existing = await prisma.surveyResponse.findUniqueOrThrow({ where: { id: responseId } });
    await prisma.surveyResponse.update({
      where: { id: responseId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completionTimeSeconds: Math.round((Date.now() - existing.startedAt.getTime()) / 1000),
      },
    });
  }

  return NextResponse.json({ responseId, anonymousId, completed: parsed.data.complete });
}
