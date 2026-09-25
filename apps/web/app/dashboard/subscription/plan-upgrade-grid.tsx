"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPriceCents } from "@/lib/format";

interface PlanSummary {
  slug: string;
  name: string;
  description: string;
  priceMonthlyCents: number;
  isCustom: boolean;
}

export function PlanUpgradeGrid({ plans, currentPlanSlug }: { plans: PlanSummary[]; currentPlanSlug?: string }) {
  const router = useRouter();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upgrade(slug: string) {
    setLoadingSlug(slug);
    setError(null);
    const res = await fetch("/api/v1/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planSlug: slug, billingCycle: "monthly" }),
    });
    const data = await res.json().catch(() => ({}));
    setLoadingSlug(null);

    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3">
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug;
          return (
            <div key={plan.slug} className={`card p-5 ${isCurrent ? "ring-1 ring-brand-600" : ""}`}>
              <p className="text-sm font-bold text-gray-900">{plan.name}</p>
              <p className="mt-1 text-xs text-gray-500">{plan.description}</p>
              <p className="mt-3 text-xl font-extrabold text-gray-900">
                {plan.isCustom ? "Custom" : formatPriceCents(plan.priceMonthlyCents)}
                {!plan.isCustom && <span className="text-sm font-medium text-gray-400">/mo</span>}
              </p>
              <button
                onClick={() => upgrade(plan.slug)}
                disabled={isCurrent || loadingSlug === plan.slug || plan.isCustom}
                className={`mt-4 w-full ${isCurrent ? "btn-secondary" : "btn-primary"}`}
              >
                {isCurrent ? "Current plan" : plan.isCustom ? "Contact sales" : loadingSlug === plan.slug ? "Switching..." : "Switch plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
