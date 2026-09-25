import type { PrismaClient, OrgRole, QuestionType, SurveyStatus } from "@prisma/client";
import { hashPassword } from "@surveymasterai/auth";
import { DEFAULT_PLANS } from "@surveymasterai/config";
import { SURVEY_TEMPLATES } from "@surveymasterai/ai";
import { randomBytes } from "node:crypto";

export const DEMO_PASSWORD = "Demo123!";

function slug(bytes = 4): string {
  return randomBytes(bytes).toString("hex");
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Seeds demo plans, templates, a demo organization/users, sample surveys and
 * responses. Safe to call more than once: plans/templates/users/org are
 * upserted, and the demo-survey batch is skipped if it already exists.
 */
export async function seedDemoData(prisma: PrismaClient, log: (msg: string) => void = console.log) {
  log("Seeding SurveyMasterAI demo data...");

  const plans = new Map<string, string>();
  for (const def of DEFAULT_PLANS) {
    const plan = await prisma.plan.upsert({
      where: { slug: def.slug },
      update: {
        name: def.name,
        description: def.description,
        priceMonthlyCents: def.priceMonthlyCents,
        priceYearlyCents: def.priceYearlyCents,
        maxSurveys: def.maxSurveys,
        maxResponsesPerMonth: def.maxResponsesPerMonth,
        maxAiCreditsPerMonth: def.maxAiCreditsPerMonth,
        maxTeamMembers: def.maxTeamMembers,
        maxStorageMb: def.maxStorageMb,
        features: def.features,
        isCustom: def.isCustom,
        sortOrder: def.sortOrder,
      },
      create: {
        name: def.name,
        slug: def.slug,
        description: def.description,
        priceMonthlyCents: def.priceMonthlyCents,
        priceYearlyCents: def.priceYearlyCents,
        maxSurveys: def.maxSurveys,
        maxResponsesPerMonth: def.maxResponsesPerMonth,
        maxAiCreditsPerMonth: def.maxAiCreditsPerMonth,
        maxTeamMembers: def.maxTeamMembers,
        maxStorageMb: def.maxStorageMb,
        features: def.features,
        isCustom: def.isCustom,
        sortOrder: def.sortOrder,
      },
    });
    plans.set(def.slug, plan.id);
  }
  log(`  - ${plans.size} plans`);

  const existingTemplates = await prisma.surveyTemplate.count();
  if (existingTemplates === 0) {
    for (const t of SURVEY_TEMPLATES) {
      await prisma.surveyTemplate.create({
        data: {
          title: t.title,
          category: t.category,
          description: t.description,
          structure: t as unknown as object,
          isPublic: true,
        },
      });
    }
  }
  log(`  - ${SURVEY_TEMPLATES.length} survey templates`);

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await prisma.user.upsert({
    where: { email: "admin@surveymasterai.dev" },
    update: {},
    create: {
      email: "admin@surveymasterai.dev",
      name: "Platform Super Admin",
      passwordHash,
      isSuperAdmin: true,
      emailVerified: new Date(),
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "acme-corporation" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corporation",
      brandColor: "#6D28D9",
      industry: "Technology",
      size: "51-200",
    },
  });

  const proPlanId = plans.get("professional")!;
  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      planId: proPlanId,
      status: "ACTIVE",
      billingCycle: "monthly",
      paymentProvider: "dev",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const demoUsers: { email: string; name: string; role: OrgRole }[] = [
    { email: "sarah@acme-demo.com", name: "Sarah Chen", role: "ORG_ADMIN" },
    { email: "marcus@acme-demo.com", name: "Marcus Webb", role: "MANAGER" },
    { email: "priya@acme-demo.com", name: "Priya Sharma", role: "MANAGER" },
    { email: "james@acme-demo.com", name: "James Wilson", role: "RESPONDENT" },
  ];

  const userIdByEmail = new Map<string, string>();
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, passwordHash, emailVerified: new Date() },
    });
    userIdByEmail.set(u.email, user.id);
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: { role: u.role },
      create: { organizationId: org.id, userId: user.id, role: u.role },
    });
  }

  log(`  - organization "${org.name}" with ${demoUsers.length} members`);

  const sarahId = userIdByEmail.get("sarah@acme-demo.com")!;
  const marcusId = userIdByEmail.get("marcus@acme-demo.com")!;
  const priyaId = userIdByEmail.get("priya@acme-demo.com")!;

  const existingSurveys = await prisma.survey.count({ where: { organizationId: org.id } });

  if (existingSurveys === 0) {
    const surveySpecs: { templateIndex: number; owner: string; status: SurveyStatus; responseCount: number }[] = [
      { templateIndex: 0, owner: sarahId, status: "PUBLISHED", responseCount: 342 },
      { templateIndex: 2, owner: marcusId, status: "PUBLISHED", responseCount: 128 },
      { templateIndex: 4, owner: priyaId, status: "PUBLISHED", responseCount: 24 },
      { templateIndex: 1, owner: sarahId, status: "PUBLISHED", responseCount: 89 },
      { templateIndex: 5, owner: sarahId, status: "DRAFT", responseCount: 0 },
      { templateIndex: 3, owner: marcusId, status: "DRAFT", responseCount: 0 },
      { templateIndex: 6, owner: priyaId, status: "PAUSED", responseCount: 15 },
      { templateIndex: 7, owner: marcusId, status: "PUBLISHED", responseCount: 41 },
    ];

    for (const spec of surveySpecs) {
      const template = SURVEY_TEMPLATES[spec.templateIndex]!;
      const survey = await prisma.survey.create({
        data: {
          organizationId: org.id,
          createdById: spec.owner,
          title: template.title,
          description: template.description,
          status: spec.status,
          slug: slug(),
          visibility: "PUBLIC",
          aiGenerated: true,
          aiQualityScore: 80 + Math.floor(Math.random() * 20),
          publishedAt: spec.status === "PUBLISHED" || spec.status === "PAUSED" ? new Date() : null,
          sections: {
            create: template.sections.map((section) => ({
              title: section.title,
              description: section.description,
              order: section.order,
              questions: {
                create: section.questions.map((question) => ({
                  type: question.type as QuestionType,
                  title: question.title,
                  description: question.description,
                  required: question.required,
                  order: question.order,
                  config: question.config as object,
                  options: {
                    create: question.options.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                      order: opt.order,
                    })),
                  },
                })),
              },
            })),
          },
        },
        include: { sections: { include: { questions: { include: { options: true } } } } },
      });

      if (spec.responseCount > 0) {
        await generateResponses(prisma, survey, spec.responseCount);
      }
    }

    log(`  - ${surveySpecs.length} demo surveys with responses`);

    await prisma.notification.createMany({
      data: [
        {
          userId: sarahId,
          type: "SURVEY_PUBLISHED",
          title: "Survey published",
          body: "Customer Satisfaction Q3 2026 is now live.",
        },
        {
          userId: sarahId,
          type: "RESPONSE_TARGET_REACHED",
          title: "Response milestone reached",
          body: "Employee Pulse Check has crossed 100 responses.",
        },
      ],
      skipDuplicates: true,
    });
  } else {
    log(`  - demo surveys already exist (${existingSurveys}), skipping`);
  }

  log("Seed complete.");
}

