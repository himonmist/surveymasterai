"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function InviteAcceptForm({
  token,
  email,
  needsAccount,
}: {
  token: string;
  email: string;
  needsAccount: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/v1/invitations/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(needsAccount ? { name, password } : {}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    if (data.requiresLogin) {
      if (needsAccount) {
        await signIn("credentials", { email, password, redirect: false });
      }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div>
        <label className="label">Email</label>
        <input className="input" value={email} disabled />
      </div>

      {needsAccount && (
        <>
          <div>
            <label className="label" htmlFor="name">
              Your name
            </label>
            <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Set a password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Joining..." : needsAccount ? "Create account & join" : "Accept invitation"}
      </button>

      {!needsAccount && <p className="text-xs text-gray-400">You must be signed in as {email} for this to work.</p>}
    </form>
  );
}
