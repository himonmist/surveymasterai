import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { can } from "@surveymasterai/auth";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { fullSurveyInclude } from "@/lib/survey-service";
import { buildAnsweredQuestions } from "@/lib/response-detail";
import { formatDate } from "@/lib/format";
import { ResponseAnswers } from "@/components/dashboard/response-answers";

export default async function ResponseDetailPage({ params }: { params: { id: string; responseId: string } }) {
  const { org } = await requireOrgContext();

  const survey = await prisma.survey.findUnique({ where: { id: params.id }, include: fullSurveyInclude });
  if (!survey || survey.organizationId !== org.organizationId) notFound();
  if (!can(org.role, "survey:view_analytics")) notFound();

  const response = await prisma.surveyResponse.findUnique({
    where: { id: params.responseId },
    include: { answers: true, respondent: { select: { name: true, email: true } } },
  });
  if (!response || response.surveyId !== survey.id) notFound();

  const questions = buildAnsweredQuestions(survey, response.answers);

  return (
    <div>
      <Link href={`/dashboard/surveys/${survey.id}/responses`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Back to responses
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {response.respondent?.name ?? response.respondent?.email ?? "Anonymous respondent"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {survey.title} · Started {formatDate(response.startedAt)}
            {response.completedAt ? ` · Completed ${formatDate(response.completedAt)}` : " · In progress"}
          </p>
        </div>
        <span className="badge bg-gray-100 text-gray-600">{response.status.replace("_", " ")}</span>
      </div>

      <div className="mt-6">
        <ResponseAnswers questions={questions} />
      </div>
    </div>
  );
}
