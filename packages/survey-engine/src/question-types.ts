export const QUESTION_TYPES = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
  "YES_NO",
  "RATING",
  "STAR_RATING",
  "NPS",
  "LIKERT",
  "MATRIX",
  "RANKING",
  "SLIDER",
  "NUMBER",
  "CURRENCY",
  "DATE",
  "TIME",
  "DATETIME",
  "EMAIL",
  "PHONE",
  "ADDRESS",
  "FILE_UPLOAD",
  "IMAGE_CHOICE",
  "SIGNATURE",
  "LOCATION",
  "CONSENT",
  "STATEMENT",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

/** Question types that require a list of selectable options. */
export const OPTION_BASED_TYPES: readonly QuestionType[] = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
  "IMAGE_CHOICE",
  "RANKING",
  "LIKERT",
];

/** Question types that don't collect a respondent value (layout-only). */
export const NON_ANSWERABLE_TYPES: readonly QuestionType[] = ["STATEMENT"];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SHORT_TEXT: "Short Text",
  LONG_TEXT: "Long Text",
  SINGLE_CHOICE: "Single Choice",
  MULTIPLE_CHOICE: "Multiple Choice",
  DROPDOWN: "Dropdown",
  YES_NO: "Yes / No",
  RATING: "Rating",
  STAR_RATING: "Star Rating",
  NPS: "Net Promoter Score",
  LIKERT: "Likert Scale",
  MATRIX: "Matrix",
  RANKING: "Ranking",
  SLIDER: "Slider",
  NUMBER: "Number",
  CURRENCY: "Currency",
  DATE: "Date",
  TIME: "Time",
  DATETIME: "Date & Time",
  EMAIL: "Email",
  PHONE: "Phone",
  ADDRESS: "Address",
  FILE_UPLOAD: "File Upload",
  IMAGE_CHOICE: "Image Choice",
  SIGNATURE: "Signature",
  LOCATION: "Location",
  CONSENT: "Consent",
  STATEMENT: "Information Block",
};

export function requiresOptions(type: QuestionType): boolean {
  return OPTION_BASED_TYPES.includes(type);
}

export function isAnswerable(type: QuestionType): boolean {
  return !NON_ANSWERABLE_TYPES.includes(type);
}
