/**
 * Default plan seed data. Super Admin can edit all of this at runtime via the
 * `Plan` table — nothing here is hard-coded into the application logic, it is
 * only used to populate a sensible starting catalog on first install.
 */
export interface DefaultPlanDefinition {
  name: string;
  slug: string;
  description: string;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  maxSurveys: number;
  maxResponsesPerMonth: number;
  maxAiCreditsPerMonth: number;
  maxTeamMembers: number;
  maxStorageMb: number;
  features: string[];
  isCustom: boolean;
  sortOrder: number;
}

export const DEFAULT_PLANS: DefaultPlanDefinition[] = [
  {
    name: "Free",
    slug: "free",
    description: "Get started with AI-powered surveys at no cost.",
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    maxSurveys: 3,
    maxResponsesPerMonth: 100,
    maxAiCreditsPerMonth: 20,
    maxTeamMembers: 1,
    maxStorageMb: 100,
    features: ["basic_templates", "basic_analytics", "email_support"],
    isCustom: false,
    sortOrder: 0,
  },
  {
    name: "Starter",
    slug: "starter",
    description: "For small teams running regular surveys.",
    priceMonthlyCents: 2900,
    priceYearlyCents: 29000,
    maxSurveys: 25,
    maxResponsesPerMonth: 2000,
    maxAiCreditsPerMonth: 200,
    maxTeamMembers: 5,
    maxStorageMb: 5000,
    features: [
      "basic_templates",
      "advanced_analytics",
      "ai_survey_generation",
      "csv_export",
      "custom_branding",
    ],
    isCustom: false,
    sortOrder: 1,
  },
  {
    name: "Professional",
    slug: "professional",
    description: "Advanced AI, analytics, and collaboration for growing organizations.",
    priceMonthlyCents: 9900,
    priceYearlyCents: 99000,
    maxSurveys: 500,
    maxResponsesPerMonth: 50000,
    maxAiCreditsPerMonth: 1000,
    maxTeamMembers: 25,
    maxStorageMb: 50000,
    features: [
      "all_templates",
      "advanced_analytics",
      "ai_survey_generation",
      "ai_insights",
      "team_collaboration",
      "custom_branding",
      "api_access",
      "all_exports",
    ],
    isCustom: false,
    sortOrder: 2,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Custom limits, SSO-ready security, and dedicated support.",
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    maxSurveys: 999999,
    maxResponsesPerMonth: 999999,
    maxAiCreditsPerMonth: 999999,
    maxTeamMembers: 999999,
    maxStorageMb: 999999,
    features: [
      "all_templates",
      "advanced_analytics",
      "ai_survey_generation",
      "ai_insights",
      "team_collaboration",
      "white_label",
      "sso_ready",
      "api_access",
      "all_exports",
      "dedicated_support",
      "sla",
    ],
    isCustom: true,
    sortOrder: 3,
  },
];
