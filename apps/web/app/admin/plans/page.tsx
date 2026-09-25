import { prisma } from "@/lib/db";
import { PlanEditor } from "./plan-editor";

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Plans</h1>
      <p className="mt-1 text-sm text-gray-400">
        Edit pricing and limits for every plan. Changes apply immediately — nothing here is hard-coded.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {plans.map((plan) => (
          <PlanEditor
            key={plan.id}
            plan={{
              id: plan.id,
              name: plan.name,
              priceMonthlyCents: plan.priceMonthlyCents,
              priceYearlyCents: plan.priceYearlyCents,
              maxSurveys: plan.maxSurveys,
              maxResponsesPerMonth: plan.maxResponsesPerMonth,
              maxAiCreditsPerMonth: plan.maxAiCreditsPerMonth,
              maxTeamMembers: plan.maxTeamMembers,
              isActive: plan.isActive,
            }}
          />
        ))}
      </div>
    </div>
  );
}
