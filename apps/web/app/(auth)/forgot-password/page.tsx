"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    // Dev fallback: no email provider configured yet, so we just acknowledge
    // the request. See packages for the EmailProvider abstraction to wire up.
    setSent(true);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
      <p className="mt-1 text-sm text-gray-500">We&apos;ll send a reset link to your email.</p>

      {sent ? (
        <p className="mt-8 rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
          If an account exists for {email}, a reset link has been sent.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Work email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Send reset link
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
