import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, recordAudit, resolveApiSuperAdmin } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  priceMonthlyCents: z.number().int().min(0).optional(),
  priceYearlyCents: z.number().int().min(0).optional(),
  maxSurveys: z.number().int().min(0).optional(),
  maxResponsesPerMonth: z.number().int().min(0).optional(),
  maxAiCreditsPerMonth: z.number().int().min(0).optional(),
  maxTeamMembers: z.number().int().min(0).optional(),
  maxStorageMb: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiSuperAdmin();
  if (ctx instanceof NextResponse) return ctx;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const plan = await prisma.plan.update({ where: { id: params.id }, data: parsed.data });

  await recordAudit({
    userId: ctx.userId,
    action: "plan.updated",
    entityType: "Plan",
    entityId: plan.id,
    metadata: parsed.data,
  });

  return NextResponse.json({ plan });
}
