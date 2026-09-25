"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, FileText } from "lucide-react";

interface ExecutiveReport {
  summary: string;
  keyFindings: string[];
  positiveFindings: string[];
  negativeFindings: string[];
  recommendations: string[];
}

const SUGGESTIONS = [
  "What are the biggest complaints?",
  "Summarize the open-ended responses.",
  "What are the top three issues?",
];

export function AiInsightsPanel({ surveyId }: { surveyId: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/v1/surveys/${surveyId}/ai/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setAnswer(data.answer);
  }

  async function generateReport() {
    setReportLoading(true);
    setError(null);
    const res = await fetch(`/api/v1/surveys/${surveyId}/ai/executive-report`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setReportLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setReport(data);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-gray-900">Ask AI about my survey</h2>
      </div>

      <form onSubmit={ask} className="mt-3 flex gap-2">
        <input
          className="input text-sm"
          placeholder="Ask a question about your responses..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => setQuestion(s)} className="btn-ghost bg-gray-50 py-1 text-xs">
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {answer && <p className="mt-4 whitespace-pre-line rounded-lg bg-brand-50 p-4 text-sm text-brand-900">{answer}</p>}

      <div className="mt-6 border-t border-gray-100 pt-4">
        <button onClick={generateReport} disabled={reportLoading} className="btn-secondary">
          <FileText className="h-4 w-4" />
          {reportLoading ? "Generating..." : "Generate executive report"}
        </button>

        {report && (
          <div className="mt-4 space-y-4 text-sm">
            <p className="text-gray-700">{report.summary}</p>
            <ReportSection title="Key Findings" items={report.keyFindings} />
            <ReportSection title="Positive Findings" items={report.positiveFindings} />
            <ReportSection title="Areas for Attention" items={report.negativeFindings} />
            <ReportSection title="Recommendations" items={report.recommendations} />
          </div>
        )}
      </div>
    </div>
  );
}

function ReportSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{title}</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5 text-gray-600">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
