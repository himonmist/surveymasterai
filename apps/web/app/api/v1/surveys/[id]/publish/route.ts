import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, recordAudit, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";

const schema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "PAUSED", "CLOSED"]),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:publish");
  if (isNextResponse(survey)) return survey;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  if (parsed.data.status === "PUBLISHED") {
    const questionCount = await prisma.question.count({ where: { section: { surveyId: params.id } } });
    if (questionCount === 0) {
      return jsonError("Add at least one question before publishing.", 422);
    }
  }

  const updated = await prisma.survey.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      publishedAt: parsed.data.status === "PUBLISHED" && !survey.publishedAt ? new Date() : survey.publishedAt,
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: `survey.${parsed.data.status.toLowerCase()}`,
    entityType: "Survey",
    entityId: updated.id,
  });

  return NextResponse.json({ survey: updated });
}
