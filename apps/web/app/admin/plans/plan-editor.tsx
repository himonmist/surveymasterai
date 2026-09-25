"use client";

import { useState } from "react";

interface PlanFields {
  id: string;
  name: string;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  maxSurveys: number;
  maxResponsesPerMonth: number;
  maxAiCreditsPerMonth: number;
  maxTeamMembers: number;
  isActive: boolean;
}

export function PlanEditor({ plan }: { plan: PlanFields }) {
  const [form, setForm] = useState(plan);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/v1/admin/plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceMonthlyCents: form.priceMonthlyCents,
        priceYearlyCents: form.priceYearlyCents,
        maxSurveys: form.maxSurveys,
        maxResponsesPerMonth: form.maxResponsesPerMonth,
        maxAiCreditsPerMonth: form.maxAiCreditsPerMonth,
        maxTeamMembers: form.maxTeamMembers,
        isActive: form.isActive,
      }),
    });
    setSaving(false);
    setSaved(true);
  }

  function field(key: keyof PlanFields, label: string) {
    return (
      <div>
        <label className="text-xs text-gray-500">{label}</label>
        <input
          type="number"
          className="input py-1.5 text-sm"
          value={form[key] as number}
          onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
        />
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{plan.name}</h3>
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
          Active
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {field("priceMonthlyCents", "Monthly price (cents)")}
        {field("priceYearlyCents", "Yearly price (cents)")}
        {field("maxSurveys", "Max surveys")}
        {field("maxResponsesPerMonth", "Max responses/month")}
        {field("maxAiCreditsPerMonth", "Max AI credits/month")}
        {field("maxTeamMembers", "Max team members")}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save changes"}
        </button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </div>
  );
}
