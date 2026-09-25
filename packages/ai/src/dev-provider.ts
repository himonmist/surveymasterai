import type { QuestionInput, QuestionType, SectionInput, SurveyStructureInput } from "@surveymasterai/survey-engine";
import { findBestTemplate } from "./templates";
import type {
  AIProvider,
  AnalyzeResponsesInput,
  AnalyzeResponsesResult,
  ChatAssistantInput,
  ChatAssistantResult,
  ExecutiveReportInput,
  ExecutiveReportResult,
  GenerateSurveyInput,
  GenerateSurveyResult,
  ImproveSurveyInput,
  ImproveSurveyResult,
  QualityCheckResult,
  QualityIssue,
  TokenUsage,
} from "./types";

function estimateUsage(input: string, output: unknown): TokenUsage {
  const promptTokens = Math.ceil(input.length / 4);
  const completionTokens = Math.ceil(JSON.stringify(output).length / 4);
  return { promptTokens, completionTokens };
}

const GENERIC_QUESTION_TYPES: QuestionType[] = ["RATING", "SINGLE_CHOICE", "LIKERT", "MULTIPLE_CHOICE", "LONG_TEXT", "YES_NO"];

const STOP_PHRASES = [
  "create a survey",
  "create a questionnaire",
  "generate a survey",
  "generate a questionnaire",
  "make a survey",
  "build a survey",
  "i want a survey",
  "i need a survey",
  "survey about",
  "survey for",
  "questionnaire about",
  "questionnaire for",
  "about",
  "for",
];

function extractTopic(prompt: string): string {
  let topic = prompt.trim().replace(/\.$/, "");
  const lower = topic.toLowerCase();
  for (const phrase of STOP_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx === 0) {
      topic = topic.slice(phrase.length).trim();
    }
  }
  return topic.length > 0 ? topic : prompt.trim();
}

function titleCase(text: string): string {
  return text
    .split(" ")
    .map((word) => (word.length > 0 ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function buildGenericSurvey(prompt: string): SurveyStructureInput {
  const topic = extractTopic(prompt);
  const title = titleCase(topic).length > 60 ? "Custom Survey" : `${titleCase(topic)} Survey`;

  const questions: QuestionInput[] = [
    {
      type: "RATING",
      title: `Overall, how would you rate your experience with ${topic}?`,
      required: true,
      order: 0,
      config: { min: 1, max: 5 },
      options: [],
      logic: [],
      tags: [],
    },
    {
      type: "LIKERT",
      title: `${titleCase(topic)} meets my expectations.`,
      required: false,
      order: 1,
      config: {},
      options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].map((label, i) => ({
        label,
        value: label.toLowerCase().replace(/\s+/g, "_"),
        order: i,
      })),
      logic: [],
      tags: [],
    },
    {
      type: "MULTIPLE_CHOICE",
      title: `Which aspects of ${topic} are most important to you?`,
      required: false,
      order: 2,
      config: {},
      options: ["Quality", "Price", "Speed", "Support", "Ease of use"].map((label, i) => ({
        label,
        value: label.toLowerCase(),
        order: i,
      })),
      logic: [],
      tags: [],
    },
    {
      type: "NPS",
      title: `How likely are you to recommend ${topic} to others?`,
      required: false,
      order: 3,
      config: {},
      options: [],
      logic: [],
      tags: [],
    },
    {
      type: "LONG_TEXT",
      title: `What could be improved about ${topic}?`,
      required: false,
      order: 4,
      config: {},
      options: [],
      logic: [],
      tags: [],
    },
    {
      type: "SINGLE_CHOICE",
      title: "How often do you interact with this?",
      required: false,
      order: 5,
      config: {},
      options: ["Daily", "Weekly", "Monthly", "Rarely", "First time"].map((label, i) => ({
        label,
        value: label.toLowerCase(),
        order: i,
      })),
      logic: [],
      tags: [],
    },
  ];

  return {
    title,
    description: `Help us understand your experience with ${topic}. Your feedback shapes what we do next.`,
    welcomeScreen: { title, description: "This survey takes about 2-3 minutes to complete.", buttonLabel: "Start" },
    thankYouScreen: { title: "Thank you!", description: "We appreciate your feedback." },
    sections: [{ title: "Your Feedback", order: 0, questions }],
  };
}

function cloneSectionsWithIds(sections: SectionInput[]): SectionInput[] {
  // The dev provider generates fresh structures every time; ids are assigned
  // by the caller (API layer) when persisting to the database.
  return sections;
}

function flattenQuestions(structure: SurveyStructureInput): QuestionInput[] {
  return structure.sections.flatMap((s) => s.questions);
}

const LEADING_PATTERNS = [/don't you (agree|think)/i, /how (great|amazing|wonderful)/i, /wouldn't you say/i];

function detectQualityIssues(structure: SurveyStructureInput): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const questions = flattenQuestions(structure);
  const seenTitles = new Map<string, number>();

  for (const question of questions) {
    const normalized = question.title.trim().toLowerCase();
    seenTitles.set(normalized, (seenTitles.get(normalized) ?? 0) + 1);

    if (LEADING_PATTERNS.some((pattern) => pattern.test(question.title))) {
      issues.push({ questionId: question.id, severity: "high", type: "leading", message: `"${question.title}" may lead the respondent toward a particular answer.` });
    }

    if (/ and /i.test(question.title) && question.type !== "STATEMENT") {
      issues.push({ questionId: question.id, severity: "medium", type: "double_barrelled", message: `"${question.title}" may be asking about two things at once.` });
    }

    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(question.type) && question.options.length < 2) {
      issues.push({ questionId: question.id, severity: "high", type: "missing_options", message: `"${question.title}" needs at least two answer options.` });
    }

    if (question.type === "LIKERT" && question.options.length > 0 && question.options.length % 2 === 0) {
      issues.push({ questionId: question.id, severity: "low", type: "unbalanced_scale", message: `"${question.title}" uses an even-numbered scale with no neutral midpoint.` });
    }
  }

  for (const [title, count] of seenTitles) {
    if (count > 1) {
      issues.push({ severity: "medium", type: "duplicate", message: `The question "${title}" appears ${count} times.` });
    }
  }

  if (questions.length > 25) {
    issues.push({ severity: "medium", type: "too_long", message: `This survey has ${questions.length} questions, which may reduce completion rates.` });
  }

  return issues;
}

