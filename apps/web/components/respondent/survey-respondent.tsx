"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { isQuestionVisible, validateResponse, type AnswerMap, type FlatQuestion } from "@surveymasterai/survey-engine";
import type { SurveyStructureInput } from "@surveymasterai/survey-engine";
import { QuestionInputField } from "./question-input";

interface Props {
  slug: string;
  title: string;
  description?: string | null;
  structure: SurveyStructureInput;
  preview?: boolean;
  respondentName?: string | null;
  respondentEmail?: string | null;
}

/** Questions can be marked (in the builder) to auto-fill from the logged-in session or today's date instead of asking the respondent to type them. */
function computeAutoFillAnswers(
  structure: SurveyStructureInput,
  respondentName?: string | null,
  respondentEmail?: string | null,
): AnswerMap {
  const result: AnswerMap = {};
  for (const section of structure.sections) {
    for (const question of section.questions) {
      const autoFill = question.config?.autoFill as string | undefined;
      if (!question.id || !autoFill) continue;
      if (autoFill === "RESPONDENT_NAME" && respondentName) result[question.id] = respondentName;
      else if (autoFill === "RESPONDENT_EMAIL" && respondentEmail) result[question.id] = respondentEmail;
      else if (autoFill === "CURRENT_DATE") {
        result[question.id] = question.type === "DATETIME" ? new Date().toISOString().slice(0, 16) : new Date().toISOString().slice(0, 10);
      }
    }
  }
  return result;
}

function isLockedByAutoFill(
  question: FlatQuestion,
  respondentName?: string | null,
  respondentEmail?: string | null,
): boolean {
  const autoFill = question.config?.autoFill as string | undefined;
  if (!autoFill) return false;
  if (autoFill === "CURRENT_DATE") return true;
  if (autoFill === "RESPONDENT_NAME") return Boolean(respondentName);
  if (autoFill === "RESPONDENT_EMAIL") return Boolean(respondentEmail);
  return false;
}

export function SurveyRespondent({
  slug,
  title,
  description,
  structure,
  preview = false,
  respondentName,
  respondentEmail,
}: Props) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const autoFillAnswers = useMemo(
    () => computeAutoFillAnswers(structure, respondentName, respondentEmail),
    [structure, respondentName, respondentEmail],
  );
  const [answers, setAnswers] = useState<AnswerMap>(() => autoFillAnswers);
  const [responseId, setResponseId] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const storageKey = `smai_response_${slug}`;

  useEffect(() => {
    if (preview) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setResponseId(parsed.responseId);
        setAnswers({ ...(parsed.answers ?? {}), ...autoFillAnswers });
      } catch {
        // ignore corrupt local state
      }
    }
  }, [storageKey]);

  const flatQuestions: FlatQuestion[] = useMemo(
    () => structure.sections.flatMap((s) => s.questions) as FlatQuestion[],
    [structure],
  );

  const visibleQuestions = flatQuestions.filter((q) => isQuestionVisible(q.logic, answers));

  function updateAnswer(questionId: string, value: unknown) {
    const next = { ...answers, [questionId]: value as AnswerMap[string] };
    setAnswers(next);
    setErrors((e) => ({ ...e, [questionId]: "" }));

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => autosave(next), 800);
  }

  async function autosave(currentAnswers: AnswerMap) {
    if (preview) return;
    const res = await fetch(`/api/v1/public/surveys/${slug}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseId, answers: currentAnswers, complete: false }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setResponseId(data.responseId);
      localStorage.setItem(storageKey, JSON.stringify({ responseId: data.responseId, answers: currentAnswers }));
    }
  }

  async function submit() {
    const validationErrors = validateResponse(visibleQuestions, answers);
    if (validationErrors.length > 0) {
      const map: Record<string, string> = {};
      for (const e of validationErrors) map[e.questionId] = e.message;
      setErrors(map);
      const firstEl = document.getElementById(`q-${validationErrors[0]!.questionId}`);
      firstEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (preview) {
      router.push(`/s/${slug}/thank-you?preview=1`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch(`/api/v1/public/surveys/${slug}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responseId, answers, complete: true }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(data.error ?? "Something went wrong submitting your response.");
      return;
    }

    localStorage.removeItem(storageKey);
    router.push(`/s/${slug}/thank-you`);
  }

  if (!started) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">{structure.welcomeScreen.title || title}</h1>
        <p className="mt-3 text-gray-500">{structure.welcomeScreen.description || description}</p>
        <button onClick={() => setStarted(true)} className="btn-primary mt-8 px-8 py-3 text-base">
          {structure.welcomeScreen.buttonLabel || "Start"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}

      <div className="mt-8 space-y-6">
        {visibleQuestions.map((question) => (
          <div key={question.id} id={`q-${question.id}`} className="card p-5">
            <label className="block text-sm font-medium text-gray-900">
              {question.title}
              {question.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {question.description && <p className="mt-1 text-xs text-gray-500">{question.description}</p>}
            <div className="mt-3">
              <QuestionInputField
                question={question}
                value={answers[question.id!]}
                onChange={(v) => updateAnswer(question.id!, v)}
                disabled={isLockedByAutoFill(question, respondentName, respondentEmail)}
              />
            </div>
            {errors[question.id!] && <p className="mt-2 text-xs text-red-600">{errors[question.id!]}</p>}
          </div>
        ))}
      </div>

      {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}

      <button onClick={submit} disabled={submitting} className="btn-primary mt-6 w-full justify-center py-3">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
