import type { FullSurvey } from "./survey-service";

type FullQuestion = FullSurvey["sections"][number]["questions"][number];
type AnswerValue = { questionId: string; value: unknown; textValue: string | null };

export interface AnsweredQuestion {
  questionId: string;
  title: string;
  type: FullQuestion["type"];
  displayValue: string;
}

/** Renders one answer's raw JSON value as text, resolving choice values to their option labels. */
export function formatAnswerValue(question: FullQuestion, answer: AnswerValue | undefined): string {
  if (!answer) return "";
  if (answer.textValue) return answer.textValue;

  const values = Array.isArray(answer.value) ? answer.value : [answer.value];
  return values
    .map((v) => {
      const opt = question.options.find((o) => o.value === v || o.label === v);
      return opt?.label ?? (v === null || v === undefined ? "" : String(v));
    })
    .filter(Boolean)
    .join(", ");
}

/** Flattens a survey's questions (in display order) paired with a given response's answers. */
export function buildAnsweredQuestions(survey: FullSurvey, answers: AnswerValue[]): AnsweredQuestion[] {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a]));
  return survey.sections.flatMap((section) =>
    section.questions.map((question) => ({
      questionId: question.id,
      title: question.title,
      type: question.type,
      displayValue: formatAnswerValue(question, answerByQuestion.get(question.id)),
    })),
  );
}
