"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Send, Wand2 } from "lucide-react";

const IMPROVE_ACTIONS: { key: string; label: string }[] = [
  { key: "improve_wording", label: "Improve wording" },
  { key: "remove_duplicates", label: "Remove duplicates" },
  { key: "reduce_length", label: "Reduce length" },
  { key: "add_demographics", label: "Add demographics" },
  { key: "add_consent", label: "Add consent statement" },
  { key: "generate_thank_you", label: "Generate thank-you message" },
];

export function AiCopilot({
  surveyId,
  onApplied,
}: {
  surveyId: string;
  onApplied: () => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: 'Try: "Add 3 questions about pricing" or "Make question 2 a likert scale".' },
  ]);
  const [loading, setLoading] = useState(false);

  async function sendInstruction(event: FormEvent) {
    event.preventDefault();
    if (!instruction.trim()) return;
    const text = instruction.trim();
    setMessages((m) => [...m, { role: "user", text }]);
    setInstruction("");
    setLoading(true);

    const res = await fetch(`/api/v1/surveys/${surveyId}/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction: text }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setMessages((m) => [...m, { role: "assistant", text: data.error ?? "Something went wrong." }]);
      return;
    }

    setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    onApplied();
  }

  async function runImprove(action: string) {
    setLoading(true);
    const res = await fetch(`/api/v1/surveys/${surveyId}/ai/improve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions: [action] }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.ok) {
      setMessages((m) => [...m, { role: "assistant", text: data.notes?.join(" ") || "Done." }]);
      onApplied();
    }
  }

  return (
    <div className="card flex h-full flex-col p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-gray-900">AI Copilot</h2>
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`rounded-lg px-3 py-2 text-xs ${m.role === "user" ? "ml-6 bg-brand-600 text-white" : "mr-6 bg-gray-100 text-gray-700"}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="mr-6 rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-400">Thinking...</div>}
      </div>

      <form onSubmit={sendInstruction} className="mt-3 flex gap-2">
        <input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          className="input text-xs"
          placeholder="Ask the AI to edit this survey..."
        />
        <button type="submit" className="btn-primary px-3" disabled={loading}>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <Wand2 className="h-3.5 w-3.5" />
          Quick improvements
        </p>
        <div className="flex flex-wrap gap-1.5">
          {IMPROVE_ACTIONS.map((a) => (
            <button key={a.key} type="button" onClick={() => runImprove(a.key)} disabled={loading} className="btn-ghost bg-gray-50 py-1 text-xs">
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
