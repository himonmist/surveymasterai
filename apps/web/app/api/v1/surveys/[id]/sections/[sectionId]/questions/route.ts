import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { QUESTION_TYPES } from "@surveymasterai/survey-engine";

const schema = z.object({
  type: z.enum(QUESTION_TYPES).default("SHORT_TEXT"),
  title: z.string().min(1).default("Untitled question"),
});

export async function POST(request: Request, { params }: { params: { id: string; sectionId: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const maxOrder = await prisma.question.aggregate({
    where: { sectionId: params.sectionId },
    _max: { order: true },
  });

  const needsOptions = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "IMAGE_CHOICE", "RANKING"].includes(
    parsed.data.type,
  );

  const question = await prisma.question.create({
    data: {
      sectionId: params.sectionId,
      type: parsed.data.type,
      title: parsed.data.title,
      order: (maxOrder._max.order ?? -1) + 1,
      options: needsOptions
        ? {
            create: [
              { label: "Option 1", value: "option_1", order: 0 },
              { label: "Option 2", value: "option_2", order: 1 },
            ],
          }
        : undefined,
    },
    include: { options: true, logic: true },
  });

  return NextResponse.json({ question });
}
