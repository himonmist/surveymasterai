import { notFound } from "next/navigation";
import { getPublishedSurveyBySlug } from "@/lib/public-survey";
import { surveyToStructure } from "@/lib/survey-service";
import { SurveyRespondent } from "@/components/respondent/survey-respondent";
import { PasswordGate } from "./password-gate";

export default async function PublicSurveyPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { password?: string };
}) {
  const result = await getPublishedSurveyBySlug(params.slug);
  if ("error" in result) notFound();

  const { survey } = result;

  if (survey.visibility === "PASSWORD_PROTECTED" && searchParams.password !== survey.accessPassword) {
    return <PasswordGate slug={survey.slug} incorrect={Boolean(searchParams.password)} />;
  }

  const structure = surveyToStructure(survey);

  return (
    <SurveyRespondent slug={survey.slug} title={survey.title} description={survey.description} structure={structure} />
  );
}
