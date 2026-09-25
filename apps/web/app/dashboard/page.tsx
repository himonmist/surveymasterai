import Link from "next/link";
import { BarChart3, FileCheck2, Users, TrendingUp, Sparkles, FileText, ClipboardList, UserPlus } from "lucide-react";
import { requireOrgContext } from "@/lib/session";
import { getOrgDashboardStats } from "@/lib/analytics";
import { formatPercent } from "@/lib/format";
import { ResponseTrendChart } from "@/components/dashboard/response-trend-chart";
import { prisma } from "@/lib/db";

export default async function DashboardHomePage() {
  const { user, org } = await requireOrgContext();
  const stats = await getOrgDashboardStats(org.organizationId);

  const firstName = (user.name ?? "there").split(" ")[0];

  const kpis = [
    { label: "Active Surveys", value: stats.activeSurveys, icon: BarChart3 },
    { label: "Total Responses", value: stats.totalResponses.toLocaleString(), icon: FileCheck2 },
    { label: "Completion Rate", value: formatPercent(stats.completionRate), icon: TrendingUp },
    { label: "Team Members", value: stats.teamMembers, icon: Users },
  ];

  if (org.role === "RESPONDENT") {
    return <RespondentHome organizationId={org.organizationId} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good {timeOfDay()}, {firstName} 👋</h1>
          <p className="mt-1 text-sm text-gray-500">Here&apos;s what&apos;s happening with your surveys today.</p>
        </div>
        <Link href="/dashboard/surveys/new" className="btn-primary">
          <Sparkles className="h-4 w-4" />
          Create with AI
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
              <kpi.icon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900">Response Trend — last 30 days</h2>
          <div className="mt-4">
            <ResponseTrendChart data={stats.trend} />
          </div>
        </div>
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            <QuickAction href="/dashboard/surveys/new" icon={Sparkles} label="Generate with AI" />
            <QuickAction href="/dashboard/templates" icon={FileText} label="Use Template" />
            <QuickAction href="/dashboard/surveys" icon={ClipboardList} label="View Surveys" />
            {org.role === "ORG_ADMIN" && <QuickAction href="/dashboard/team" icon={UserPlus} label="Invite Member" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-brand-200 hover:bg-brand-50">
      <Icon className="h-4 w-4 text-brand-600" />
      {label}
    </Link>
  );
}

function timeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

async function RespondentHome({ organizationId }: { organizationId: string }) {
  const surveys = await prisma.survey.findMany({
    where: { organizationId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Assigned Surveys</h1>
      <p className="mt-1 text-sm text-gray-500">Surveys shared with your organization.</p>
      <div className="mt-6 space-y-3">
        {surveys.map((survey) => (
          <Link
            key={survey.id}
            href={`/s/${survey.slug}`}
            className="card flex items-center justify-between p-4 hover:border-brand-200"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">{survey.title}</p>
              <p className="text-xs text-gray-400">{survey.description}</p>
            </div>
            <span className="btn-secondary">Open</span>
          </Link>
        ))}
        {surveys.length === 0 && <p className="text-sm text-gray-400">No surveys assigned yet.</p>}
      </div>
    </div>
  );
}
