import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@surveymasterai/ai";
import { jsonError, recordAudit, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { assertWithinAiCreditLimit, consumeAiCredits } from "@/lib/limits";
import { fullSurveyInclude, replaceSurveyStructure, surveyToStructure } from "@/lib/survey-service";
import { prisma } from "@/lib/db";

const schema = z.object({
  actions: z.array(
    z.enum([
      "improve_wording",
      "remove_bias",
      "remove_duplicates",
      "reduce_length",
      "add_demographics",
      "add_consent",
      "generate_thank_you",
    ]),
  ),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const limitError = await assertWithinAiCreditLimit(ctx.organizationId);
  if (limitError) return jsonError(limitError, 402);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const full = await prisma.survey.findUniqueOrThrow({ where: { id: params.id }, include: fullSurveyInclude });
  const structure = surveyToStructure(full);

  const provider = getAIProvider();
  const result = await provider.improveSurvey({ structure, actions: parsed.data.actions });
  const updated = await replaceSurveyStructure(params.id, result.structure);

  await consumeAiCredits(ctx.organizationId, 1);
  await prisma.aiGeneration.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      surveyId: params.id,
      feature: "IMPROVE_SURVEY",
      provider: provider.name,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "ai.survey_improved",
    entityType: "Survey",
    entityId: params.id,
    metadata: { actions: parsed.data.actions },
  });

  return NextResponse.json({ survey: updated, notes: result.notes });
}
