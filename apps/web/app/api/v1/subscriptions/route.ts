import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@surveymasterai/billing";
import { jsonError, recordAudit, requirePermissionOrError, resolveApiOrgContext } from "@/lib/api";

export async function GET() {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: ctx.organizationId },
    include: { plan: true },
  });

  const [surveyCount, memberCount, aiUsage] = await Promise.all([
    prisma.survey.count({ where: { organizationId: ctx.organizationId, status: { not: "ARCHIVED" } } }),
    prisma.organizationMember.count({ where: { organizationId: ctx.organizationId, isActive: true } }),
    prisma.aiUsageCounter.findFirst({
      where: { organizationId: ctx.organizationId, periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }),
  ]);

  return NextResponse.json({
    subscription,
    usage: {
      surveys: surveyCount,
      teamMembers: memberCount,
      aiCredits: aiUsage?.creditsUsed ?? 0,
    },
  });
}

const schema = z.object({
  planSlug: z.string(),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(request: Request) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const permError = requirePermissionOrError(ctx, "org:manage_billing");
  if (permError) return permError;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const plan = await prisma.plan.findUnique({ where: { slug: parsed.data.planSlug } });
  if (!plan) return jsonError("Plan not found", 404);

  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } });
  const priceCents = parsed.data.billingCycle === "yearly" ? plan.priceYearlyCents : plan.priceMonthlyCents;

  const provider = getPaymentProvider();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const result = await provider.startSubscription({
    organizationId: ctx.organizationId,
    organizationName: organization.name,
    planSlug: plan.slug,
    billingCycle: parsed.data.billingCycle,
    priceCents,
    successUrl: `${appUrl}/dashboard/subscription?upgraded=1`,
    cancelUrl: `${appUrl}/dashboard/subscription`,
  });

  if (result.status === "requires_checkout") {
    return NextResponse.json({ checkoutUrl: result.checkoutUrl });
  }

  const subscription = await prisma.subscription.upsert({
    where: { organizationId: ctx.organizationId },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      billingCycle: parsed.data.billingCycle,
      paymentProvider: provider.name,
      externalCustomerId: result.externalCustomerId,
      externalSubscriptionId: result.externalSubscriptionId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      canceledAt: null,
    },
    create: {
      organizationId: ctx.organizationId,
      planId: plan.id,
      status: "ACTIVE",
      billingCycle: parsed.data.billingCycle,
      paymentProvider: provider.name,
      externalCustomerId: result.externalCustomerId,
      externalSubscriptionId: result.externalSubscriptionId,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "subscription.changed",
    entityType: "Subscription",
    entityId: subscription.id,
    metadata: { planSlug: plan.slug, billingCycle: parsed.data.billingCycle },
  });

  return NextResponse.json({ subscription });
}
