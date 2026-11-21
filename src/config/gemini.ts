import { useAISettingsStore } from "@/store/ai-settings-store";

export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com";
export const GEMINI_API_VERSION = "v1beta";
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

// Strict BYOK architecture:
// There is NO shared NEXT_PUBLIC_GEMINI_API_KEY belonging to the site owner.
// Every user provides and stores their own Gemini API key locally in their browser.

export const GEMINI_REQUEST_CONFIG = {
  readingMaxOutputTokens: 1200,
  chatMaxOutputTokens: 500,
  readingTemperature: 0.72,
  chatTemperature: 0.72,
  topP: 0.9,
  // First-chunk (TTFT) timeout: 20s accommodates LTE & reasoning models while flash-lite responds in ~1.5s
  firstChunkTimeoutMs: 20_000,
  // Overall stream ceiling once chunks are actively streaming
  streamTotalTimeoutMs: 45_000,
  testTimeoutMs: 12_000,
  maxTransientRetries: 2,
  maxAutoRetryWaitSeconds: 5,
  maxChatHistoryMessages: 4,
} as const;

export interface ResolvedGeminiConfig {
  provider: "google-gemini";
  apiKey: string;
  model: string;
  apiVersion: string;
  apiBaseUrl: string;
}

export function getGeminiConfig(overrides?: {
  apiKey?: string;
}): ResolvedGeminiConfig {
  const storeState = useAISettingsStore.getState();
  const apiKey = (overrides?.apiKey ?? storeState.apiKey).trim();

  return {
    provider: "google-gemini",
    apiKey,
    // Fixed fast free-tier model for all users (no complex model selection needed)
    model: DEFAULT_GEMINI_MODEL,
    apiVersion: GEMINI_API_VERSION,
    apiBaseUrl: GEMINI_API_BASE_URL,
  };
}

export function buildGenerateContentUrl(model: string): string {
  return `${GEMINI_API_BASE_URL}/${GEMINI_API_VERSION}/models/${encodeURIComponent(
    model
  )}:generateContent`;
}

export function buildStreamGenerateContentUrl(model: string): string {
  return `${GEMINI_API_BASE_URL}/${GEMINI_API_VERSION}/models/${encodeURIComponent(
    model
  )}:streamGenerateContent?alt=sse`;
}

export function buildModelInfoUrl(model: string): string {
  return `${GEMINI_API_BASE_URL}/${GEMINI_API_VERSION}/models/${encodeURIComponent(
    model
  )}`;
}

export function buildListModelsUrl(): string {
  return `${GEMINI_API_BASE_URL}/${GEMINI_API_VERSION}/models?pageSize=100`;
}
