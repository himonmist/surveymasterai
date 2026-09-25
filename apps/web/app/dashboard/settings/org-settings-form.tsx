"use client";

import { useState, type FormEvent } from "react";

interface OrgFields {
  name: string;
  brandColor: string;
  website: string;
  industry: string;
  logoUrl: string;
}

export function OrgSettingsForm({ organization, readOnly }: { organization: OrgFields; readOnly: boolean }) {
  const [form, setForm] = useState(organization);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const res = await fetch("/api/v1/organizations/current", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">Organization name</label>
        <input
          className="input"
          disabled={readOnly}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="label">Brand color</label>
          <input
            type="color"
            className="h-10 w-full rounded-lg border border-gray-300"
            disabled={readOnly}
            value={form.brandColor}
            onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
          />
        </div>
        <div className="flex-1">
          <label className="label">Industry</label>
          <input
            className="input"
            disabled={readOnly}
            value={form.industry}
            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <label className="label">Website</label>
        <input
          className="input"
          disabled={readOnly}
          placeholder="https://"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        />
      </div>
      <div>
        <label className="label">Logo URL</label>
        <input
          className="input"
          disabled={readOnly}
          placeholder="https://"
          value={form.logoUrl}
          onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      {!readOnly && (
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </button>
      )}
    </form>
  );
}