export class DevAIProvider implements AIProvider {
  readonly name = "dev";

  async generateSurvey(input: GenerateSurveyInput): Promise<GenerateSurveyResult> {
    const template = findBestTemplate(input.prompt);
    const structure: SurveyStructureInput = template
      ? {
          title: template.title,
          description: template.description,
          welcomeScreen: { title: template.title, description: "This should only take a few minutes.", buttonLabel: "Start" },
          thankYouScreen: { title: "Thank you!", description: "Your feedback has been recorded." },
          sections: cloneSectionsWithIds(structuredCloneSections(template.sections)),
        }
      : buildGenericSurvey(input.prompt);

    return { structure, usage: estimateUsage(input.prompt, structure) };
  }

  async improveSurvey(input: ImproveSurveyInput): Promise<ImproveSurveyResult> {
    let structure = structuredCloneStructure(input.structure);
    const notes: string[] = [];

    if (input.actions.includes("remove_duplicates")) {
      const seen = new Set<string>();
      structure.sections = structure.sections.map((section) => ({
        ...section,
        questions: section.questions.filter((question) => {
          const key = question.title.trim().toLowerCase();
          if (seen.has(key)) {
            notes.push(`Removed duplicate question: "${question.title}"`);
            return false;
          }
          seen.add(key);
          return true;
        }),
      }));
    }

    if (input.actions.includes("improve_wording")) {
      structure.sections = structure.sections.map((section) => ({
        ...section,
        questions: section.questions.map((question) => {
          let title = question.title.trim();
          for (const pattern of LEADING_PATTERNS) {
            if (pattern.test(title)) {
              title = title.replace(pattern, "How do you feel about");
              notes.push(`Reworded leading question to: "${title}"`);
            }
          }
          if (!title.endsWith("?") && !title.endsWith(".")) title += "?";
          return { ...question, title };
        }),
      }));
    }

    if (input.actions.includes("reduce_length")) {
      const allQuestions = flattenQuestions(structure);
      if (allQuestions.length > 10) {
        const keep = new Set(allQuestions.filter((q) => q.required).map((q) => q.title));
        let kept = 0;
        structure.sections = structure.sections.map((section) => ({
          ...section,
          questions: section.questions.filter((question) => {
            if (keep.has(question.title) || kept < 10) {
              kept += 1;
              return true;
            }
            notes.push(`Removed optional question to shorten survey: "${question.title}"`);
            return false;
          }),
        }));
      }
    }

    if (input.actions.includes("add_consent")) {
      const consentSection: SectionInput = {
        title: "Consent",
        order: -1,
        questions: [
          {
            type: "CONSENT",
            title: "I consent to my responses being used for research and analysis purposes.",
            required: true,
            order: 0,
            config: {},
            options: [],
            logic: [],
            tags: [],
          },
        ],
      };
      structure.sections = [consentSection, ...structure.sections];
      notes.push("Added a consent statement at the beginning of the survey.");
    }

    if (input.actions.includes("add_demographics")) {
      const demoSection: SectionInput = {
        title: "Demographics",
        order: 999,
        questions: [
          { type: "SINGLE_CHOICE", title: "Age range", required: false, order: 0, config: {}, options: ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"].map((l, i) => ({ label: l, value: l, order: i })), logic: [], tags: [] },
          { type: "SINGLE_CHOICE", title: "Gender", required: false, order: 1, config: {}, options: ["Female", "Male", "Non-binary", "Prefer not to say"].map((l, i) => ({ label: l, value: l, order: i })), logic: [], tags: [] },
        ],
      };
      structure.sections = [...structure.sections, demoSection];
      notes.push("Added a demographics section at the end of the survey.");
    }

    if (input.actions.includes("generate_thank_you")) {
      structure.thankYouScreen = { title: "Thank you for your time!", description: "Your responses help us improve." };
      notes.push("Generated a thank-you message.");
    }

    return { structure, notes, usage: estimateUsage(JSON.stringify(input), structure) };
  }

  async checkQuality(structure: SurveyStructureInput): Promise<QualityCheckResult> {
    const issues = detectQualityIssues(structure);
    const deduction = issues.reduce((sum, issue) => sum + (issue.severity === "high" ? 15 : issue.severity === "medium" ? 8 : 3), 0);
    const score = Math.max(0, Math.min(100, 100 - deduction));
    return { score, issues, usage: estimateUsage(JSON.stringify(structure), issues) };
  }

  async analyzeResponses(input: AnalyzeResponsesInput): Promise<AnalyzeResponsesResult> {
    const entries = Object.entries(input.aggregates);
    if (entries.length === 0) {
      return {
        answer: `There isn't enough response data yet for "${input.surveyTitle}" to answer that question.`,
        usage: estimateUsage(input.question, {}),
      };
    }

    const lines = entries.slice(0, 8).map(([key, value]) => `- ${humanizeKey(key)}: ${formatValue(value)}`);
    const answer = [
      `Based on the authorized response data for "${input.surveyTitle}", here's what stands out:`,
      ...lines,
    ].join("\n");

    return { answer, usage: estimateUsage(input.question, answer) };
  }

  async generateExecutiveReport(input: ExecutiveReportInput): Promise<ExecutiveReportResult> {
    const entries = Object.entries(input.aggregates);
    const summary = `This report summarizes response data collected for "${input.surveyTitle}" across ${entries.length} tracked metrics.`;
    const keyFindings = entries.slice(0, 5).map(([key, value]) => `${humanizeKey(key)}: ${formatValue(value)}`);
    const positiveFindings = keyFindings.slice(0, Math.ceil(keyFindings.length / 2));
    const negativeFindings = keyFindings.slice(Math.ceil(keyFindings.length / 2));
    const recommendations = [
      "Continue monitoring response trends on a weekly cadence.",
      "Follow up with segments showing below-average satisfaction.",
      "Share these findings with stakeholders and revisit in 30 days.",
    ];

    return {
      summary,
      keyFindings,
      positiveFindings,
      negativeFindings,
      recommendations,
      usage: estimateUsage(JSON.stringify(input), keyFindings),
    };
  }

  async chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantResult> {
    const structure = structuredCloneStructure(input.structure);
    const instruction = input.instruction.trim();
    const lower = instruction.toLowerCase();

    const addMatch = lower.match(/add (\d+|a|an|one|two|three|four|five)\s+questions?\s+about\s+(.+)/);
    if (addMatch) {
      const count = parseCount(addMatch[1]!);
      const topic = addMatch[2]!.replace(/\.$/, "");
      const lastSection = structure.sections[structure.sections.length - 1]!;
      const startOrder = lastSection.questions.length;
      for (let i = 0; i < count; i += 1) {
        const type = GENERIC_QUESTION_TYPES[i % GENERIC_QUESTION_TYPES.length]!;
        lastSection.questions.push(buildQuestionForType(type, topic, startOrder + i));
      }
      return { structure, reply: `Added ${count} question(s) about "${topic}".`, usage: estimateUsage(instruction, structure) };
    }

    const changeTypeMatch = lower.match(/make question (\d+)\s+(?:a|an)?\s*(.+?)(?:\s+scale)?$/);
    if (changeTypeMatch) {
      const index = parseInt(changeTypeMatch[1]!, 10) - 1;
      const typeText = changeTypeMatch[2]!.trim();
      const newType = mapTextToQuestionType(typeText);
      const allQuestions = flattenQuestions(structure);
      const target = allQuestions[index];
      if (target && newType) {
        target.type = newType;
        if (newType === "LIKERT" && target.options.length === 0) {
          target.options = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].map((l, i) => ({ label: l, value: l, order: i }));
        }
        return { structure, reply: `Changed question ${index + 1} to ${newType.replace("_", " ").toLowerCase()}.`, usage: estimateUsage(instruction, structure) };
      }
    }

    if (lower.includes("shorter") || lower.includes("reduce")) {
      const allQuestions = flattenQuestions(structure);
      const keep = 10;
      if (allQuestions.length > keep) {
        let kept = 0;
        structure.sections = structure.sections.map((section) => ({
          ...section,
          questions: section.questions.filter((question) => {
            if (question.required || kept < keep) {
              if (!question.required) kept += 1;
              return true;
            }
            return false;
          }),
        }));
        return { structure, reply: "Trimmed the survey to focus on the most essential questions.", usage: estimateUsage(instruction, structure) };
      }
      return { structure, reply: "This survey is already concise.", usage: estimateUsage(instruction, structure) };
    }

    return {
      structure,
      reply: `I wasn't able to confidently apply "${instruction}" automatically. Try phrasing it like "add 3 questions about pricing", "make question 2 a likert scale", or "make this survey shorter".`,
      usage: estimateUsage(instruction, structure),
    };
  }
}

