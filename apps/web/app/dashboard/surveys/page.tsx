import Link from "next/link";
import { Sparkles } from "lucide-react";
import { can } from "@surveymasterai/auth";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatPercent, formatRelativeTime } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PUBLISHED: "bg-emerald-50 text-emerald-700",
  PAUSED: "bg-amber-50 text-amber-700",
  CLOSED: "bg-red-50 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-400",
};

export default async function SurveysPage({ searchParams }: { searchParams: { status?: string } }) {
  const { user, org } = await requireOrgContext();
  const canViewAnalytics = can(org.role, "survey:view_analytics");
  const status = searchParams.status ?? "all";

  // Respondents only ever get to see surveys shared with the org that are
  // actually open to respond to — not draft/paused ones, and not everyone
  // else's response counts, which belong to managers/admins only.
  const surveys = await prisma.survey.findMany({
    where: {
      organizationId: org.organizationId,
      status: canViewAnalytics ? (status !== "all" ? (status.toUpperCase() as never) : { not: "ARCHIVED" }) : "PUBLISHED",
    },
    include: { createdBy: { select: { name: true } }, _count: { select: { responses: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const completionRates = canViewAnalytics
    ? await Promise.all(
        surveys.map(async (s) => {
          const completed = await prisma.surveyResponse.count({ where: { surveyId: s.id, status: "COMPLETED" } });
          return s._count.responses > 0 ? completed / s._count.responses : 0;
        }),
      )
    : [];

  const myResponses = canViewAnalytics
    ? []
    : await prisma.surveyResponse.findMany({
        where: { respondentId: user.id, surveyId: { in: surveys.map((s) => s.id) } },
        select: { surveyId: true, id: true, status: true },
      });
  const myResponseBySurvey = new Map(myResponses.map((r) => [r.surveyId, r]));

  const tabs = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
    { key: "paused", label: "Paused" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
        <Link href="/dashboard/surveys/new" className="btn-primary">
          <Sparkles className="h-4 w-4" />
          Create Survey
        </Link>
      </div>

      {canViewAnalytics && (
        <div className="mt-4 flex gap-1 border-b border-gray-200">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/dashboard/surveys?status=${tab.key}`}
              className={`px-3 pb-2 text-sm font-medium ${
                status === tab.key ? "border-b-2 border-brand-600 text-brand-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {surveys.map((survey, i) => (
          <div key={survey.id} className="card flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                {canViewAnalytics ? (
                  <Link href={`/dashboard/surveys/${survey.id}/builder`} className="text-sm font-semibold text-gray-900 hover:text-brand-700">
                    {survey.title}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-gray-900">{survey.title}</p>
                )}
                <p className="text-xs text-gray-400">
                  Owner: {survey.createdBy.name} · Updated {formatRelativeTime(survey.updatedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className={`badge ${STATUS_STYLES[survey.status]}`}>{survey.status}</span>
              {canViewAnalytics ? (
                <>
                  <div className="w-20 text-right text-sm">
                    <p className="font-semibold text-gray-900">{survey._count.responses}</p>
                    <p className="text-xs text-gray-400">Responses</p>
                  </div>
                  <div className="w-20 text-right text-sm">
                    <p className="font-semibold text-gray-900">{formatPercent(completionRates[i] ?? 0)}</p>
                    <p className="text-xs text-gray-400">Completion</p>
                  </div>
                  <Link href={`/dashboard/surveys/${survey.id}/responses`} className="btn-ghost">
                    Responses
                  </Link>
                  <Link href={`/dashboard/surveys/${survey.id}/analytics`} className="btn-ghost">
                    Analytics
                  </Link>
                  <Link href={`/dashboard/surveys/${survey.id}/builder`} className="btn-secondary">
                    Open
                  </Link>
                </>
              ) : myResponseBySurvey.get(survey.id) ? (
                <>
                  <span className="text-sm text-gray-400">
                    {myResponseBySurvey.get(survey.id)!.status === "COMPLETED" ? "You've responded" : "In progress"}
                  </span>
                  <Link href={`/dashboard/my-responses/${myResponseBySurvey.get(survey.id)!.id}`} className="btn-ghost">
                    View my answers
                  </Link>
                  {myResponseBySurvey.get(survey.id)!.status !== "COMPLETED" && (
                    <a href={`/s/${survey.slug}`} className="btn-secondary">
                      Continue
                    </a>
                  )}
                </>
              ) : (
                <a href={`/s/${survey.slug}`} className="btn-primary">
                  Respond
                </a>
              )}
            </div>
          </div>
        ))}

        {surveys.length === 0 && (
          <div className="card p-10 text-center text-sm text-gray-400">
            No surveys yet. Create your first one with AI in seconds.
          </div>
        )}
      </div>
    </div>
  );
}
