import { z } from "zod";
import { QUESTION_TYPES } from "./question-types";

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  value: z.string().min(1),
  order: z.number().int().default(0),
});

export const logicConditionSchema = z.object({
  questionId: z.string(),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "is_answered",
    "is_not_answered",
  ]),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
});

export const questionLogicSchema = z.object({
  id: z.string().optional(),
  conditions: z.array(logicConditionSchema).min(1),
  match: z.enum(["all", "any"]).default("all"),
  action: z.enum(["SHOW", "HIDE", "SKIP_TO_SECTION", "SKIP_TO_QUESTION", "END_SURVEY"]),
  targetId: z.string().optional(),
});

export const questionConfigSchema = z
  .object({
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    scalePoints: z.number().int().optional(),
    scaleMinLabel: z.string().optional(),
    scaleMaxLabel: z.string().optional(),
    rows: z.array(z.string()).optional(),
    columns: z.array(z.string()).optional(),
    allowOther: z.boolean().optional(),
    randomizeOptions: z.boolean().optional(),
    allowedFileTypes: z.array(z.string()).optional(),
    maxFileSizeMb: z.number().optional(),
    // When set, the respondent flow pre-fills this question from the
    // logged-in session (or the current date) and disables editing, instead
    // of asking the respondent to type it in by hand.
    autoFill: z.enum(["RESPONDENT_NAME", "RESPONDENT_EMAIL", "CURRENT_DATE"]).optional(),
  })
  .partial()
  .default({});

export const questionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(QUESTION_TYPES),
  title: z.string().min(1),
  description: z.string().optional(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number().int().default(0),
  config: questionConfigSchema,
  options: z.array(questionOptionSchema).default([]),
  logic: z.array(questionLogicSchema).default([]),
  tags: z.array(z.string()).default([]),
});

export const sectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().default(0),
  questions: z.array(questionSchema).default([]),
});

export const surveyStructureSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  welcomeScreen: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      buttonLabel: z.string().optional(),
    })
    .default({}),
  thankYouScreen: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .default({}),
  sections: z.array(sectionSchema).min(1),
});

export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;
export type QuestionLogicInput = z.infer<typeof questionLogicSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type SurveyStructureInput = z.infer<typeof surveyStructureSchema>;

export function parseSurveyStructure(data: unknown): SurveyStructureInput {
  return surveyStructureSchema.parse(data);
}

export function safeParseSurveyStructure(data: unknown) {
  return surveyStructureSchema.safeParse(data);
}
