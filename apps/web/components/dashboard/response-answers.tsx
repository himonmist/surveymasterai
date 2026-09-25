import type { AnsweredQuestion } from "@/lib/response-detail";

export function ResponseAnswers({ questions }: { questions: AnsweredQuestion[] }) {
  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <div key={q.questionId} className="card p-4">
          <p className="text-sm font-medium text-gray-900">{q.title}</p>
          <p className={`mt-1.5 text-sm ${q.displayValue ? "text-gray-700" : "text-gray-300"}`}>
            {q.displayValue || "No answer"}
          </p>
        </div>
      ))}
      {questions.length === 0 && (
        <div className="card p-8 text-center text-sm text-gray-400">This survey has no questions.</div>
      )}
    </div>
  );
}
