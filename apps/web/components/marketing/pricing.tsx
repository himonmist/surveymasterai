import Link from "next/link";
import { Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPriceCents } from "@/lib/format";

export async function Pricing() {
  const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });

  return (
    <section id="pricing" className="bg-gray-50 px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
        <p className="mt-3 text-gray-500">Every plan includes AI survey generation. Upgrade any time.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, index) => {
          const featured = index === 2;
          return (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border p-6 ${
                featured ? "border-brand-600 bg-white shadow-panel ring-1 ring-brand-600" : "border-gray-200 bg-white"
              }`}
            >
              {featured && (
                <span className="badge mb-3 w-fit bg-brand-600 text-white">Most popular</span>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              <p className="mt-4 text-3xl font-extrabold text-gray-900">
                {plan.isCustom ? "Custom" : formatPriceCents(plan.priceMonthlyCents)}
                {!plan.isCustom && <span className="text-base font-medium text-gray-400">/mo</span>}
              </p>
              <ul className="mt-6 flex-1 space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  {plan.maxSurveys >= 999999 ? "Unlimited surveys" : `${plan.maxSurveys} surveys`}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  {plan.maxResponsesPerMonth >= 999999
                    ? "Unlimited responses/month"
                    : `${plan.maxResponsesPerMonth.toLocaleString()} responses/month`}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  {plan.maxAiCreditsPerMonth >= 999999
                    ? "Unlimited AI credits"
                    : `${plan.maxAiCreditsPerMonth} AI credits/month`}
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  {plan.maxTeamMembers >= 999999 ? "Unlimited team members" : `${plan.maxTeamMembers} team members`}
                </li>
              </ul>
              <Link
                href="/register"
                className={`mt-6 w-full text-center ${featured ? "btn-primary" : "btn-secondary"}`}
              >
                {plan.isCustom ? "Contact sales" : "Start Free"}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
