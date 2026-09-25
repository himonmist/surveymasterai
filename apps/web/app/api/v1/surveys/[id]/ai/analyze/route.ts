import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@surveymasterai/ai";
import { jsonError, recordAudit, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { assertWithinAiCreditLimit, consumeAiCredits } from "@/lib/limits";
import { aggregatesToAiInput, getSurveyAggregates } from "@/lib/analytics";
import { prisma } from "@/lib/db";

const schema = z.object({ question: z.string().min(3).max(500) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:view_analytics");
  if (isNextResponse(survey)) return survey;

  const limitError = await assertWithinAiCreditLimit(ctx.organizationId);
  if (limitError) return jsonError(limitError, 402);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const aggregates = await getSurveyAggregates(params.id);
  const provider = getAIProvider();
  const result = await provider.analyzeResponses({
    surveyTitle: aggregates.surveyTitle,
    question: parsed.data.question,
    aggregates: aggregatesToAiInput(aggregates),
  });

  await consumeAiCredits(ctx.organizationId, 1);
  await prisma.aiGeneration.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      surveyId: params.id,
      feature: "ANALYZE_RESPONSES",
      provider: provider.name,
      promptSummary: parsed.data.question,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "ai.analyze_responses",
    entityType: "Survey",
    entityId: params.id,
    metadata: { question: parsed.data.question },
  });

  return NextResponse.json({ answer: result.answer });
}
