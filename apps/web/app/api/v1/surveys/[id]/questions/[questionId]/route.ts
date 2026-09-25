import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { QUESTION_TYPES, questionConfigSchema, questionLogicSchema, questionOptionSchema } from "@surveymasterai/survey-engine";

const schema = z.object({
  type: z.enum(QUESTION_TYPES).optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  helpText: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  sectionId: z.string().optional(),
  config: questionConfigSchema.optional(),
  tags: z.array(z.string()).optional(),
  options: z.array(questionOptionSchema).optional(),
  logic: z.array(questionLogicSchema).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string; questionId: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const { options, logic, config, sectionId, ...rest } = parsed.data;

  const question = await prisma.$transaction(async (tx) => {
    if (options) {
      await tx.questionOption.deleteMany({ where: { questionId: params.questionId } });
    }
    if (logic) {
      await tx.questionLogic.deleteMany({ where: { questionId: params.questionId } });
    }

    return tx.question.update({
      where: { id: params.questionId },
      data: {
        ...rest,
        ...(sectionId ? { sectionId } : {}),
        ...(config ? { config: config as never } : {}),
        ...(options
          ? { options: { create: options.map((o, i) => ({ label: o.label, value: o.value, order: o.order ?? i })) } }
          : {}),
        ...(logic
          ? {
              logic: {
                create: logic.map((l) => ({
                  conditions: l.conditions as never,
                  action: l.action,
                  targetId: l.targetId,
                })),
              },
            }
          : {}),
      },
      include: { options: { orderBy: { order: "asc" } }, logic: true },
    });
  });

  return NextResponse.json({ question });
}

export async function DELETE(_request: Request, { params }: { params: { id: string; questionId: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  await prisma.question.delete({ where: { id: params.questionId } });

  return NextResponse.json({ success: true });
}
