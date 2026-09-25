import type { QuestionType, LogicAction } from "@surveymasterai/database";

export interface BuilderOption {
  id: string;
  label: string;
  value: string;
  order: number;
}

export interface BuilderLogicCondition {
  questionId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_answered" | "is_not_answered";
  value?: string;
}

export interface BuilderLogic {
  id: string;
  conditions: BuilderLogicCondition[];
  action: LogicAction;
  targetId?: string | null;
}

export interface BuilderQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string | null;
  helpText?: string | null;
  required: boolean;
  order: number;
  config: Record<string, unknown>;
  options: BuilderOption[];
  logic: BuilderLogic[];
}

export interface BuilderSection {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  questions: BuilderQuestion[];
}

export interface BuilderSurvey {
  id: string;
  title: string;
  description?: string | null;
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "CLOSED" | "ARCHIVED";
  slug: string;
  visibility: string;
  aiQualityScore?: number | null;
  sections: BuilderSection[];
}
