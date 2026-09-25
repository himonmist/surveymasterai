import type { SurveyStructureInput } from "@surveymasterai/survey-engine";

export interface GenerateSurveyInput {
  prompt: string;
  language?: string;
  targetLength?: "short" | "medium" | "long";
}

export interface GenerateSurveyResult {
  structure: SurveyStructureInput;
  usage: TokenUsage;
}

export interface ImproveSurveyInput {
  structure: SurveyStructureInput;
  actions: ImproveAction[];
}

export type ImproveAction =
  | "improve_wording"
  | "remove_bias"
  | "remove_duplicates"
  | "reduce_length"
  | "add_demographics"
  | "add_consent"
  | "generate_thank_you";

export interface ImproveSurveyResult {
  structure: SurveyStructureInput;
  notes: string[];
  usage: TokenUsage;
}

export interface QualityIssue {
  questionId?: string;
  severity: "low" | "medium" | "high";
  type:
    | "ambiguous"
    | "leading"
    | "double_barrelled"
    | "duplicate"
    | "missing_options"
    | "too_long"
    | "missing_consent"
    | "unbalanced_scale";
  message: string;
}

export interface QualityCheckResult {
  score: number;
  issues: QualityIssue[];
  usage: TokenUsage;
}

export interface AnalyzeResponsesInput {
  surveyTitle: string;
  question: string;
  aggregates: Record<string, unknown>;
}

export interface AnalyzeResponsesResult {
  answer: string;
  usage: TokenUsage;
}

export interface ExecutiveReportInput {
  surveyTitle: string;
  aggregates: Record<string, unknown>;
}

export interface ExecutiveReportResult {
  summary: string;
  keyFindings: string[];
  positiveFindings: string[];
  negativeFindings: string[];
  recommendations: string[];
  usage: TokenUsage;
}

export interface ChatAssistantInput {
  instruction: string;
  structure: SurveyStructureInput;
}

export interface ChatAssistantResult {
  structure: SurveyStructureInput;
  reply: string;
  usage: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface AIProvider {
  readonly name: string;
  generateSurvey(input: GenerateSurveyInput): Promise<GenerateSurveyResult>;
  improveSurvey(input: ImproveSurveyInput): Promise<ImproveSurveyResult>;
  checkQuality(structure: SurveyStructureInput): Promise<QualityCheckResult>;
  analyzeResponses(input: AnalyzeResponsesInput): Promise<AnalyzeResponsesResult>;
  generateExecutiveReport(input: ExecutiveReportInput): Promise<ExecutiveReportResult>;
  chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantResult>;
}