function parseCount(text: string): number {
  const map: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5 };
  const num = Number(text);
  return Number.isFinite(num) && num > 0 ? Math.min(num, 10) : map[text] ?? 1;
}

function mapTextToQuestionType(text: string): QuestionType | undefined {
  const normalized = text.toLowerCase();
  if (normalized.includes("likert")) return "LIKERT";
  if (normalized.includes("nps")) return "NPS";
  if (normalized.includes("star")) return "STAR_RATING";
  if (normalized.includes("rating")) return "RATING";
  if (normalized.includes("yes") || normalized.includes("no")) return "YES_NO";
  if (normalized.includes("multiple")) return "MULTIPLE_CHOICE";
  if (normalized.includes("single") || normalized.includes("choice")) return "SINGLE_CHOICE";
  if (normalized.includes("dropdown")) return "DROPDOWN";
  if (normalized.includes("number")) return "NUMBER";
  if (normalized.includes("long")) return "LONG_TEXT";
  if (normalized.includes("short") || normalized.includes("text")) return "SHORT_TEXT";
  if (normalized.includes("date")) return "DATE";
  if (normalized.includes("email")) return "EMAIL";
  return undefined;
}

function buildQuestionForType(type: QuestionType, topic: string, order: number): QuestionInput {
  const base: QuestionInput = { type, title: `Question about ${topic}`, required: false, order, config: {}, options: [], logic: [], tags: [] };
  switch (type) {
    case "RATING":
      return { ...base, title: `How would you rate ${topic}?`, config: { min: 1, max: 5 } };
    case "SINGLE_CHOICE":
      return { ...base, title: `Which best describes your view on ${topic}?`, options: ["Very positive", "Positive", "Neutral", "Negative", "Very negative"].map((l, i) => ({ label: l, value: l, order: i })) };
    case "LIKERT":
      return { ...base, title: `${titleCase(topic)} meets my expectations.`, options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].map((l, i) => ({ label: l, value: l, order: i })) };
    case "MULTIPLE_CHOICE":
      return { ...base, title: `Which aspects of ${topic} matter most to you?`, options: ["Quality", "Price", "Speed", "Support"].map((l, i) => ({ label: l, value: l, order: i })) };
    case "YES_NO":
      return { ...base, title: `Have you had a positive experience with ${topic}?` };
    default:
      return { ...base, title: `What are your thoughts on ${topic}?` };
  }
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => formatValue(v)).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

function structuredCloneStructure(structure: SurveyStructureInput): SurveyStructureInput {
  return JSON.parse(JSON.stringify(structure));
}

function structuredCloneSections(sections: SectionInput[]): SectionInput[] {
  return JSON.parse(JSON.stringify(sections));
}
