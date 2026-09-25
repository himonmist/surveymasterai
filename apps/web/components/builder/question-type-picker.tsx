"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { QUESTION_TYPE_LABELS, QUESTION_TYPES, type QuestionType } from "@surveymasterai/survey-engine";

export function QuestionTypePicker({ onSelect }: { onSelect: (type: QuestionType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="btn-secondary">
        <Plus className="h-4 w-4" />
        Add question
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 grid max-h-80 w-64 grid-cols-1 gap-0.5 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1.5 shadow-panel">
          {QUESTION_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onSelect(type);
                setOpen(false);
              }}
              className="rounded-md px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
            >
              {QUESTION_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
