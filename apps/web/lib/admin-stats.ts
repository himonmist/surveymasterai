import { prisma } from "./db";

export async function getPlatformStats() {
  const [
    totalOrganizations,
    totalUsers,
    totalSurveys,
    publishedSurveys,
    totalResponses,
    responsesToday,
    aiGenerationsTotal,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.survey.count(),
    prisma.survey.count({ where: { status: "PUBLISHED" } }),
    prisma.surveyResponse.count(),
    prisma.surveyResponse.count({ where: { startedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.aiGeneration.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  const activeSubs = await prisma.subscription.findMany({ where: { status: "ACTIVE" }, include: { plan: true } });
  const mrrCents = Math.round(
    activeSubs.reduce((sum, s) => sum + (s.billingCycle === "yearly" ? s.plan.priceYearlyCents / 12 : s.plan.priceMonthlyCents), 0),
  );

  const subscriptionsByPlan = new Map<string, number>();
  for (const s of activeSubs) subscriptionsByPlan.set(s.plan.name, (subscriptionsByPlan.get(s.plan.name) ?? 0) + 1);

  const since = new Date();
  since.setDate(since.getDate() - 29);
  const recentOrgs = await prisma.organization.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } });
  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const org of recentOrgs) {
    const key = org.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    totalOrganizations,
    totalUsers,
    totalSurveys,
    publishedSurveys,
    totalResponses,
    responsesToday,
    aiGenerationsTotal,
    activeSubscriptions,
    mrrCents,
    arrCents: mrrCents * 12,
    subscriptionsByPlan: Array.from(subscriptionsByPlan.entries()).map(([planName, count]) => ({ planName, count })),
    newOrganizationsTrend: Array.from(buckets.entries()).map(([date, count]) => ({ date, count })),
  };
}
