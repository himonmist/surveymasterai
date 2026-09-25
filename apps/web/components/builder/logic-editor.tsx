"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { BuilderLogic } from "./types";

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "is_answered", label: "is answered" },
  { value: "is_not_answered", label: "is not answered" },
] as const;

export function LogicEditor({
  logic,
  availableQuestions,
  onChange,
}: {
  logic: BuilderLogic[];
  availableQuestions: { id: string; title: string }[];
  onChange: (logic: BuilderLogic[]) => void;
}) {
  const [draftQuestionId, setDraftQuestionId] = useState(availableQuestions[0]?.id ?? "");
  const [draftOperator, setDraftOperator] = useState<(typeof OPERATORS)[number]["value"]>("equals");
  const [draftValue, setDraftValue] = useState("");
  const [draftAction, setDraftAction] = useState<"SHOW" | "HIDE">("SHOW");

  function addRule() {
    if (!draftQuestionId) return;
    const rule: BuilderLogic = {
      id: `temp_${Date.now()}`,
      conditions: [{ questionId: draftQuestionId, operator: draftOperator, value: draftValue || undefined }],
      action: draftAction,
    };
    onChange([...logic, rule]);
    setDraftValue("");
  }

  function removeRule(id: string) {
    onChange(logic.filter((r) => r.id !== id));
  }

  if (availableQuestions.length === 0) {
    return <p className="text-xs text-gray-400">Add an earlier question first to enable conditional logic.</p>;
  }

  return (
    <div className="space-y-2">
      {logic.map((rule) => {
        const condition = rule.conditions[0];
        const question = availableQuestions.find((q) => q.id === condition?.questionId);
        return (
          <div key={rule.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>
              <span className="font-medium">{rule.action === "SHOW" ? "Show" : "Hide"}</span> if{" "}
              <span className="font-medium">{question?.title ?? "question"}</span> {condition?.operator.replace(/_/g, " ")}{" "}
              {condition?.value && <span className="font-medium">&ldquo;{condition.value}&rdquo;</span>}
            </span>
            <button type="button" onClick={() => removeRule(rule.id)} className="text-gray-400 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-gray-200 p-2">
        <select value={draftAction} onChange={(e) => setDraftAction(e.target.value as "SHOW" | "HIDE")} className="input w-auto py-1 text-xs">
          <option value="SHOW">Show this question</option>
          <option value="HIDE">Hide this question</option>
        </select>
        <span className="text-xs text-gray-400">if</span>
        <select value={draftQuestionId} onChange={(e) => setDraftQuestionId(e.target.value)} className="input w-auto py-1 text-xs">
          {availableQuestions.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title.slice(0, 30)}
            </option>
          ))}
        </select>
        <select value={draftOperator} onChange={(e) => setDraftOperator(e.target.value as typeof draftOperator)} className="input w-auto py-1 text-xs">
          {OPERATORS.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
        {draftOperator !== "is_answered" && draftOperator !== "is_not_answered" && (
          <input
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            placeholder="value"
            className="input w-24 py-1 text-xs"
          />
        )}
        <button type="button" onClick={addRule} className="btn-ghost py-1 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </button>
      </div>
    </div>
  );
}
