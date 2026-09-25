import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";

const schema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string; sectionId: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const section = await prisma.surveySection.update({
    where: { id: params.sectionId },
    data: parsed.data,
  });

  return NextResponse.json({ section });
}

export async function DELETE(_request: Request, { params }: { params: { id: string; sectionId: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  await prisma.surveySection.delete({ where: { id: params.sectionId } });

  return NextResponse.json({ success: true });
}
