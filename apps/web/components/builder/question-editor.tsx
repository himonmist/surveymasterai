"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  requiresOptions,
  type QuestionType,
} from "@surveymasterai/survey-engine";
import { LogicEditor } from "./logic-editor";
import type { BuilderLogic, BuilderOption, BuilderQuestion } from "./types";

const NUMERIC_CONFIG_TYPES: QuestionType[] = ["RATING", "NUMBER", "SLIDER"];
const NAME_AUTOFILL_TYPES: QuestionType[] = ["SHORT_TEXT", "EMAIL"];
const DATE_AUTOFILL_TYPES: QuestionType[] = ["DATE", "DATETIME"];

// Commits on blur rather than on every keystroke, same as the question
// title/description fields below. Options previously updated on every
// onChange, which sent a full delete-and-recreate PATCH per character typed
// — under real-world typing speed those requests overlap, and since the
// server has no locking around the delete+recreate, overlapping requests
// can each insert their own copy of the option list, ballooning it into
// hundreds of duplicate rows instead of settling on the final text.
function OptionInput({
  label: committedLabel,
  onCommit,
  onRemove,
}: {
  label: string;
  onCommit: (label: string) => void;
  onRemove: () => void;
}) {
  const [label, setLabel] = useState(committedLabel);

  return (
    <div className="flex items-center gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => label !== committedLabel && onCommit(label)}
        className="input py-1 text-xs"
      />
      <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-600">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export interface QuestionUpdatePayload {
  type?: QuestionType;
  title?: string;
  description?: string;
  required?: boolean;
  config?: Record<string, unknown>;
  options?: { label: string; value: string; order: number }[];
  logic?: BuilderLogic[];
}

export function QuestionEditor({
  question,
  index,
  availableQuestions,
  onUpdate,
  onDelete,
}: {
  question: BuilderQuestion;
  index: number;
  availableQuestions: { id: string; title: string }[];
  onUpdate: (payload: QuestionUpdatePayload) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(question.title);
  const [description, setDescription] = useState(question.description ?? "");

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  function updateOption(optionIndex: number, patch: Partial<BuilderOption>) {
    const next = question.options.map((o, i) => (i === optionIndex ? { ...o, ...patch } : o));
    onUpdate({ options: next.map((o, i) => ({ label: o.label, value: o.value, order: i })) });
  }

  function addOption() {
    const next = [...question.options, { id: "", label: `Option ${question.options.length + 1}`, value: `option_${question.options.length + 1}`, order: question.options.length }];
    onUpdate({ options: next.map((o, i) => ({ label: o.label, value: o.value, order: i })) });
  }

  function removeOption(optionIndex: number) {
    const next = question.options.filter((_, i) => i !== optionIndex);
    onUpdate({ options: next.map((o, i) => ({ label: o.label, value: o.value, order: i })) });
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-start gap-2 p-3">
        <button {...attributes} {...listeners} className="mt-2 cursor-grab text-gray-300 hover:text-gray-500" aria-label="Drag to reorder">
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Q{index + 1}</span>
            <select
              value={question.type}
              onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
              className="input w-auto py-1 text-xs"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate({ required: e.target.checked })}
              />
              Required
            </label>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== question.title && onUpdate({ title })}
            className="mt-2 w-full border-0 border-b border-transparent text-sm font-medium text-gray-900 focus:border-brand-500 focus:outline-none"
            placeholder="Question title"
          />

          {expanded && (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== (question.description ?? "") && onUpdate({ description })}
              className="input mt-2 text-xs"
              rows={2}
              placeholder="Description / help text (optional)"
            />
          )}

          {expanded && (NAME_AUTOFILL_TYPES.includes(question.type) || DATE_AUTOFILL_TYPES.includes(question.type)) && (
            <div className="mt-3">
              <label className="text-xs text-gray-400">Auto-fill</label>
              <select
                className="input py-1 text-xs"
                value={(question.config.autoFill as string) ?? ""}
                onChange={(e) => {
                  const rest = { ...question.config };
                  delete rest.autoFill;
                  onUpdate({ config: e.target.value ? { ...rest, autoFill: e.target.value } : rest });
                }}
              >
                <option value="">None — respondent fills this in</option>
                {NAME_AUTOFILL_TYPES.includes(question.type) && (
                  <>
                    <option value="RESPONDENT_NAME">Logged-in respondent&apos;s name</option>
                    <option value="RESPONDENT_EMAIL">Logged-in respondent&apos;s email</option>
                  </>
                )}
                {DATE_AUTOFILL_TYPES.includes(question.type) && <option value="CURRENT_DATE">Current date</option>}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                When set, this is pre-filled and locked for respondents who are logged in.
              </p>
            </div>
          )}

          {requiresOptions(question.type) && (
            <div className="mt-3 space-y-1.5">
              {question.options.map((option, i) => (
                <OptionInput
                  key={i}
                  label={option.label}
                  onCommit={(label) => updateOption(i, { label, value: label.toLowerCase().replace(/\s+/g, "_") })}
                  onRemove={() => removeOption(i)}
                />
              ))}
              <button type="button" onClick={addOption} className="btn-ghost py-1 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Add option
              </button>
            </div>
          )}

          {NUMERIC_CONFIG_TYPES.includes(question.type) && expanded && (
            <div className="mt-3 flex gap-3">
              <div>
                <label className="text-xs text-gray-400">Min</label>
                <input
                  type="number"
                  className="input py-1 text-xs"
                  value={(question.config.min as number) ?? ""}
                  onChange={(e) => onUpdate({ config: { ...question.config, min: Number(e.target.value) } })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400">Max</label>
                <input
                  type="number"
                  className="input py-1 text-xs"
                  value={(question.config.max as number) ?? ""}
                  onChange={(e) => onUpdate({ config: { ...question.config, max: Number(e.target.value) } })}
                />
              </div>
            </div>
          )}

          {expanded && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Conditional logic</p>
              <LogicEditor
                logic={question.logic}
                availableQuestions={availableQuestions}
                onChange={(logic) => onUpdate({ logic })}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button type="button" onClick={onDelete} className="text-gray-300 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
