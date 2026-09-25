import Link from "next/link";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  ABANDONED: "bg-gray-100 text-gray-500",
};

export default async function MyResponsesPage() {
  const user = await requireUser();

  const responses = await prisma.surveyResponse.findMany({
    where: { respondentId: user.id },
    include: { survey: { select: { id: true, title: true, slug: true } } },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My Responses</h1>
      <p className="mt-1 text-sm text-gray-500">Surveys you&apos;ve personally answered. Only you can see this.</p>

      <div className="mt-6 space-y-3">
        {responses.map((response) => (
          <div key={response.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{response.survey.title}</p>
              <p className="text-xs text-gray-400">
                Started {formatDate(response.startedAt)}
                {response.completedAt ? ` · Completed ${formatDate(response.completedAt)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`badge ${STATUS_STYLES[response.status] ?? "bg-gray-100 text-gray-500"}`}>
                {response.status.replace("_", " ")}
              </span>
              <Link href={`/dashboard/my-responses/${response.id}`} className="btn-secondary">
                View my answers
              </Link>
            </div>
          </div>
        ))}

        {responses.length === 0 && (
          <div className="card p-10 text-center text-sm text-gray-400">
            You haven&apos;t responded to any surveys yet.
          </div>
        )}
      </div>
    </div>
  );
}
