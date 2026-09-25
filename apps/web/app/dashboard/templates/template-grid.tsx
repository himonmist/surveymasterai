"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface TemplateSummary {
  id: string;
  title: string;
  category: string;
  description: string;
}

export function TemplateGrid({ templates }: { templates: TemplateSummary[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const categories = useMemo(() => ["all", ...Array.from(new Set(templates.map((t) => t.category)))], [templates]);
  const filtered = category === "all" ? templates : templates.filter((t) => t.category === category);

  async function useTemplate(templateId: string) {
    setLoadingId(templateId);
    const res = await fetch("/api/v1/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "template", templateId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoadingId(null);
    if (res.ok) router.push(`/dashboard/surveys/${data.survey.id}/builder`);
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`badge ${category === c ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="card flex flex-col p-5">
            <span className="badge w-fit bg-brand-50 text-brand-700">{t.category}</span>
            <p className="mt-3 text-sm font-semibold text-gray-900">{t.title}</p>
            <p className="mt-1 flex-1 text-xs text-gray-500">{t.description}</p>
            <button onClick={() => useTemplate(t.id)} disabled={loadingId === t.id} className="btn-secondary mt-4">
              {loadingId === t.id ? "Creating..." : "Use this template"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
