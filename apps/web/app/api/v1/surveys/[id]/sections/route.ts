import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";

const schema = z.object({
  title: z.string().min(1).default("Untitled Section"),
  description: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const maxOrder = await prisma.surveySection.aggregate({
    where: { surveyId: params.id },
    _max: { order: true },
  });

  const section = await prisma.surveySection.create({
    data: {
      surveyId: params.id,
      title: parsed.data.title,
      description: parsed.data.description,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: { questions: { include: { options: true, logic: true } } },
  });

  return NextResponse.json({ section });
}
