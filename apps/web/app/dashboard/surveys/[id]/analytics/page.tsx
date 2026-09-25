import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getSurveyAggregates } from "@/lib/analytics";
import { formatPercent } from "@/lib/format";
import { can } from "@surveymasterai/auth";
import { QuestionChart } from "@/components/dashboard/question-chart";
import { AiInsightsPanel } from "@/components/dashboard/ai-insights-panel";

export default async function SurveyAnalyticsPage({ params }: { params: { id: string } }) {
  const { org } = await requireOrgContext();
  const survey = await prisma.survey.findUnique({ where: { id: params.id } });
  if (!survey || survey.organizationId !== org.organizationId) notFound();
  if (!can(org.role, "survey:view_analytics")) notFound();

  const aggregates = await getSurveyAggregates(params.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span className="font-medium text-brand-700">Analytics</span>
            <Link href={`/dashboard/surveys/${survey.id}/responses`} className="hover:text-brand-700">
              Responses
            </Link>
          </div>
        </div>
        <a href={`/api/v1/surveys/${survey.id}/export`} className="btn-secondary">
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Total Responses" value={aggregates.totalResponses} />
        <StatCard label="Completed" value={aggregates.completedResponses} />
        <StatCard label="Completion Rate" value={formatPercent(aggregates.completionRate)} />
        <StatCard label="Avg. Completion Time" value={`${Math.round(aggregates.avgCompletionTimeSeconds / 60)}m`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {aggregates.perQuestion.map((q) => (
            <div key={q.questionId} className="card p-5">
              <p className="text-sm font-semibold text-gray-900">{q.title}</p>
              <p className="text-xs text-gray-400">{q.totalAnswers} answers</p>
              <div className="mt-3">
                <QuestionChart aggregate={q} />
              </div>
            </div>
          ))}
          {aggregates.perQuestion.length === 0 && (
            <div className="card p-8 text-center text-sm text-gray-400">Add questions to this survey to see analytics.</div>
          )}
        </div>
        <div>
          <AiInsightsPanel surveyId={survey.id} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
