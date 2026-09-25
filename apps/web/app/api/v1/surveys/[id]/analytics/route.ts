import { NextResponse } from "next/server";
import { resolveApiOrgContext } from "@/lib/api";
import { getOwnedSurveyOrError, isNextResponse } from "@/lib/survey-auth";
import { getSurveyAggregates } from "@/lib/analytics";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const survey = await getOwnedSurveyOrError(params.id, ctx, "survey:view_analytics");
  if (isNextResponse(survey)) return survey;

  const aggregates = await getSurveyAggregates(params.id);
  return NextResponse.json(aggregates);
}
