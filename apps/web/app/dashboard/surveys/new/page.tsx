import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { NewSurveyFlow } from "./new-survey-flow";

export default async function NewSurveyPage() {
  await requireOrgContext();
  const templates = await prisma.surveyTemplate.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Create a survey</h1>
      <p className="mt-1 text-sm text-gray-500">Choose how you&apos;d like to start.</p>
      <NewSurveyFlow templates={templates.map((t) => ({ id: t.id, title: t.title, category: t.category, description: t.description ?? "" }))} />
    </div>
  );
}
