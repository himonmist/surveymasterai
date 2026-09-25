import { prisma } from "@/lib/db";

export async function TemplatesShowcase() {
  const templates = await prisma.surveyTemplate.findMany({ take: 8, orderBy: { createdAt: "asc" } });

  return (
    <section id="templates" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-900">Start from a professional template</h2>
        <p className="mt-3 text-gray-500">Business, HR, healthcare, education, research and more — fully editable.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((template) => (
          <div key={template.id} className="card p-5">
            <span className="badge bg-brand-50 text-brand-700">{template.category}</span>
            <h3 className="mt-3 text-sm font-semibold text-gray-900">{template.title}</h3>
            <p className="mt-1.5 text-xs text-gray-500">{template.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
