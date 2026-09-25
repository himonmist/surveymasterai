import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { fullSurveyInclude } from "@/lib/survey-service";
import { buildAnsweredQuestions } from "@/lib/response-detail";
import { formatDate } from "@/lib/format";
import { ResponseAnswers } from "@/components/dashboard/response-answers";

export default async function MyResponseDetailPage({ params }: { params: { responseId: string } }) {
  const user = await requireUser();

  const response = await prisma.surveyResponse.findUnique({
    where: { id: params.responseId },
    include: { answers: true, survey: { include: fullSurveyInclude } },
  });
  // respondentId must match the logged-in user — this page only ever shows the viewer's own data.
  if (!response || response.respondentId !== user.id) notFound();

  const questions = buildAnsweredQuestions(response.survey, response.answers);

  return (
    <div>
      <Link href="/dashboard/my-responses" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Back to my responses
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-gray-900">{response.survey.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Started {formatDate(response.startedAt)}
          {response.completedAt ? ` · Completed ${formatDate(response.completedAt)}` : " · In progress"}
        </p>
      </div>

      <div className="mt-6">
        <ResponseAnswers questions={questions} />
      </div>
    </div>
  );
}
