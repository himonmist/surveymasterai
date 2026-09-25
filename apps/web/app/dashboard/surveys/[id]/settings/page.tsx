import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { PublishPanel } from "./publish-panel";

export default async function SurveySettingsPage({ params }: { params: { id: string } }) {
  const { org } = await requireOrgContext();

  const survey = await prisma.survey.findUnique({ where: { id: params.id } });
  if (!survey || survey.organizationId !== org.organizationId) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${appUrl}/s/${survey.slug}`;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Publish & Share</h1>
      <p className="mt-1 text-sm text-gray-500">{survey.title}</p>

      <PublishPanel
        survey={{
          id: survey.id,
          status: survey.status,
          visibility: survey.visibility,
          accessPassword: survey.accessPassword,
          allowMultipleResponses: survey.allowMultipleResponses,
          isAnonymous: survey.isAnonymous,
        }}
        publicUrl={publicUrl}
      />
    </div>
  );
}
