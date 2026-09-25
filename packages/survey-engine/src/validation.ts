import type { AnswerMap, AnswerValue } from "./logic";
import { isQuestionVisible } from "./logic";
import type { QuestionInput } from "./schema";
import { isAnswerable } from "./question-types";

export interface FlatQuestion extends QuestionInput {
  id: string;
}

function isEmpty(value: AnswerValue): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

export interface ValidationError {
  questionId: string;
  message: string;
}

/**
 * Validates a full set of respondent answers against a flattened list of
 * questions, respecting conditional visibility so hidden/skipped required
 * questions don't block submission.
 */
export function validateResponse(questions: FlatQuestion[], answers: AnswerMap): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const question of questions) {
    if (!isAnswerable(question.type)) continue;
    if (!isQuestionVisible(question.logic, answers)) continue;

    const value = answers[question.id!];
    if (question.required && isEmpty(value)) {
      errors.push({ questionId: question.id!, message: `"${question.title}" is required.` });
      continue;
    }

    if (isEmpty(value)) continue;

    if (question.type === "EMAIL" && typeof value === "string") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        errors.push({ questionId: question.id!, message: `"${question.title}" must be a valid email.` });
      }
    }

    if (question.type === "NUMBER" || question.type === "SLIDER" || question.type === "RATING") {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors.push({ questionId: question.id!, message: `"${question.title}" must be a number.` });
      } else {
        if (question.config.min !== undefined && num < question.config.min) {
          errors.push({ questionId: question.id!, message: `"${question.title}" must be at least ${question.config.min}.` });
        }
        if (question.config.max !== undefined && num > question.config.max) {
          errors.push({ questionId: question.id!, message: `"${question.title}" must be at most ${question.config.max}.` });
        }
      }
    }

    if (question.type === "SHORT_TEXT" || question.type === "LONG_TEXT") {
      if (typeof value === "string") {
        if (question.config.maxLength && value.length > question.config.maxLength) {
          errors.push({ questionId: question.id!, message: `"${question.title}" exceeds the maximum length.` });
        }
        if (question.config.minLength && value.length < question.config.minLength) {
          errors.push({ questionId: question.id!, message: `"${question.title}" is too short.` });
        }
      }
    }
  }

  return errors;
}
