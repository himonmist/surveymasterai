import { NextResponse } from "next/server";
import { getAIProvider } from "@surveymasterai/ai";
import { resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { fullSurveyInclude, surveyToStructure } from "@/lib/survey-service";
import { prisma } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:edit_any");
  if (isNextResponse(survey)) return survey;

  const full = await prisma.survey.findUniqueOrThrow({ where: { id: params.id }, include: fullSurveyInclude });
  const structure = surveyToStructure(full);

  const provider = getAIProvider();
  const result = await provider.checkQuality(structure);

  await prisma.survey.update({ where: { id: params.id }, data: { aiQualityScore: result.score } });

  return NextResponse.json(result);
}
