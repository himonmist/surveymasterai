import { prisma } from "./db";
import { generateSurveySlug } from "@surveymasterai/auth";
import type { SurveyStructureInput } from "@surveymasterai/survey-engine";
import type { Prisma, QuestionType } from "@surveymasterai/database";

export async function createSurveyFromStructure(params: {
  organizationId: string;
  createdById: string;
  structure: SurveyStructureInput;
  aiGenerated?: boolean;
  aiQualityScore?: number;
}) {
  const { organizationId, createdById, structure, aiGenerated = false, aiQualityScore } = params;

  return prisma.survey.create({
    data: {
      organizationId,
      createdById,
      title: structure.title,
      description: structure.description,
      slug: generateSurveySlug(),
      status: "DRAFT",
      visibility: "PRIVATE",
      aiGenerated,
      aiQualityScore,
      welcomeScreen: structure.welcomeScreen as unknown as Prisma.InputJsonValue,
      thankYouScreen: structure.thankYouScreen as unknown as Prisma.InputJsonValue,
      sections: {
        create: structure.sections.map((section, sectionIndex) => ({
          title: section.title,
          description: section.description,
          order: section.order ?? sectionIndex,
          questions: {
            create: section.questions.map((question, questionIndex) => ({
              type: question.type as QuestionType,
              title: question.title,
              description: question.description,
              helpText: question.helpText,
              placeholder: question.placeholder,
              required: question.required,
              order: question.order ?? questionIndex,
              config: question.config as Prisma.InputJsonValue,
              tags: question.tags,
              options: {
                create: question.options.map((opt, optIndex) => ({
                  label: opt.label,
                  value: opt.value,
                  order: opt.order ?? optIndex,
                })),
              },
            })),
          },
        })),
      },
    },
    include: fullSurveyInclude,
  });
}

export const fullSurveyInclude = {
  sections: {
    orderBy: { order: "asc" as const },
    include: {
      questions: {
        orderBy: { order: "asc" as const },
        include: {
          options: { orderBy: { order: "asc" as const } },
          logic: true,
        },
      },
    },
  },
};

export type FullSurvey = Prisma.SurveyGetPayload<{ include: typeof fullSurveyInclude }>;

export function surveyToStructure(survey: FullSurvey): SurveyStructureInput {
  return {
    title: survey.title,
    description: survey.description ?? undefined,
    welcomeScreen: (survey.welcomeScreen as SurveyStructureInput["welcomeScreen"]) ?? {},
    thankYouScreen: (survey.thankYouScreen as SurveyStructureInput["thankYouScreen"]) ?? {},
    sections: survey.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description ?? undefined,
      order: section.order,
      questions: section.questions.map((question) => ({
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description ?? undefined,
        helpText: question.helpText ?? undefined,
        placeholder: question.placeholder ?? undefined,
        required: question.required,
        order: question.order,
        config: (question.config as SurveyStructureInput["sections"][number]["questions"][number]["config"]) ?? {},
        tags: question.tags,
        options: question.options.map((opt) => ({ id: opt.id, label: opt.label, value: opt.value, order: opt.order })),
        logic: question.logic.map((l) => ({
          id: l.id,
          conditions: l.conditions as never,
          match: "all",
          action: l.action,
          targetId: l.targetId ?? undefined,
        })),
      })),
    })),
  };
}

/**
 * Replaces a survey's entire structure (used by AI improve/chat-assistant
 * actions and full-survey imports). Deletes and recreates sections in a
 * transaction — acceptable because AI edits operate on the whole survey at
 * once rather than a single field.
 */
export async function replaceSurveyStructure(surveyId: string, structure: SurveyStructureInput) {
  await prisma.$transaction([
    prisma.surveySection.deleteMany({ where: { surveyId } }),
    prisma.survey.update({
      where: { id: surveyId },
      data: {
        title: structure.title,
        description: structure.description,
        welcomeScreen: structure.welcomeScreen as unknown as Prisma.InputJsonValue,
        thankYouScreen: structure.thankYouScreen as unknown as Prisma.InputJsonValue,
        currentVersion: { increment: 1 },
        sections: {
          create: structure.sections.map((section, sectionIndex) => ({
            title: section.title,
            description: section.description,
            order: section.order ?? sectionIndex,
            questions: {
              create: section.questions.map((question, questionIndex) => ({
                type: question.type as QuestionType,
                title: question.title,
                description: question.description,
                required: question.required,
                order: question.order ?? questionIndex,
                config: question.config as Prisma.InputJsonValue,
                tags: question.tags,
                options: {
                  create: question.options.map((opt, optIndex) => ({
                    label: opt.label,
                    value: opt.value,
                    order: opt.order ?? optIndex,
                  })),
                },
              })),
            },
          })),
        },
      },
    }),
  ]);

  return prisma.survey.findUniqueOrThrow({ where: { id: surveyId }, include: fullSurveyInclude });
}
