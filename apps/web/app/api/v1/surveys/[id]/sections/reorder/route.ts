import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";

const schema = z.object({
  updates: z.array(z.object({ id: z.string(), order: z.number().int() })),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  await prisma.$transaction(
    parsed.data.updates.map((u) => prisma.surveySection.update({ where: { id: u.id }, data: { order: u.order } })),
  );

  return NextResponse.json({ success: true });
}
