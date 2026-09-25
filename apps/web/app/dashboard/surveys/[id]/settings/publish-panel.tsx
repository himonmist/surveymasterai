"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Copy, Check } from "lucide-react";

interface SurveySettings {
  id: string;
  status: string;
  visibility: string;
  accessPassword: string | null;
  allowMultipleResponses: boolean;
  isAnonymous: boolean;
}

const STATUS_FLOW: { key: string; label: string; description: string }[] = [
  { key: "DRAFT", label: "Draft", description: "Only visible to your team." },
  { key: "PUBLISHED", label: "Published", description: "Live and accepting responses." },
  { key: "PAUSED", label: "Paused", description: "Link works, but new responses are blocked." },
  { key: "CLOSED", label: "Closed", description: "No longer accepting responses." },
];

export function PublishPanel({ survey, publicUrl }: { survey: SurveySettings; publicUrl: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(survey.status);
  const [visibility, setVisibility] = useState(survey.visibility);
  const [password, setPassword] = useState(survey.accessPassword ?? "");
  const [allowMultiple, setAllowMultiple] = useState(survey.allowMultipleResponses);
  const [anonymous, setAnonymous] = useState(survey.isAnonymous);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, publicUrl, { width: 180, margin: 1, color: { dark: "#111827" } });
    }
  }, [publicUrl]);

  async function changeStatus(next: string) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/v1/surveys/${survey.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    setStatus(next);
    router.refresh();
  }

  async function saveAccess() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/v1/surveys/${survey.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibility,
        accessPassword: visibility === "PASSWORD_PROTECTED" ? password : null,
        allowMultipleResponses: allowMultiple,
        isAnonymous: anonymous,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900">Status</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUS_FLOW.map((s) => (
            <button
              key={s.key}
              onClick={() => changeStatus(s.key)}
              disabled={loading || status === s.key}
              className={`rounded-lg border p-3 text-left text-xs ${
                status === s.key ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <p className="font-semibold">{s.label}</p>
              <p className="mt-1 text-[11px] text-gray-400">{s.description}</p>
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="card grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Share link</h2>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={publicUrl} className="input text-xs" />
            <button onClick={copyLink} className="btn-secondary shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">Share this link via email, social, or embed it in your product.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">QR Code</h2>
          <canvas ref={canvasRef} className="mt-2 rounded-lg border border-gray-100" />
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900">Access control</h2>
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">Visibility</label>
            <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="PUBLIC">Public — anyone with the link</option>
              <option value="PASSWORD_PROTECTED">Password protected</option>
              <option value="ORG_ONLY">Organization members only</option>
              <option value="PRIVATE">Private (invite only)</option>
            </select>
          </div>
          {visibility === "PASSWORD_PROTECTED" && (
            <div>
              <label className="label">Password</label>
              <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} />
            Allow multiple responses per respondent
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            Collect responses anonymously
          </label>
          <button onClick={saveAccess} disabled={loading} className="btn-primary">
            Save access settings
          </button>
        </div>
      </div>
    </div>
  );
}
