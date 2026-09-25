import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@surveymasterai/ai";
import { jsonError, recordAudit, requirePermissionOrError, resolveApiOrgContext } from "@/lib/api";
import { assertWithinAiCreditLimit, consumeAiCredits } from "@/lib/limits";
import { prisma } from "@/lib/db";

const schema = z.object({
  prompt: z.string().min(3).max(4000),
});

export async function POST(request: Request) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const permError = requirePermissionOrError(ctx, "survey:ai_generate");
  if (permError) return permError;

  const limitError = await assertWithinAiCreditLimit(ctx.organizationId);
  if (limitError) return jsonError(limitError, 402);

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const provider = getAIProvider();
  const { structure, usage } = await provider.generateSurvey({ prompt: parsed.data.prompt });
  const quality = await provider.checkQuality(structure);

  await consumeAiCredits(ctx.organizationId, 1);
  await prisma.aiGeneration.create({
    data: {
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      feature: "GENERATE_SURVEY",
      provider: provider.name,
      promptSummary: parsed.data.prompt.slice(0, 200),
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "ai.survey_generated",
    entityType: "AiGeneration",
    metadata: { prompt: parsed.data.prompt.slice(0, 200) },
  });

  return NextResponse.json({ structure, quality });
}
