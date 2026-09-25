"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function InviteMemberForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MANAGER");
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInviteUrl(null);
    setLoading(true);

    const res = await fetch("/api/v1/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setInviteUrl(data.inviteUrl);
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="label" htmlFor="invite-email">
          Invite by email
        </label>
        <input
          id="invite-email"
          type="email"
          required
          className="input"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="invite-role">
          Role
        </label>
        <select id="invite-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="ORG_ADMIN">Org Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="RESPONDENT">Respondent</option>
        </select>
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Sending..." : "Send invite"}
      </button>

      {error && <p className="text-sm text-red-600 sm:ml-3">{error}</p>}
      {inviteUrl && (
        <p className="w-full text-xs text-gray-500 sm:ml-3 sm:w-auto">
          Invite link (no email provider configured):{" "}
          <a href={inviteUrl} className="font-medium text-brand-600 underline">
            {inviteUrl}
          </a>
        </p>
      )}
    </form>
  );
}
