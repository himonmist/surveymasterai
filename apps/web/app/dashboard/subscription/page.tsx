import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PlanUpgradeGrid } from "./plan-upgrade-grid";

export default async function SubscriptionPage() {
  const { org } = await requireOrgContext();

  const [subscription, plans, surveyCount, memberCount, aiUsage] = await Promise.all([
    prisma.subscription.findUnique({ where: { organizationId: org.organizationId }, include: { plan: true } }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.survey.count({ where: { organizationId: org.organizationId, status: { not: "ARCHIVED" } } }),
    prisma.organizationMember.count({ where: { organizationId: org.organizationId, isActive: true } }),
    prisma.aiUsageCounter.findFirst({
      where: { organizationId: org.organizationId, periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your plan and usage.</p>

      {subscription && (
        <div className="card mt-6 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current plan</p>
              <p className="text-lg font-bold text-gray-900">{subscription.plan.name}</p>
            </div>
            <span className="badge bg-emerald-50 text-emerald-700">{subscription.status}</span>
          </div>
          {subscription.currentPeriodEnd && (
            <p className="mt-2 text-xs text-gray-400">Renews {formatDate(subscription.currentPeriodEnd)}</p>
          )}

          <div className="mt-4 grid grid-cols-3 gap-4">
            <UsageBar label="Surveys" used={surveyCount} limit={subscription.plan.maxSurveys} />
            <UsageBar label="Team members" used={memberCount} limit={subscription.plan.maxTeamMembers} />
            <UsageBar label="AI credits (this month)" used={aiUsage?.creditsUsed ?? 0} limit={subscription.plan.maxAiCreditsPerMonth} />
          </div>
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-gray-900">Available plans</h2>
      <PlanUpgradeGrid
        currentPlanSlug={subscription?.plan.slug}
        plans={plans.map((p) => ({
          slug: p.slug,
          name: p.name,
          description: p.description ?? "",
          priceMonthlyCents: p.priceMonthlyCents,
          isCustom: p.isCustom,
        }))}
      />
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 900000 ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {used} {limit < 900000 && <span className="font-normal text-gray-400">/ {limit}</span>}
      </p>
      {limit < 900000 && (
        <div className="mt-1 h-1.5 rounded-full bg-gray-100">
          <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
