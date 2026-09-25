import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { TemplateGrid } from "./template-grid";

export default async function TemplatesPage() {
  await requireOrgContext();
  const templates = await prisma.surveyTemplate.findMany({ orderBy: { title: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
      <p className="mt-1 text-sm text-gray-500">Professional, editable survey templates across every category.</p>
      <TemplateGrid
        templates={templates.map((t) => ({ id: t.id, title: t.title, category: t.category, description: t.description ?? "" }))}
      />
    </div>
  );
}
