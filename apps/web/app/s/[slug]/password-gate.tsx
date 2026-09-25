"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function PasswordGate({ slug, incorrect }: { slug: string; incorrect: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    router.push(`/s/${slug}?password=${encodeURIComponent(password)}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-bold text-gray-900">This survey is password protected</h1>
      <form onSubmit={onSubmit} className="mt-6 w-full">
        <input
          type="password"
          className="input"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {incorrect && <p className="mt-2 text-sm text-red-600">Incorrect password.</p>}
        <button type="submit" className="btn-primary mt-3 w-full">
          Continue
        </button>
      </form>
    </div>
  );
}
