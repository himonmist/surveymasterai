"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileText, PenLine, ArrowLeft, CheckCircle2 } from "lucide-react";
import type { SurveyStructureInput } from "@surveymasterai/survey-engine";

interface TemplateSummary {
  id: string;
  title: string;
  category: string;
  description: string;
}

type Step = "choose" | "ai-prompt" | "ai-review" | "template-pick";

const PROMPT_SUGGESTIONS = [
  "Create a customer satisfaction survey for a SaaS product",
  "Create an employee engagement survey for a 200-person company",
  "Create a patient satisfaction survey for a dental clinic",
  "Create an event feedback survey for a two-day conference",
];

export function NewSurveyFlow({ templates }: { templates: TemplateSummary[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ structure: SurveyStructureInput; quality: { score: number } } | null>(null);

  async function createScratch() {
    setLoading(true);
    const res = await fetch("/api/v1/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "scratch", title: "Untitled Survey" }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    router.push(`/dashboard/surveys/${data.survey.id}/builder`);
  }

  async function generateWithAi() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/v1/ai/generate-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setGenerated(data);
    setStep("ai-review");
  }

  async function useGenerated() {
    if (!generated) return;
    setLoading(true);
    const res = await fetch("/api/v1/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "ai", structure: generated.structure, aiQualityScore: generated.quality.score }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    router.push(`/dashboard/surveys/${data.survey.id}/builder`);
  }

  async function useTemplate(templateId: string) {
    setLoading(true);
    const res = await fetch("/api/v1/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "template", templateId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    router.push(`/dashboard/surveys/${data.survey.id}/builder`);
  }

  if (step === "choose") {
    return (
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ChoiceCard
          icon={Sparkles}
          title="Generate with AI"
          description="Describe your survey in a sentence and get a complete draft."
          onClick={() => setStep("ai-prompt")}
        />
        <ChoiceCard icon={FileText} title="Use a template" description="Start from a professional, editable template." onClick={() => setStep("template-pick")} />
        <ChoiceCard icon={PenLine} title="Start from scratch" description="Build your survey question by question." onClick={createScratch} loading={loading} />
      </div>
    );
  }

  if (step === "ai-prompt") {
    return (
      <div className="mt-8">
        <BackButton onClick={() => setStep("choose")} />
        <div className="card mt-4 p-6">
          <label className="label">Describe the survey you need</label>
          <textarea
            className="input"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create a customer satisfaction survey for a pharmaceutical company"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {PROMPT_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setPrompt(s)} className="btn-ghost bg-gray-50 text-xs">
                {s}
              </button>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button onClick={generateWithAi} disabled={loading} className="btn-primary mt-4">
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating..." : "Generate survey"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "ai-review" && generated) {
    return (
      <div className="mt-8">
        <BackButton onClick={() => setStep("ai-prompt")} />
        <div className="card mt-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">{generated.structure.title}</h2>
            <span className="badge bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Quality score {generated.quality.score}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{generated.structure.description}</p>

          <div className="mt-4 space-y-4">
            {generated.structure.sections.map((section, i) => (
              <div key={i}>
                <p className="text-xs font-semibold uppercase text-gray-400">{section.title}</p>
                <ul className="mt-1 space-y-1">
                  {section.questions.map((q, qi) => (
                    <li key={qi} className="text-sm text-gray-700">
                      {qi + 1}. {q.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex gap-2">
            <button onClick={useGenerated} disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Use this survey"}
            </button>
            <button onClick={() => setStep("ai-prompt")} className="btn-secondary">
              Try a different prompt
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "template-pick") {
    return (
      <div className="mt-8">
        <BackButton onClick={() => setStep("choose")} />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <button key={t.id} onClick={() => useTemplate(t.id)} disabled={loading} className="card p-4 text-left hover:border-brand-300">
              <span className="badge bg-brand-50 text-brand-700">{t.category}</span>
              <p className="mt-2 text-sm font-semibold text-gray-900">{t.title}</p>
              <p className="mt-1 text-xs text-gray-500">{t.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function ChoiceCard({
  icon: Icon,
  title,
  description,
  onClick,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={loading} className="card flex flex-col items-start p-6 text-left hover:border-brand-300">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-ghost text-xs">
      <ArrowLeft className="h-3.5 w-3.5" />
      Back
    </button>
  );
}
