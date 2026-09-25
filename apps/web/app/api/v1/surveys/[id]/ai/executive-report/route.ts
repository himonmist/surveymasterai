import { NextResponse } from "next/server";
import { getAIProvider } from "@surveymasterai/ai";
import { recordAudit, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { assertWithinAiCreditLimit, consumeAiCredits } from "@/lib/limits";
import { aggregatesToAiInput, getSurveyAggregates } from "@/lib/analytics";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:view_analytics");
  if (isNextResponse(survey)) return survey;

  const limitError = await assertWithinAiCreditLimit(ctx.organizationId);
  if (limitError) return jsonError(limitError, 402);

  const aggregates = await getSurveyAggregates(params.id);
  const provider = getAIProvider();
  const result = await provider.generateExecutiveReport({
    surveyTitle: aggregates.surveyTitle,
    aggregates: aggregatesToAiInput(aggregates),
  });

  await consumeAiCredits(ctx.organizationId, 2);
  await prisma.aiGeneration.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      surveyId: params.id,
      feature: "EXECUTIVE_REPORT",
      provider: provider.name,
      creditsUsed: 2,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "ai.executive_report",
    entityType: "Survey",
    entityId: params.id,
  });

  return NextResponse.json(result);
}
