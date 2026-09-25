"use client";

import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Trash2 } from "lucide-react";
import { QuestionEditor, type QuestionUpdatePayload } from "./question-editor";
import { QuestionTypePicker } from "./question-type-picker";
import type { BuilderSection } from "./types";
import type { QuestionType } from "@surveymasterai/survey-engine";

export function SectionEditor({
  section,
  precedingQuestions,
  onSectionTitleChange,
  onDeleteSection,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onReorderQuestions,
}: {
  section: BuilderSection;
  precedingQuestions: { id: string; title: string }[];
  onSectionTitleChange: (title: string) => void;
  onDeleteSection: () => void;
  onAddQuestion: (type: QuestionType) => void;
  onUpdateQuestion: (questionId: string, payload: QuestionUpdatePayload) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestions: (orderedIds: string[]) => void;
}) {
  const [title, setTitle] = useState(section.title);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = section.questions.map((q) => q.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    onReorderQuestions(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== section.title && onSectionTitleChange(title)}
          className="flex-1 border-0 text-base font-semibold text-gray-900 focus:outline-none"
        />
        <button type="button" onClick={onDeleteSection} className="text-gray-300 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={section.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-4 space-y-3">
            {section.questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                availableQuestions={[
                  ...precedingQuestions,
                  ...section.questions.slice(0, index).map((q) => ({ id: q.id, title: q.title })),
                ]}
                onUpdate={(payload) => onUpdateQuestion(question.id, payload)}
                onDelete={() => onDeleteQuestion(question.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        <QuestionTypePicker onSelect={onAddQuestion} />
      </div>
    </div>
  );
}
