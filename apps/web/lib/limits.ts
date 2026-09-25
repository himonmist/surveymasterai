import { prisma } from "./db";

export async function getOrgPlan(organizationId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  return subscription?.plan ?? null;
}

export async function assertWithinSurveyLimit(organizationId: string): Promise<string | null> {
  const plan = await getOrgPlan(organizationId);
  if (!plan) return null;

  const count = await prisma.survey.count({ where: { organizationId, status: { not: "ARCHIVED" } } });
  if (count >= plan.maxSurveys) {
    return `Your plan (${plan.name}) allows up to ${plan.maxSurveys} surveys. Upgrade to create more.`;
  }
  return null;
}

export async function assertWithinTeamLimit(organizationId: string): Promise<string | null> {
  const plan = await getOrgPlan(organizationId);
  if (!plan) return null;

  const count = await prisma.organizationMember.count({ where: { organizationId, isActive: true } });
  if (count >= plan.maxTeamMembers) {
    return `Your plan (${plan.name}) allows up to ${plan.maxTeamMembers} team members. Upgrade to invite more.`;
  }
  return null;
}

function currentPeriodStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function assertWithinAiCreditLimit(organizationId: string): Promise<string | null> {
  const plan = await getOrgPlan(organizationId);
  if (!plan) return null;

  const periodStart = currentPeriodStart();
  const counter = await prisma.aiUsageCounter.findUnique({
    where: { organizationId_periodStart: { organizationId, periodStart } },
  });

  if ((counter?.creditsUsed ?? 0) >= plan.maxAiCreditsPerMonth) {
    return `Your plan (${plan.name}) allows ${plan.maxAiCreditsPerMonth} AI credits/month. Upgrade for more.`;
  }
  return null;
}

export async function consumeAiCredits(organizationId: string, credits: number) {
  const periodStart = currentPeriodStart();
  await prisma.aiUsageCounter.upsert({
    where: { organizationId_periodStart: { organizationId, periodStart } },
    update: { creditsUsed: { increment: credits } },
    create: { organizationId, periodStart, creditsUsed: credits },
  });
}

export async function assertWithinResponseLimit(organizationId: string): Promise<string | null> {
  const plan = await getOrgPlan(organizationId);
  if (!plan) return null;

  const periodStart = currentPeriodStart();
  const count = await prisma.surveyResponse.count({
    where: { survey: { organizationId }, startedAt: { gte: periodStart } },
  });

  if (count >= plan.maxResponsesPerMonth) {
    return `This organization has reached its monthly response limit (${plan.maxResponsesPerMonth}) on the ${plan.name} plan.`;
  }
  return null;
}
