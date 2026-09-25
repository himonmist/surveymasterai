import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:export");
  if (isNextResponse(survey)) return survey;

  const full = await prisma.survey.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { questions: { orderBy: { order: "asc" } } },
      },
      responses: {
        include: { answers: true, respondent: { select: { name: true, email: true } } },
        orderBy: { startedAt: "asc" },
      },
    },
  });

  const { searchParams } = new URL(request.url);
  const onlyCompleted = searchParams.get("completed") === "true";

  const questions = full.sections.flatMap((s) => s.questions);
  const responses = onlyCompleted ? full.responses.filter((r) => r.status === "COMPLETED") : full.responses;

  const headers = ["Response ID", "Respondent", "Status", "Started At", "Completed At", ...questions.map((q) => q.title)];

  const rows = responses.map((response) => {
    const answerByQuestion = new Map(response.answers.map((a) => [a.questionId, a]));
    return [
      response.id,
      response.respondent?.name ?? response.respondent?.email ?? response.anonymousId ?? "Anonymous",
      response.status,
      response.startedAt.toISOString(),
      response.completedAt?.toISOString() ?? "",
      ...questions.map((q) => {
        const answer = answerByQuestion.get(q.id);
        if (!answer) return "";
        return answer.textValue ?? (Array.isArray(answer.value) ? answer.value.join("; ") : String(answer.value));
      }),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${full.slug}-responses.csv"`,
    },
  });
}
