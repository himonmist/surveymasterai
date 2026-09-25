import type { QuestionInput, SectionInput } from "@surveymasterai/survey-engine";

export interface SurveyTemplateDefinition {
  keywords: string[];
  title: string;
  description: string;
  category: string;
  sections: SectionInput[];
}

function q(partial: Partial<QuestionInput> & Pick<QuestionInput, "type" | "title">): QuestionInput {
  return {
    required: false,
    order: 0,
    config: {},
    options: [],
    logic: [],
    tags: [],
    ...partial,
  };
}

function opts(labels: string[]) {
  return labels.map((label, index) => ({ label, value: label.toLowerCase().replace(/\s+/g, "_"), order: index }));
}

const LIKERT_5 = opts(["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]);

export const SURVEY_TEMPLATES: SurveyTemplateDefinition[] = [
  {
    keywords: ["customer satisfaction", "csat", "customer feedback", "client satisfaction"],
    title: "Customer Satisfaction Survey",
    category: "business",
    description: "Measure how satisfied your customers are with your product or service.",
    sections: [
      {
        title: "Overall Satisfaction",
        order: 0,
        questions: [
          q({ type: "RATING", title: "Overall, how satisfied are you with our product/service?", required: true, order: 0, config: { min: 1, max: 5 } }),
          q({ type: "NPS", title: "How likely are you to recommend us to a friend or colleague?", required: true, order: 1 }),
          q({ type: "SINGLE_CHOICE", title: "How long have you been a customer?", order: 2, options: opts(["Less than a month", "1-6 months", "6-12 months", "1-3 years", "More than 3 years"]) }),
        ],
      },
      {
        title: "Product Experience",
        order: 1,
        questions: [
          q({ type: "LIKERT", title: "The product meets my needs.", order: 0, options: LIKERT_5 }),
          q({ type: "LIKERT", title: "The product is easy to use.", order: 1, options: LIKERT_5 }),
          q({ type: "MULTIPLE_CHOICE", title: "Which features do you use most often?", order: 2, options: opts(["Dashboard", "Reporting", "Integrations", "Mobile app", "Customer support"]) }),
          q({ type: "LONG_TEXT", title: "What could we do to improve your experience?", order: 3 }),
        ],
      },
      {
        title: "About You",
        order: 2,
        questions: [
          q({ type: "SINGLE_CHOICE", title: "What is your role?", order: 0, options: opts(["Individual contributor", "Manager", "Director", "Executive", "Other"]) }),
          q({ type: "EMAIL", title: "Email (optional, if you'd like us to follow up)", order: 1 }),
        ],
      },
    ],
  },
  {
    keywords: ["nps", "net promoter"],
    title: "Net Promoter Score (NPS) Survey",
    category: "business",
    description: "A focused NPS survey to track customer loyalty over time.",
    sections: [
      {
        title: "NPS",
        order: 0,
        questions: [
          q({ type: "NPS", title: "How likely are you to recommend us to a friend or colleague?", required: true, order: 0 }),
          q({ type: "LONG_TEXT", title: "What is the primary reason for your score?", order: 1 }),
        ],
      },
    ],
  },
  {
    keywords: ["employee engagement", "employee satisfaction", "workplace"],
    title: "Employee Engagement Survey",
    category: "hr",
    description: "Understand how engaged and motivated your employees are.",
    sections: [
      {
        title: "Engagement",
        order: 0,
        questions: [
          q({ type: "LIKERT", title: "I understand how my work contributes to the company's goals.", order: 0, options: LIKERT_5 }),
          q({ type: "LIKERT", title: "I feel motivated to go beyond my formal job responsibilities.", order: 1, options: LIKERT_5 }),
          q({ type: "LIKERT", title: "I would recommend this company as a great place to work.", order: 2, options: LIKERT_5 }),
          q({ type: "RATING", title: "How satisfied are you with your work-life balance?", order: 3, config: { min: 1, max: 5 } }),
        ],
      },
      {
        title: "Management & Culture",
        order: 1,
        questions: [
          q({ type: "LIKERT", title: "My manager provides useful feedback regularly.", order: 0, options: LIKERT_5 }),
          q({ type: "SINGLE_CHOICE", title: "How long have you worked at the company?", order: 1, options: opts(["Less than 6 months", "6 months - 1 year", "1-3 years", "3-5 years", "More than 5 years"]) }),
          q({ type: "LONG_TEXT", title: "What would most improve your experience at work?", order: 2 }),
        ],
      },
      {
        title: "Demographics",
        order: 2,
        questions: [
          q({ type: "SINGLE_CHOICE", title: "Department", order: 0, options: opts(["Engineering", "Sales", "Marketing", "Customer Support", "Operations", "HR", "Finance", "Other"]) }),
        ],
      },
    ],
  },
  {
    keywords: ["exit interview", "offboarding"],
    title: "Exit Interview Survey",
    category: "hr",
    description: "Collect candid feedback from departing employees.",
    sections: [
      {
        title: "Your Experience",
        order: 0,
        questions: [
          q({ type: "SINGLE_CHOICE", title: "What is the primary reason for leaving?", required: true, order: 0, options: opts(["Career growth", "Compensation", "Management", "Work-life balance", "Relocation", "Other"]) }),
          q({ type: "RATING", title: "Overall, how would you rate your experience working here?", order: 1, config: { min: 1, max: 5 } }),
          q({ type: "LONG_TEXT", title: "What could we have done differently to retain you?", order: 2 }),
          q({ type: "YES_NO", title: "Would you consider working here again in the future?", order: 3 }),
        ],
      },
    ],
  },
  {
    keywords: ["event feedback", "conference", "workshop"],
    title: "Event Feedback Survey",
    category: "events",
    description: "Gather attendee feedback to improve future events.",
    sections: [
      {
        title: "Event Feedback",
        order: 0,
        questions: [
          q({ type: "RATING", title: "How would you rate the event overall?", required: true, order: 0, config: { min: 1, max: 5 } }),
          q({ type: "MULTIPLE_CHOICE", title: "Which sessions did you find most valuable?", order: 1, options: opts(["Keynote", "Workshops", "Panel discussion", "Networking", "Q&A"]) }),
          q({ type: "LIKERT", title: "The event was well organized.", order: 2, options: LIKERT_5 }),
          q({ type: "LONG_TEXT", title: "What topics would you like to see at future events?", order: 3 }),
          q({ type: "YES_NO", title: "Would you attend a future event?", order: 4 }),
        ],
      },
    ],
  },
  {
    keywords: ["patient satisfaction", "healthcare", "clinic", "hospital"],
    title: "Patient Satisfaction Survey",
    category: "healthcare",
    description: "Measure patient experience and satisfaction with care received.",
    sections: [
      {
        title: "Your Visit",
        order: 0,
        questions: [
          q({ type: "RATING", title: "How would you rate the quality of care you received?", required: true, order: 0, config: { min: 1, max: 5 } }),
          q({ type: "LIKERT", title: "Staff treated me with courtesy and respect.", order: 1, options: LIKERT_5 }),
          q({ type: "LIKERT", title: "I was seen in a reasonable amount of time.", order: 2, options: LIKERT_5 }),
          q({ type: "YES_NO", title: "Were your questions answered clearly?", order: 3 }),
          q({ type: "LONG_TEXT", title: "Do you have any other comments about your visit?", order: 4 }),
        ],
      },
    ],
  },
  {
    keywords: ["course evaluation", "student feedback", "training evaluation", "teacher evaluation"],
    title: "Course Evaluation Survey",
    category: "education",
    description: "Collect student feedback to improve course quality.",
    sections: [
      {
        title: "Course Content",
        order: 0,
        questions: [
          q({ type: "LIKERT", title: "The course objectives were clearly communicated.", order: 0, options: LIKERT_5 }),
          q({ type: "LIKERT", title: "The course material was relevant and useful.", order: 1, options: LIKERT_5 }),
          q({ type: "RATING", title: "How would you rate the instructor overall?", order: 2, config: { min: 1, max: 5 } }),
          q({ type: "LONG_TEXT", title: "What would you improve about this course?", order: 3 }),
        ],
      },
    ],
  },
  {
    keywords: ["market research", "brand awareness", "product research"],
    title: "Market Research Survey",
    category: "research",
    description: "Understand market perceptions and preferences.",
    sections: [
      {
        title: "Market Awareness",
        order: 0,
        questions: [
          q({ type: "SINGLE_CHOICE", title: "Have you heard of our brand before today?", order: 0, options: opts(["Yes", "No"]) }),
          q({ type: "MULTIPLE_CHOICE", title: "Which brands do you currently use in this category?", order: 1, options: opts(["Brand A", "Brand B", "Brand C", "Brand D", "None"]) }),
          q({ type: "RATING", title: "How likely are you to purchase this product?", order: 2, config: { min: 1, max: 5 } }),
          q({ type: "LONG_TEXT", title: "What factors most influence your purchase decision?", order: 3 }),
        ],
      },
      {
        title: "Demographics",
        order: 1,
        questions: [
          q({ type: "SINGLE_CHOICE", title: "Age range", order: 0, options: opts(["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"]) }),
          q({ type: "SINGLE_CHOICE", title: "Gender", order: 1, options: opts(["Female", "Male", "Non-binary", "Prefer not to say"]) }),
        ],
      },
    ],
  },
];

export function findBestTemplate(prompt: string): SurveyTemplateDefinition | undefined {
  const lower = prompt.toLowerCase();
  let best: { template: SurveyTemplateDefinition; score: number } | undefined;

  for (const template of SURVEY_TEMPLATES) {
    const score = template.keywords.filter((keyword) => lower.includes(keyword)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { template, score };
    }
  }

  return best?.template;
}
