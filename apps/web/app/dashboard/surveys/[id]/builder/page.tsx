import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { SurveyBuilder } from "@/components/builder/survey-builder";
import type { BuilderSurvey } from "@/components/builder/types";

export default async function SurveyBuilderPage({ params }: { params: { id: string } }) {
  const { org } = await requireOrgContext();

  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } }, logic: true },
          },
        },
      },
    },
  });

  if (!survey || survey.organizationId !== org.organizationId) notFound();

  return (
    <div className="h-[calc(100vh-6rem)]">
      <SurveyBuilder initialSurvey={survey as unknown as BuilderSurvey} />
    </div>
  );
}
