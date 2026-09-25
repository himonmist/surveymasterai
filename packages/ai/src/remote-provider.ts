import { surveyStructureSchema, type SurveyStructureInput } from "@surveymasterai/survey-engine";
import { DevAIProvider } from "./dev-provider";
import type {
  AIProvider,
  AnalyzeResponsesInput,
  AnalyzeResponsesResult,
  ChatAssistantInput,
  ChatAssistantResult,
  ExecutiveReportInput,
  ExecutiveReportResult,
  GenerateSurveyInput,
  GenerateSurveyResult,
  ImproveSurveyInput,
  ImproveSurveyResult,
  QualityCheckResult,
} from "./types";

const SURVEY_GENERATION_SYSTEM_PROMPT = `You are a survey design expert. Given a user's request, produce a JSON object describing a complete survey.
The JSON must match this shape exactly (no markdown, no commentary, JSON only):
{
  "title": string,
  "description": string,
  "welcomeScreen": { "title": string, "description": string, "buttonLabel": string },
  "thankYouScreen": { "title": string, "description": string },
  "sections": [{
    "title": string, "order": number,
    "questions": [{
      "type": "SHORT_TEXT"|"LONG_TEXT"|"SINGLE_CHOICE"|"MULTIPLE_CHOICE"|"DROPDOWN"|"YES_NO"|"RATING"|"STAR_RATING"|"NPS"|"LIKERT"|"MATRIX"|"RANKING"|"SLIDER"|"NUMBER"|"CURRENCY"|"DATE"|"TIME"|"DATETIME"|"EMAIL"|"PHONE"|"ADDRESS"|"FILE_UPLOAD"|"IMAGE_CHOICE"|"SIGNATURE"|"LOCATION"|"CONSENT"|"STATEMENT",
      "title": string, "required": boolean, "order": number,
      "options": [{ "label": string, "value": string, "order": number }]
    }]
  }]
}`;

interface RemoteProviderConfig {
  apiKey: string;
  model: string;
}

/**
 * Thin abstraction over a hosted LLM used for survey generation and analysis.
 * Both OpenAI and Anthropic implementations request strict JSON back and
 * validate it against the survey-engine schema before returning it to the
 * caller. If the request fails or the model returns invalid JSON, we fall
 * back to the deterministic DevAIProvider so the application never breaks
 * because an external AI service is unavailable or misconfigured.
 */
abstract class RemoteAIProviderBase implements AIProvider {
  abstract readonly name: string;
  protected readonly fallback = new DevAIProvider();

  protected abstract completeJSON(system: string, user: string): Promise<string>;

  async generateSurvey(input: GenerateSurveyInput): Promise<GenerateSurveyResult> {
    try {
      const raw = await this.completeJSON(SURVEY_GENERATION_SYSTEM_PROMPT, input.prompt);
      const parsed: unknown = JSON.parse(raw);
      const structure: SurveyStructureInput = surveyStructureSchema.parse(parsed);
      return { structure, usage: { promptTokens: Math.ceil(input.prompt.length / 4), completionTokens: Math.ceil(raw.length / 4) } };
    } catch (error) {
      console.error(`[ai:${this.name}] generateSurvey failed, falling back to dev provider`, error);
      return this.fallback.generateSurvey(input);
    }
  }

  async improveSurvey(input: ImproveSurveyInput): Promise<ImproveSurveyResult> {
    // Structural edits are deterministic and don't need a model round trip;
    // reuse the same rule engine the dev provider uses for consistency.
    return this.fallback.improveSurvey(input);
  }

  async checkQuality(structure: SurveyStructureInput): Promise<QualityCheckResult> {
    return this.fallback.checkQuality(structure);
  }

  async analyzeResponses(input: AnalyzeResponsesInput): Promise<AnalyzeResponsesResult> {
    try {
      const prompt = `Survey: ${input.surveyTitle}\nQuestion: ${input.question}\nData: ${JSON.stringify(input.aggregates)}\n\nAnswer the question using ONLY the data provided.`;
      const answer = await this.completeJSON("You are a research analyst. Reply in plain text, not JSON.", prompt);
      return { answer, usage: { promptTokens: Math.ceil(prompt.length / 4), completionTokens: Math.ceil(answer.length / 4) } };
    } catch (error) {
      console.error(`[ai:${this.name}] analyzeResponses failed, falling back to dev provider`, error);
      return this.fallback.analyzeResponses(input);
    }
  }

  async generateExecutiveReport(input: ExecutiveReportInput): Promise<ExecutiveReportResult> {
    return this.fallback.generateExecutiveReport(input);
  }

  async chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantResult> {
    return this.fallback.chatAssistant(input);
  }
}

export class OpenAIProvider extends RemoteAIProviderBase {
  readonly name = "openai";
  constructor(private readonly config: RemoteProviderConfig) {
    super();
  }

  protected async completeJSON(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.4,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI request failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message.content ?? "";
  }
}

export class AnthropicProvider extends RemoteAIProviderBase {
  readonly name = "anthropic";
  constructor(private readonly config: RemoteProviderConfig) {
    super();
  }

  protected async completeJSON(system: string, user: string): Promise<string> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic request failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    return data.content.find((block) => block.type === "text")?.text ?? "";
  }
}
