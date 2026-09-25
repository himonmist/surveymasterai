import { prisma } from "./db";
import type { QuestionType } from "@surveymasterai/database";

export interface TrendPoint {
  date: string;
  responses: number;
}

export async function getOrgDashboardStats(organizationId: string) {
  const [activeSurveys, totalResponses, completedResponses, teamMembers, allSurveys] = await Promise.all([
    prisma.survey.count({ where: { organizationId, status: "PUBLISHED" } }),
    prisma.surveyResponse.count({ where: { survey: { organizationId } } }),
    prisma.surveyResponse.count({ where: { survey: { organizationId }, status: "COMPLETED" } }),
    prisma.organizationMember.count({ where: { organizationId, isActive: true } }),
    prisma.survey.count({ where: { organizationId, status: { not: "ARCHIVED" } } }),
  ]);

  const completionRate = totalResponses > 0 ? completedResponses / totalResponses : 0;

  const since = new Date();
  since.setDate(since.getDate() - 29);

  const responses = await prisma.surveyResponse.findMany({
    where: { survey: { organizationId }, startedAt: { gte: since } },
    select: { startedAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of responses) {
    const key = r.startedAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const trend: TrendPoint[] = Array.from(buckets.entries()).map(([date, responses]) => ({ date, responses }));

  return {
    activeSurveys,
    totalSurveys: allSurveys,
    totalResponses,
    completionRate,
    teamMembers,
    trend,
  };
}

const CHOICE_TYPES: QuestionType[] = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "LIKERT", "YES_NO", "IMAGE_CHOICE"];
const NUMERIC_TYPES: QuestionType[] = ["RATING", "STAR_RATING", "NUMBER", "SLIDER"];
const TEXT_TYPES: QuestionType[] = ["SHORT_TEXT", "LONG_TEXT"];

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "of", "in", "on", "for", "with", "it",
  "this", "that", "i", "we", "you", "they", "very", "so", "be", "at", "as", "not", "have", "has", "had",
]);

export interface QuestionAggregate {
  questionId: string;
  title: string;
  type: QuestionType;
  totalAnswers: number;
  optionCounts?: { label: string; count: number }[];
  average?: number;
  min?: number;
  max?: number;
  npsScore?: number;
  npsBreakdown?: { promoters: number; passives: number; detractors: number };
  topWords?: { word: string; count: number }[];
  sampleAnswers?: string[];
}

export async function getSurveyAggregates(surveyId: string) {
  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } }, answers: true },
          },
        },
      },
    },
  });

  const [totalResponses, completedResponses] = await Promise.all([
    prisma.surveyResponse.count({ where: { surveyId } }),
    prisma.surveyResponse.count({ where: { surveyId, status: "COMPLETED" } }),
  ]);

  const completedTimes = await prisma.surveyResponse.findMany({
    where: { surveyId, status: "COMPLETED", completionTimeSeconds: { not: null } },
    select: { completionTimeSeconds: true },
  });
  const avgCompletionTimeSeconds =
    completedTimes.length > 0
      ? Math.round(completedTimes.reduce((sum, r) => sum + (r.completionTimeSeconds ?? 0), 0) / completedTimes.length)
      : 0;

  const perQuestion: QuestionAggregate[] = [];

  for (const section of survey.sections) {
    for (const question of section.questions) {
      const answers = question.answers;
      const base: QuestionAggregate = {
        questionId: question.id,
        title: question.title,
        type: question.type,
        totalAnswers: answers.length,
      };

      if (question.type === "NPS") {
        const values = answers.map((a) => Number(a.value)).filter((v) => !Number.isNaN(v));
        const promoters = values.filter((v) => v >= 9).length;
        const passives = values.filter((v) => v >= 7 && v <= 8).length;
        const detractors = values.filter((v) => v <= 6).length;
        const npsScore = values.length > 0 ? Math.round(((promoters - detractors) / values.length) * 100) : 0;
        base.npsBreakdown = { promoters, passives, detractors };
        base.npsScore = npsScore;
      } else if (CHOICE_TYPES.includes(question.type)) {
        const counts = new Map<string, number>();
        for (const opt of question.options) counts.set(opt.label, 0);
        for (const answer of answers) {
          const values = Array.isArray(answer.value) ? answer.value : [answer.value];
          for (const v of values) {
            const opt = question.options.find((o) => o.value === v || o.label === v);
            const label = opt?.label ?? String(v);
            counts.set(label, (counts.get(label) ?? 0) + 1);
          }
        }
        base.optionCounts = Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
      } else if (NUMERIC_TYPES.includes(question.type)) {
        const values = answers.map((a) => Number(a.value)).filter((v) => !Number.isNaN(v));
        if (values.length > 0) {
          base.average = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
          base.min = Math.min(...values);
          base.max = Math.max(...values);
        }
      } else if (TEXT_TYPES.includes(question.type)) {
        const texts = answers.map((a) => a.textValue ?? String(a.value ?? "")).filter(Boolean);
        const wordCounts = new Map<string, number>();
        for (const text of texts) {
          for (const word of text.toLowerCase().match(/[a-z']+/g) ?? []) {
            if (word.length < 3 || STOPWORDS.has(word)) continue;
            wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
          }
        }
        base.topWords = Array.from(wordCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }));
        base.sampleAnswers = texts.slice(0, 5);
      }

      perQuestion.push(base);
    }
  }

  return {
    surveyId,
    surveyTitle: survey.title,
    totalResponses,
    completedResponses,
    completionRate: totalResponses > 0 ? completedResponses / totalResponses : 0,
    avgCompletionTimeSeconds,
    perQuestion,
  };
}

export type SurveyAggregates = Awaited<ReturnType<typeof getSurveyAggregates>>;

/** Flattens aggregates into a plain key/value map the AI layer can reason about generically. */
export function aggregatesToAiInput(aggregates: SurveyAggregates): Record<string, unknown> {
  const result: Record<string, unknown> = {
    totalResponses: aggregates.totalResponses,
    completionRate: `${Math.round(aggregates.completionRate * 100)}%`,
    avgCompletionTimeSeconds: aggregates.avgCompletionTimeSeconds,
  };
  for (const q of aggregates.perQuestion) {
    if (q.optionCounts) result[q.title] = q.optionCounts.map((o) => `${o.label}: ${o.count}`);
    else if (q.average !== undefined) result[q.title] = `avg ${q.average} (min ${q.min}, max ${q.max})`;
    else if (q.npsScore !== undefined) result[q.title] = `NPS ${q.npsScore} (${q.npsBreakdown?.promoters} promoters, ${q.npsBreakdown?.detractors} detractors)`;
    else if (q.topWords) result[q.title] = q.topWords.map((w) => `${w.word} (${w.count})`);
  }
  return result;
}
