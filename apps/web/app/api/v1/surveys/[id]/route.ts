import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, recordAudit, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { fullSurveyInclude, surveyToStructure } from "@/lib/survey-service";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const full = await prisma.survey.findUniqueOrThrow({ where: { id: params.id }, include: fullSurveyInclude });

  return NextResponse.json({ survey: full, structure: surveyToStructure(full) });
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "PASSWORD_PROTECTED", "ORG_ONLY", "INVITE_ONLY"]).optional(),
  accessPassword: z.string().nullable().optional(),
  allowMultipleResponses: z.boolean().optional(),
  isAnonymous: z.boolean().optional(),
  theme: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  welcomeScreen: z.record(z.unknown()).optional(),
  thankYouScreen: z.record(z.unknown()).optional(),
  responseTarget: z.number().int().positive().nullable().optional(),
  closesAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const { closesAt, ...rest } = parsed.data;

  const updated = await prisma.survey.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(closesAt !== undefined ? { closesAt: closesAt ? new Date(closesAt) : null } : {}),
    } as never,
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "survey.updated",
    entityType: "Survey",
    entityId: updated.id,
  });

  return NextResponse.json({ survey: updated });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:delete_any");
  if (isNextResponse(survey)) return survey;

  await prisma.survey.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "survey.archived",
    entityType: "Survey",
    entityId: params.id,
  });

  return NextResponse.json({ success: true });
}
