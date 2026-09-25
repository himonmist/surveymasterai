import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, recordAudit, requirePermissionOrError, resolveApiOrgContext } from "@/lib/api";
import { assertWithinSurveyLimit } from "@/lib/limits";
import { createSurveyFromStructure } from "@/lib/survey-service";
import { surveyStructureSchema } from "@surveymasterai/survey-engine";

export async function GET(request: Request) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const surveys = await prisma.survey.findMany({
    where: {
      organizationId: ctx.organizationId,
      ...(status && status !== "all" ? { status: status.toUpperCase() as never } : {}),
    },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const withCompletion = await Promise.all(
    surveys.map(async (survey) => {
      const completed = await prisma.surveyResponse.count({ where: { surveyId: survey.id, status: "COMPLETED" } });
      const total = survey._count.responses;
      return {
        id: survey.id,
        title: survey.title,
        status: survey.status,
        slug: survey.slug,
        ownerName: survey.createdBy.name,
        updatedAt: survey.updatedAt,
        responseCount: total,
        completionRate: total > 0 ? completed / total : 0,
      };
    }),
  );

  return NextResponse.json({ surveys: withCompletion });
}

const createSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("scratch"), title: z.string().min(1).default("Untitled Survey") }),
  z.object({ mode: z.literal("template"), templateId: z.string() }),
  z.object({ mode: z.literal("ai"), structure: surveyStructureSchema, aiQualityScore: z.number().optional() }),
]);

export async function POST(request: Request) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const permError = requirePermissionOrError(ctx, "survey:create");
  if (permError) return permError;

  const limitError = await assertWithinSurveyLimit(ctx.organizationId);
  if (limitError) return jsonError(limitError, 402);

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  let survey;

  if (parsed.data.mode === "scratch") {
    survey = await createSurveyFromStructure({
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      structure: {
        title: parsed.data.title,
        description: "",
        welcomeScreen: {},
        thankYouScreen: { title: "Thank you!", description: "Your response has been recorded." },
        sections: [{ title: "Section 1", order: 0, questions: [] }],
      },
    });
  } else if (parsed.data.mode === "template") {
    const template = await prisma.surveyTemplate.findUnique({ where: { id: parsed.data.templateId } });
    if (!template) return jsonError("Template not found", 404);
    const structure = surveyStructureSchema.parse(template.structure);
    survey = await createSurveyFromStructure({
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      structure,
    });
  } else {
    survey = await createSurveyFromStructure({
      organizationId: ctx.organizationId,
      createdById: ctx.userId,
      structure: parsed.data.structure,
      aiGenerated: true,
      aiQualityScore: parsed.data.aiQualityScore,
    });
  }

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "survey.created",
    entityType: "Survey",
    entityId: survey.id,
    metadata: { mode: parsed.data.mode },
  });

  return NextResponse.json({ survey });
}
