import { NextResponse } from "next/server";
import { getPublishedSurveyBySlug } from "@/lib/public-survey";
import { surveyToStructure } from "@/lib/survey-service";

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const result = await getPublishedSurveyBySlug(params.slug);
  if ("error" in result) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.status });
  }

  const { survey } = result;
  const { searchParams } = new URL(request.url);

  if (survey.visibility === "PASSWORD_PROTECTED") {
    const password = searchParams.get("password");
    if (!password || password !== survey.accessPassword) {
      return NextResponse.json({ requiresPassword: true }, { status: 401 });
    }
  }

  return NextResponse.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    isAnonymous: survey.isAnonymous,
    allowMultipleResponses: survey.allowMultipleResponses,
    structure: surveyToStructure(survey),
  });
}
