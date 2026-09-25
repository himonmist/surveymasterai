import { DevAIProvider } from "./dev-provider";
import { AnthropicProvider, OpenAIProvider } from "./remote-provider";
import type { AIProvider } from "./types";

let cachedProvider: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.AI_PROVIDER ?? "dev").toLowerCase();

  switch (providerName) {
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn("[ai] AI_PROVIDER=openai but OPENAI_API_KEY is not set; using dev provider instead.");
        cachedProvider = new DevAIProvider();
      } else {
        cachedProvider = new OpenAIProvider({ apiKey, model: process.env.OPENAI_MODEL ?? "gpt-4o-mini" });
      }
      break;
    }
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.warn("[ai] AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set; using dev provider instead.");
        cachedProvider = new DevAIProvider();
      } else {
        cachedProvider = new AnthropicProvider({ apiKey, model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest" });
      }
      break;
    }
    default:
      cachedProvider = new DevAIProvider();
  }

  return cachedProvider;
}

/** Test/utility helper to swap the cached provider. */
export function __resetAIProviderCache(): void {
  cachedProvider = undefined;
}
