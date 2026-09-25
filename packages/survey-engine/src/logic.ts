import type { QuestionLogicInput } from "./schema";

export type AnswerValue = string | number | boolean | string[] | null | undefined;
export type AnswerMap = Record<string, AnswerValue>;

function evaluateCondition(
  condition: QuestionLogicInput["conditions"][number],
  answers: AnswerMap,
): boolean {
  const actual = answers[condition.questionId];

  switch (condition.operator) {
    case "is_answered":
      return actual !== undefined && actual !== null && actual !== "" && !(Array.isArray(actual) && actual.length === 0);
    case "is_not_answered":
      return actual === undefined || actual === null || actual === "" || (Array.isArray(actual) && actual.length === 0);
    case "equals":
      if (Array.isArray(actual)) return actual.includes(String(condition.value));
      return String(actual ?? "") === String(condition.value ?? "");
    case "not_equals":
      if (Array.isArray(actual)) return !actual.includes(String(condition.value));
      return String(actual ?? "") !== String(condition.value ?? "");
    case "contains":
      if (Array.isArray(actual)) return actual.includes(String(condition.value));
      return String(actual ?? "").includes(String(condition.value ?? ""));
    case "greater_than":
      return Number(actual) > Number(condition.value);
    case "less_than":
      return Number(actual) < Number(condition.value);
    default:
      return false;
  }
}

export function evaluateLogicRule(rule: QuestionLogicInput, answers: AnswerMap): boolean {
  const results = rule.conditions.map((condition) => evaluateCondition(condition, answers));
  return rule.match === "any" ? results.some(Boolean) : results.every(Boolean);
}

/**
 * Determines whether a question should be visible given the current answer
 * state and its own SHOW/HIDE logic rules. Default visibility is `true`;
 * a HIDE rule that matches hides it, a SHOW rule that matches (with any
 * other SHOW rules present) is required for it to remain visible.
 */
export function isQuestionVisible(logic: QuestionLogicInput[], answers: AnswerMap): boolean {
  const showRules = logic.filter((rule) => rule.action === "SHOW");
  const hideRules = logic.filter((rule) => rule.action === "HIDE");

  if (hideRules.some((rule) => evaluateLogicRule(rule, answers))) {
    return false;
  }
  if (showRules.length > 0) {
    return showRules.some((rule) => evaluateLogicRule(rule, answers));
  }
  return true;
}

export interface NavigationResult {
  action: "CONTINUE" | "SKIP_TO_SECTION" | "SKIP_TO_QUESTION" | "END_SURVEY";
  targetId?: string;
}

export function resolveNavigation(logic: QuestionLogicInput[], answers: AnswerMap): NavigationResult {
  for (const rule of logic) {
    if (rule.action === "SHOW" || rule.action === "HIDE") continue;
    if (evaluateLogicRule(rule, answers)) {
      return { action: rule.action, targetId: rule.targetId };
    }
  }
  return { action: "CONTINUE" };
}