interface DemoSurveyWithQuestions {
  id: string;
  sections: {
    questions: {
      id: string;
      type: QuestionType;
      options: { id: string; value: string }[];
    }[];
  }[];
}

async function generateResponses(prisma: PrismaClient, survey: DemoSurveyWithQuestions, count: number) {
  const questions = survey.sections.flatMap((s) => s.questions);

  for (let i = 0; i < count; i += 1) {
    const isCompleted = Math.random() > 0.15;
    const startedAt = new Date(Date.now() - Math.floor(Math.random() * 25) * 24 * 60 * 60 * 1000);
    const completedAt = isCompleted ? new Date(startedAt.getTime() + (60 + Math.random() * 600) * 1000) : null;

    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        anonymousId: `anon_${slug(6)}`,
        status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
        startedAt,
        completedAt,
        completionTimeSeconds: completedAt ? Math.round((completedAt.getTime() - startedAt.getTime()) / 1000) : null,
        metadata: { device: pickRandom(["desktop", "mobile", "tablet"]), source: pickRandom(["email", "link", "qr"]) },
      },
    });

    const answeredQuestions = isCompleted ? questions : questions.slice(0, Math.floor(questions.length * Math.random()));

    for (const question of answeredQuestions) {
      const value = randomAnswerFor(question);
      if (value === undefined) continue;
      await prisma.responseAnswer.create({
        data: {
          responseId: response.id,
          questionId: question.id,
          value: value as object,
          textValue: typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : String(value),
        },
      });
    }
  }
}

const SAMPLE_COMMENTS = [
  "Great experience overall, keep it up!",
  "Could be faster, but I'm satisfied.",
  "Support team was very helpful.",
  "Not sure this met my expectations.",
  "Would love to see more customization options.",
  "Excellent service, will recommend to others.",
];

function randomAnswerFor(question: { type: QuestionType; options: { value: string }[] }): unknown {
  switch (question.type) {
    case "RATING":
    case "STAR_RATING":
      return Math.ceil(Math.random() * 5);
    case "NPS":
      return Math.floor(Math.random() * 11);
    case "YES_NO":
      return Math.random() > 0.5 ? "yes" : "no";
    case "SINGLE_CHOICE":
    case "DROPDOWN":
    case "LIKERT":
      return question.options.length ? pickRandom(question.options).value : undefined;
    case "MULTIPLE_CHOICE":
      return question.options.length ? pickN(question.options, 1 + Math.floor(Math.random() * 2)).map((o) => o.value) : undefined;
    case "LONG_TEXT":
    case "SHORT_TEXT":
      return pickRandom(SAMPLE_COMMENTS);
    case "EMAIL":
      return `respondent${Math.floor(Math.random() * 1000)}@example.com`;
    case "NUMBER":
    case "SLIDER":
      return Math.floor(Math.random() * 100);
    default:
      return undefined;
  }
}
