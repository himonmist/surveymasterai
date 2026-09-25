"use client";

import { Star } from "lucide-react";
import type { QuestionInput } from "@surveymasterai/survey-engine";
import type { AnswerValue } from "@surveymasterai/survey-engine";

export function QuestionInputField({
  question,
  value,
  onChange,
  disabled = false,
}: {
  question: QuestionInput;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
}) {
  switch (question.type) {
    case "STATEMENT":
      return null;

    case "SHORT_TEXT":
    case "EMAIL":
    case "PHONE":
    case "LOCATION":
    case "SIGNATURE":
      return (
        <input
          className="input disabled:bg-gray-50 disabled:text-gray-500"
          type={question.type === "EMAIL" ? "email" : "text"}
          placeholder={question.placeholder ?? (question.type === "SIGNATURE" ? "Type your full name to sign" : undefined)}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case "LONG_TEXT":
    case "ADDRESS":
      return (
        <textarea
          className="input"
          rows={4}
          placeholder={question.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "NUMBER":
    case "CURRENCY":
      return (
        <input
          className="input"
          type="number"
          min={question.config.min}
          max={question.config.max}
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      );

    case "DATE":
      return (
        <input
          className="input disabled:bg-gray-50 disabled:text-gray-500"
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "TIME":
      return <input className="input" type="time" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "DATETIME":
      return (
        <input
          className="input disabled:bg-gray-50 disabled:text-gray-500"
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );

    case "YES_NO":
      return (
        <div className="flex gap-3">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt.toLowerCase())}
              className={`rounded-lg border px-6 py-2 text-sm font-medium ${
                value === opt.toLowerCase() ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );

    case "CONSENT":
      return (
        <label className="flex items-start gap-2 text-sm text-gray-600">
          <input type="checkbox" className="mt-0.5" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          I agree
        </label>
      );

    case "SINGLE_CHOICE":
    case "DROPDOWN":
    case "IMAGE_CHOICE":
      return question.type === "DROPDOWN" ? (
        <select className="input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="" disabled>
            Select an option
          </option>
          {question.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                value === opt.value ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="accent-brand-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      );

    case "MULTIPLE_CHOICE": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                selected.includes(opt.value) ? "border-brand-600 bg-brand-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...selected, opt.value] : selected.filter((v) => v !== opt.value))
                }
                className="accent-brand-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    }

    case "LIKERT": {
      return (
        <div className="flex flex-wrap justify-between gap-2">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex-1 rounded-lg border px-2 py-2 text-center text-xs font-medium ${
                value === opt.value ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }

    case "MATRIX":
    case "RANKING": {
      const options = question.options.length > 0 ? question.options.map((o) => o.label) : ["Item 1", "Item 2"];
      const ranked: string[] = Array.isArray(value) && value.length > 0 ? (value as string[]) : options;
      function move(index: number, dir: -1 | 1) {
        const next = [...ranked];
        const target = index + dir;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target]!, next[index]!];
        onChange(next);
      }
      return (
        <ol className="space-y-1.5">
          {ranked.map((label, i) => (
            <li key={label} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <span>
                {i + 1}. {label}
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="text-gray-400 hover:text-gray-700">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} className="text-gray-400 hover:text-gray-700">
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
      );
    }

    case "RATING":
    case "STAR_RATING": {
      const max = (question.config.max as number) ?? 5;
      return (
        <div className="flex gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)} className="text-2xl">
              {question.type === "STAR_RATING" ? (
                <Star className={`h-7 w-7 ${(value as number) >= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              ) : (
                <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm ${(value as number) === n ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 text-gray-600"}`}>
                  {n}
                </span>
              )}
            </button>
          ))}
        </div>
      );
    }

    case "NPS":
      return (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm ${
                value === n ? "border-brand-600 bg-brand-600 text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );

    case "SLIDER":
      return (
        <div>
          <input
            type="range"
            min={question.config.min ?? 0}
            max={question.config.max ?? 100}
            value={(value as number) ?? question.config.min ?? 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
          <p className="mt-1 text-sm text-gray-500">{(value as number) ?? question.config.min ?? 0}</p>
        </div>
      );

    case "FILE_UPLOAD":
      return (
        <div>
          <input
            type="file"
            className="text-sm text-gray-500"
            onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
          />
          <p className="mt-1 text-xs text-gray-400">File storage isn&apos;t configured in this environment; the filename is recorded only.</p>
        </div>
      );

    default:
      return <input className="input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
