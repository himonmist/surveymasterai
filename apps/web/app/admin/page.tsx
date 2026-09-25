import { getPlatformStats } from "@/lib/admin-stats";
import { formatPriceCents } from "@/lib/format";
import { SignupTrendChart } from "@/components/admin/signup-trend-chart";

export default async function AdminDashboardPage() {
  const stats = await getPlatformStats();

  const kpis = [
    { label: "Organizations", value: stats.totalOrganizations },
    { label: "Total Users", value: stats.totalUsers },
    { label: "Published Surveys", value: `${stats.publishedSurveys} / ${stats.totalSurveys}` },
    { label: "Responses Today", value: stats.responsesToday },
    { label: "Total Responses", value: stats.totalResponses.toLocaleString() },
    { label: "AI Generations", value: stats.aiGenerationsTotal.toLocaleString() },
    { label: "MRR", value: formatPriceCents(stats.mrrCents) },
    { label: "ARR", value: formatPriceCents(stats.arrCents) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
      <p className="mt-1 text-sm text-gray-400">System-wide metrics across every organization.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900">New organizations — last 30 days</h2>
          <div className="mt-4">
            <SignupTrendChart data={stats.newOrganizationsTrend} />
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900">Subscriptions by plan</h2>
          <div className="mt-4 space-y-3">
            {stats.subscriptionsByPlan.map((p) => (
              <div key={p.planName} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{p.planName}</span>
                <span className="font-semibold text-gray-900">{p.count}</span>
              </div>
            ))}
            {stats.subscriptionsByPlan.length === 0 && <p className="text-xs text-gray-400">No active subscriptions yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
