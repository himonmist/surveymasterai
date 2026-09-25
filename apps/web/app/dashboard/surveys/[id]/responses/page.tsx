import { notFound } from "next/navigation";
import Link from "next/link";
import { can } from "@surveymasterai/auth";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  ABANDONED: "bg-gray-100 text-gray-500",
};

export default async function SurveyResponsesPage({ params }: { params: { id: string } }) {
  const { org } = await requireOrgContext();
  const survey = await prisma.survey.findUnique({ where: { id: params.id } });
  if (!survey || survey.organizationId !== org.organizationId) notFound();
  if (!can(org.role, "survey:view_analytics")) notFound();

  const responses = await prisma.surveyResponse.findMany({
    where: { surveyId: params.id },
    include: { respondent: { select: { name: true, email: true } }, _count: { select: { answers: true } } },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{survey.title}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <Link href={`/dashboard/surveys/${survey.id}/analytics`} className="hover:text-brand-700">
              Analytics
            </Link>
            <span className="font-medium text-brand-700">Responses</span>
          </div>
        </div>
        <a href={`/api/v1/surveys/${survey.id}/export`} className="btn-secondary">
          Export CSV
        </a>
      </div>

      <div className="mt-6 card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Respondent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Answers</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr key={response.id} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {response.respondent?.name ?? response.respondent?.email ?? "Anonymous"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_STYLES[response.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {response.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{response._count.answers}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(response.startedAt)}</td>
                <td className="px-4 py-3 text-gray-500">
                  {response.completedAt ? formatDate(response.completedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/surveys/${survey.id}/responses/${response.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {responses.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-400">No responses yet.</div>
        )}
      </div>
    </div>
  );
}
