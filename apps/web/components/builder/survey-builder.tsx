"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { SectionEditor } from "./section-editor";
import { AiCopilot } from "./ai-copilot";
import type { BuilderSurvey } from "./types";
import type { QuestionType } from "@surveymasterai/survey-engine";
import type { QuestionUpdatePayload } from "./question-editor";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Request failed");
  }
  return res.json();
}

export function SurveyBuilder({ initialSurvey }: { initialSurvey: BuilderSurvey }) {
  const [survey, setSurvey] = useState(initialSurvey);
  const [title, setTitle] = useState(initialSurvey.title);
  const [saving, setSaving] = useState(false);
  const [checkingQuality, setCheckingQuality] = useState(false);
  const questionRequestIds = useRef<Record<string, number>>({});

  async function refresh() {
    const data = await api<{ survey: BuilderSurvey }>(`/api/v1/surveys/${survey.id}`);
    setSurvey(data.survey);
  }

  async function saveTitle() {
    if (title === survey.title) return;
    setSaving(true);
    await api(`/api/v1/surveys/${survey.id}`, { method: "PATCH", body: JSON.stringify({ title }) });
    setSurvey((s) => ({ ...s, title }));
    setSaving(false);
  }

  async function addSection() {
    const { section } = await api<{ section: BuilderSurvey["sections"][number] }>(`/api/v1/surveys/${survey.id}/sections`, {
      method: "POST",
      body: JSON.stringify({ title: `Section ${survey.sections.length + 1}` }),
    });
    setSurvey((s) => ({ ...s, sections: [...s.sections, section] }));
  }

  async function updateSectionTitle(sectionId: string, newTitle: string) {
    await api(`/api/v1/surveys/${survey.id}/sections/${sectionId}`, { method: "PATCH", body: JSON.stringify({ title: newTitle }) });
    setSurvey((s) => ({ ...s, sections: s.sections.map((sec) => (sec.id === sectionId ? { ...sec, title: newTitle } : sec)) }));
  }

  async function deleteSection(sectionId: string) {
    if (survey.sections.length <= 1) return;
    await api(`/api/v1/surveys/${survey.id}/sections/${sectionId}`, { method: "DELETE" });
    setSurvey((s) => ({ ...s, sections: s.sections.filter((sec) => sec.id !== sectionId) }));
  }

  async function addQuestion(sectionId: string, type: QuestionType) {
    const { question } = await api<{ question: BuilderSurvey["sections"][number]["questions"][number] }>(
      `/api/v1/surveys/${survey.id}/sections/${sectionId}/questions`,
      { method: "POST", body: JSON.stringify({ type, title: "New question" }) },
    );
    setSurvey((s) => ({
      ...s,
      sections: s.sections.map((sec) => (sec.id === sectionId ? { ...sec, questions: [...sec.questions, question] } : sec)),
    }));
  }

  async function updateQuestion(questionId: string, payload: QuestionUpdatePayload) {
    // Apply the change locally first. QuestionEditor derives things like the
    // next option's label from the current option count, so if we waited for
    // the PATCH round-trip before updating state, firing it again quickly
    // (e.g. clicking "Add option" repeatedly) would read the same stale
    // count each time and produce duplicate options.
    const { options, ...rest } = payload;
    setSurvey((s) => ({
      ...s,
      sections: s.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map((q) =>
          q.id === questionId
            ? {
                ...q,
                ...rest,
                options: options ? options.map((o, i) => ({ id: q.options[i]?.id ?? "", ...o })) : q.options,
              }
            : q,
        ),
      })),
    }));

    const requestId = (questionRequestIds.current[questionId] ?? 0) + 1;
    questionRequestIds.current[questionId] = requestId;

    const { question } = await api<{ question: BuilderSurvey["sections"][number]["questions"][number] }>(
      `/api/v1/surveys/${survey.id}/questions/${questionId}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );

    // A newer edit to this question has since been made (and its own
    // request is in flight or already applied) — don't let this older
    // response clobber it.
    if (questionRequestIds.current[questionId] !== requestId) return;

    setSurvey((s) => ({
      ...s,
      sections: s.sections.map((sec) => ({
        ...sec,
        questions: sec.questions.map((q) => (q.id === questionId ? question : q)),
      })),
    }));
  }

  async function deleteQuestion(questionId: string) {
    await api(`/api/v1/surveys/${survey.id}/questions/${questionId}`, { method: "DELETE" });
    setSurvey((s) => ({
      ...s,
      sections: s.sections.map((sec) => ({ ...sec, questions: sec.questions.filter((q) => q.id !== questionId) })),
    }));
  }

  async function reorderQuestions(sectionId: string, orderedIds: string[]) {
    setSurvey((s) => ({
      ...s,
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, questions: orderedIds.map((id, i) => ({ ...sec.questions.find((q) => q.id === id)!, order: i })) }
          : sec,
      ),
    }));
    await api(`/api/v1/surveys/${survey.id}/questions/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ updates: orderedIds.map((id, i) => ({ id, order: i, sectionId })) }),
    });
  }

  async function runQualityCheck() {
    setCheckingQuality(true);
    const result = await api<{ score: number }>(`/api/v1/surveys/${survey.id}/ai/quality-check`, { method: "POST" });
    setSurvey((s) => ({ ...s, aiQualityScore: result.score }));
    setCheckingQuality(false);
  }

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 space-y-4 overflow-y-auto pb-10">
        <div className="card flex items-center gap-4 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="flex-1 border-0 text-lg font-bold text-gray-900 focus:outline-none"
          />
          {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <span className="badge bg-gray-100 text-gray-600">{survey.status}</span>
          {survey.aiQualityScore !== undefined && survey.aiQualityScore !== null && (
            <span className="badge bg-emerald-50 text-emerald-700">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Quality {survey.aiQualityScore}
            </span>
          )}
          <button onClick={runQualityCheck} className="btn-ghost" disabled={checkingQuality}>
            {checkingQuality ? "Checking..." : "Run quality check"}
          </button>
          <Link href={`/s/${survey.slug}?preview=1`} target="_blank" className="btn-secondary">
            <Eye className="h-4 w-4" />
            Preview
          </Link>
          <Link href={`/dashboard/surveys/${survey.id}/settings`} className="btn-primary">
            <Sparkles className="h-4 w-4" />
            Publish & Share
          </Link>
        </div>

        {survey.sections
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const preceding = survey.sections
              .slice()
              .sort((a, b) => a.order - b.order)
              .filter((s) => s.order < section.order)
              .flatMap((s) => s.questions.map((q) => ({ id: q.id, title: q.title })));
            return (
              <SectionEditor
                key={section.id}
                section={section}
                precedingQuestions={preceding}
                onSectionTitleChange={(t) => updateSectionTitle(section.id, t)}
                onDeleteSection={() => deleteSection(section.id)}
                onAddQuestion={(type) => addQuestion(section.id, type)}
                onUpdateQuestion={updateQuestion}
                onDeleteQuestion={deleteQuestion}
                onReorderQuestions={(ids) => reorderQuestions(section.id, ids)}
              />
            );
          })}

        <button onClick={addSection} className="btn-secondary w-full justify-center">
          <Plus className="h-4 w-4" />
          Add section
        </button>
      </div>

      <div className="w-80 shrink-0">
        <AiCopilot surveyId={survey.id} onApplied={refresh} />
      </div>
    </div>
  );
}
