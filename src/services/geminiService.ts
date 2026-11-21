import {
  buildListModelsUrl,
  buildStreamGenerateContentUrl,
  GEMINI_REQUEST_CONFIG,
  getGeminiConfig,
} from "@/config/gemini";
import {
  buildCompactGroundingPayload,
  buildLocalAIReadingFallback,
} from "@/lib/tarot-grounding";
import {
  getLocalizedPositionLabel,
  getLocalizedSpreadName,
  getLocalizedTopicLabel,
} from "@/lib/i18n";
import { tarotChatService } from "@/services/tarot-chat-service";
import type { GeminiModelOption } from "@/store/ai-settings-store";
import type { Locale } from "@/store/locale-store";
import type {
  AIReadingResult,
  ChatMessage,
  DrawnCard,
  GroundedCardPayload,
  SpreadConfig,
  TarotChatContext,
  TopicMeta,
} from "@/types/tarot";

export type AIProviderMode = "gemini" | "local-fallback";

export type GeminiErrorCode =
  | "GEMINI_TLS_OR_NETWORK_ERROR"
  | "GEMINI_TIMEOUT"
  | "GEMINI_STREAM_INTERRUPTED"
  | "GEMINI_BAD_REQUEST"
  | "GEMINI_RATE_LIMIT"
  | "GEMINI_DAILY_QUOTA"
  | "GEMINI_MODEL_UNAVAILABLE"
  | "GEMINI_INVALID_API_KEY"
  | "GEMINI_PERMISSION_DENIED"
  | "GEMINI_SERVICE_UNAVAILABLE"
  | "GEMINI_NETWORK_ERROR";

export interface GeminiPerfMetrics {
  mode: "reading" | "chat" | "test";
  model: string;
  requestStartIso: string;
  timeToFirstTokenMs: number | null;
  totalGenerationMs: number;
  promptChars: number;
  inputTokens: number | null;
  outputTokens: number | null;
  requestsPerOperation: number;
  retryCount: number;
}

export interface GeminiDiagnosticInfo {
  model: string;
  httpStatus: number | null;
  geminiStatus: string | null;
  errorCode: GeminiErrorCode | null;
  errorMessage: string;
  quotaMetric?: string;
  retryAfterSeconds: number | null;
  attempts: number;
  durationMs: number;
  timeToFirstTokenMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  finishReason?: string | null;
  retryable: boolean;
}

export interface ReadingGenerationOutput {
  reading: AIReadingResult;
  provider: AIProviderMode;
  model?: string;
  diagnostic?: GeminiDiagnosticInfo;
}

export interface ChatMessageOutput {
  reply: string;
  provider: AIProviderMode;
  model?: string;
  diagnostic?: GeminiDiagnosticInfo;
}

export interface GeminiConnectionTestResult {
  ok: boolean;
  model: string;
  availableModels: GeminiModelOption[];
  selectedModelSupported: boolean;
  message: string;
  diagnostic: GeminiDiagnosticInfo;
}

export class GeminiServiceError extends Error {
  readonly code: GeminiErrorCode;
  readonly retryable: boolean;
  readonly retryAfterSeconds: number | null;
  readonly diagnostic: GeminiDiagnosticInfo;

  constructor(params: {
    code: GeminiErrorCode;
    message: string;
    retryable: boolean;
    retryAfterSeconds: number | null;
    diagnostic: GeminiDiagnosticInfo;
  }) {
    super(params.message);
    this.name = "GeminiServiceError";
    this.code = params.code;
    this.retryable = params.retryable;
    this.retryAfterSeconds = params.retryAfterSeconds;
    this.diagnostic = params.diagnostic;
  }
}

interface GeminiErrorBody {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<Record<string, unknown>>;
  };
}

interface GeminiSSEChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

// Single-flight deduplication (prevents StrictMode / double-click duplicate streams)
const inFlightReadings = new Map<string, Promise<ReadingGenerationOutput>>();
let inFlightChatPromise: Promise<ChatMessageOutput> | null = null;
let retryQueueChain: Promise<void> = Promise.resolve();

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiConfig().apiKey);
}

function logDevPerfMetrics(metrics: GeminiPerfMetrics): void {
  if (process.env.NODE_ENV !== "development") return;
  console.groupCollapsed(
    `[Gemini Perf] ${metrics.mode} · ${metrics.model} · TTFT ${metrics.timeToFirstTokenMs ?? "N/A"}ms · Total ${metrics.totalGenerationMs}ms`
  );
  console.table({
    model: metrics.model,
    mode: metrics.mode,
    requestStartIso: metrics.requestStartIso,
    timeToFirstTokenMs: metrics.timeToFirstTokenMs,
    totalGenerationMs: metrics.totalGenerationMs,
    promptChars: metrics.promptChars,
    inputTokens: metrics.inputTokens,
    outputTokens: metrics.outputTokens,
    requestsPerOperation: metrics.requestsPerOperation,
    retryCount: metrics.retryCount,
  });
  console.groupEnd();
}

export function getUserErrorMessage(
  code: GeminiErrorCode,
  locale: Locale,
  retryAfterSeconds?: number | null
): string {
  const waitHintVi =
    retryAfterSeconds && retryAfterSeconds > 0
      ? ` Vui lòng thử lại sau khoảng ${Math.ceil(retryAfterSeconds)} giây.`
      : "";
  const waitHintEn =
    retryAfterSeconds && retryAfterSeconds > 0
      ? ` Estimated wait: ~${Math.ceil(retryAfterSeconds)}s.`
      : "";

  switch (code) {
    case "GEMINI_TLS_OR_NETWORK_ERROR":
    case "GEMINI_NETWORK_ERROR":
      return locale === "vi"
        ? "Không thể thiết lập kết nối bảo mật đến Gemini API. Hãy kiểm tra mạng, proxy, antivirus hoặc chứng chỉ HTTPS trên thiết bị."
        : "Unable to establish a secure HTTPS connection to the Gemini API. Please check your network, proxy, antivirus HTTPS scanning, system clock, or device certificates.";
    case "GEMINI_TIMEOUT":
      return locale === "vi"
        ? "Kết nối tới Gemini quá thời gian chờ. Bạn có thể bấm Thử Lại, chọn model Flash nhanh hơn, hoặc dùng chế độ Giải Cục Bộ."
        : "The request to Gemini timed out. You can retry, switch to a faster Flash model, or use Local Mode.";
    case "GEMINI_STREAM_INTERRUPTED":
      return locale === "vi"
        ? "Luồng phản hồi từ Gemini bị gián đoạn giữa chừng. Hãy kiểm tra mạng và bấm Thử Lại."
        : "The Gemini response stream was interrupted mid-generation. Please check your connection and retry.";
    case "GEMINI_BAD_REQUEST":
      return locale === "vi"
        ? "Yêu cầu gửi tới Gemini không hợp lệ (HTTP 400). Hãy kiểm tra lại model hoặc thử lại."
        : "Gemini rejected the request (HTTP 400). Please check your selected model and try again.";
    case "GEMINI_RATE_LIMIT":
      return locale === "vi"
        ? `Gemini API Key của bạn đang tạm chạm giới hạn tần suất (429). Vui lòng đợi trước khi thử lại.${waitHintVi}`
        : `Your Gemini API key is temporarily rate-limited (429). Please wait before trying again.${waitHintEn}`;
    case "GEMINI_DAILY_QUOTA":
      return locale === "vi"
        ? "Hạn mức Gemini API trong ngày của chính bạn đã hết. Vui lòng thử lại sau khi quota trên Google AI Studio được đặt lại, hoặc dùng chế độ luận giải cục bộ."
        : "Your own Gemini API daily quota has been exhausted. Please try again after your Google AI Studio quota resets, or use the offline Tarot fallback.";
    case "GEMINI_INVALID_API_KEY":
      return locale === "vi"
        ? "Gemini API Key không hợp lệ hoặc chưa kích hoạt. Cách khắc phục: sao chép lại key từ Google AI Studio (không thừa khoảng trắng), đảm bảo key chưa bị thu hồi và chưa bị chặn domain."
        : "Your Gemini API key is invalid or unavailable. How to fix: re-copy your key from Google AI Studio without extra spaces, ensure it has not been revoked, and check referrer restrictions.";
    case "GEMINI_PERMISSION_DENIED":
      return locale === "vi"
        ? "Gemini API Key của bạn không có quyền truy cập dịch vụ hoặc model này (403)."
        : "Your Gemini API key does not have permission to access this service or model (403).";
    case "GEMINI_MODEL_UNAVAILABLE":
      return locale === "vi"
        ? "Model Gemini đang chọn không khả dụng cho API Key của bạn. Hãy vào Cài Đặt AI để tải danh sách model được hỗ trợ và chọn lại."
        : "The selected Gemini model is unavailable for your API key. Open AI Settings to fetch your supported models.";
    case "GEMINI_SERVICE_UNAVAILABLE":
    default:
      return locale === "vi"
        ? "Dịch vụ Google Gemini tạm thời quá tải hoặc không khả dụng (503). Vui lòng thử lại sau giây lát hoặc dùng chế độ Giải Cục Bộ."
        : "Google Gemini is temporarily overloaded or unavailable (503). Please retry shortly or use Local Mode.";
  }
}

function parseRetryDelaySeconds(
  retryAfterHeader: string | null,
  details?: Array<Record<string, unknown>>
): number | null {
  if (retryAfterHeader) {
    const numeric = Number(retryAfterHeader);
    if (!Number.isNaN(numeric) && numeric > 0) return numeric;
    const parsedDate = Date.parse(retryAfterHeader);
    if (!Number.isNaN(parsedDate)) {
      const diffSec = (parsedDate - Date.now()) / 1000;
      if (diffSec > 0) return diffSec;
    }
  }
  if (Array.isArray(details)) {
    for (const item of details) {
      const typeStr = String(item["@type"] || "");
      if (typeStr.includes("RetryInfo") && typeof item.retryDelay === "string") {
        const match = item.retryDelay.match(/([\d.]+)\s*s/i);
        if (match) {
          const sec = Number(match[1]);
          if (!Number.isNaN(sec) && sec > 0) return sec;
        }
      }
    }
  }
  return null;
}

function extractQuotaViolation(
  details?: Array<Record<string, unknown>>
): { quotaMetric?: string; isDaily: boolean; isZeroLimit: boolean } {
  if (!Array.isArray(details)) return { isDaily: false, isZeroLimit: false };
  for (const item of details) {
    const typeStr = String(item["@type"] || "");
    if (typeStr.includes("QuotaFailure") && Array.isArray(item.violations)) {
      for (const v of item.violations as Array<Record<string, unknown>>) {
        const quotaId = String(v.quotaId || "");
        const quotaMetric = String(v.quotaMetric || "");
        const quotaValue = String(v.quotaValue ?? "");
        const desc = String(v.description || "");
        const combined = `${quotaId} ${quotaMetric} ${desc}`.toLowerCase();
        const isZeroLimit = quotaValue === "0";
        const isDaily =
          combined.includes("perday") ||
          combined.includes("per_day") ||
          combined.includes("daily") ||
          combined.includes("requests_per_day");
        return {
          quotaMetric: quotaId || quotaMetric || undefined,
          isDaily,
          isZeroLimit,
        };
      }
    }
  }
  return { isDaily: false, isZeroLimit: false };
}

function parseGeminiErrorText(rawText: string): GeminiErrorBody {
  const trimmed = rawText.trim();
  if (!trimmed) return {};

  // Handle SSE-prefixed error frames (e.g. "data: {...}")
  const normalized = trimmed.startsWith("data:")
    ? trimmed.replace(/^data:\s*/i, "").trim()
    : trimmed;

  try {
    const parsed: unknown = JSON.parse(normalized);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
      return parsed[0] as GeminiErrorBody;
    }
    if (parsed && typeof parsed === "object") {
      return parsed as GeminiErrorBody;
    }
  } catch {
    // Non-JSON error body (plain text / HTML gateway error)
  }

  return {
    error: {
      message: trimmed.slice(0, 500),
    },
  };
}

function logGeminiHttpError(params: {
  endpoint: string;
  model: string;
  httpStatus: number;
  attempt: number;
  parsed: GeminiErrorBody;
  rawText: string;
}): void {
  const errObj = params.parsed?.error;
  // Never log API key (API key is only sent via x-goog-api-key header, never in URL or body)
  // Use console.warn + JSON.stringify so Next.js dev overlay doesn't intercept and collapse the object to "{}"
  const payload = {
    endpoint: params.endpoint,
    model: params.model,
    httpStatus: params.httpStatus,
    attempt: params.attempt,
    errorCode: errObj?.code ?? null,
    errorStatus: errObj?.status ?? null,
    errorMessage: errObj?.message ?? null,
    errorDetails: errObj?.details ?? null,
    rawBody: params.rawText.slice(0, 1000) || "(empty response body)",
  };
  console.warn(`[Gemini API Error]\n${JSON.stringify(payload, null, 2)}`);
}

function classifyGeminiHttpError(params: {
  httpStatus: number;
  body: GeminiErrorBody;
  retryAfterHeader: string | null;
  model: string;
  locale: Locale;
  attempts: number;
  durationMs: number;
}): GeminiServiceError {
  const {
    httpStatus,
    body,
    retryAfterHeader,
    model,
    locale,
    attempts,
    durationMs,
  } = params;
  const errObj = body?.error;
  const geminiStatus = errObj?.status ? String(errObj.status) : null;
  const rawMessage = String(errObj?.message || `HTTP ${httpStatus}`);
  const lowerMsg = rawMessage.toLowerCase();
  const details = errObj?.details;
  const retryAfterSeconds = parseRetryDelaySeconds(retryAfterHeader, details);
  const quotaInfo = extractQuotaViolation(details);

  let code: GeminiErrorCode;
  let retryable = false;

  const isZeroFreeTierLimit =
    quotaInfo.isZeroLimit || lowerMsg.includes("limit: 0");

  if (httpStatus === 429 || geminiStatus === "RESOURCE_EXHAUSTED") {
    const msgIndicatesDaily =
      isZeroFreeTierLimit ||
      quotaInfo.isDaily ||
      lowerMsg.includes("requests per day") ||
      lowerMsg.includes("per day limit") ||
      lowerMsg.includes("perday");
    code = msgIndicatesDaily ? "GEMINI_DAILY_QUOTA" : "GEMINI_RATE_LIMIT";
    retryable = code === "GEMINI_RATE_LIMIT";
  } else if (
    httpStatus === 404 ||
    geminiStatus === "NOT_FOUND" ||
    lowerMsg.includes("no longer available") ||
    lowerMsg.includes("is not found") ||
    lowerMsg.includes("not supported for generatecontent")
  ) {
    code = "GEMINI_MODEL_UNAVAILABLE";
    retryable = false;
  } else if (
    httpStatus === 401 ||
    lowerMsg.includes("api key not valid") ||
    lowerMsg.includes("api_key_invalid") ||
    lowerMsg.includes("invalid api key")
  ) {
    code = "GEMINI_INVALID_API_KEY";
    retryable = false;
  } else if (httpStatus === 403 || geminiStatus === "PERMISSION_DENIED") {
    code = lowerMsg.includes("api key")
      ? "GEMINI_INVALID_API_KEY"
      : "GEMINI_PERMISSION_DENIED";
    retryable = false;
  } else if (
    httpStatus === 500 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    httpStatus === 504 ||
    geminiStatus === "UNAVAILABLE" ||
    geminiStatus === "INTERNAL"
  ) {
    code = "GEMINI_SERVICE_UNAVAILABLE";
    retryable = true;
  } else if (httpStatus === 400 && lowerMsg.includes("model")) {
    code = "GEMINI_MODEL_UNAVAILABLE";
    retryable = false;
  } else if (httpStatus === 400) {
    code = "GEMINI_BAD_REQUEST";
    retryable = false;
  } else {
    code = "GEMINI_TLS_OR_NETWORK_ERROR";
    retryable = httpStatus >= 500;
  }

  const diagnostic: GeminiDiagnosticInfo = {
    model,
    httpStatus,
    geminiStatus,
    errorCode: code,
    errorMessage: rawMessage,
    quotaMetric: quotaInfo.quotaMetric,
    retryAfterSeconds,
    attempts,
    durationMs,
    retryable,
  };

  const hasRealApiMessage =
    Boolean(errObj?.message) && rawMessage !== `HTTP ${httpStatus}`;

  const userMessage =
    httpStatus === 503 && hasRealApiMessage
      ? locale === "vi"
        ? `Gemini API trả về lỗi 503 (${geminiStatus ?? "UNAVAILABLE"}): ${rawMessage}`
        : `Gemini API returned HTTP 503 (${geminiStatus ?? "UNAVAILABLE"}): ${rawMessage}`
      : code === "GEMINI_DAILY_QUOTA" && isZeroFreeTierLimit
      ? locale === "vi"
        ? `Model ${model} không có hạn mức miễn phí (limit: 0) trên gói Free Tier của Google AI Studio. Hãy vào Cài Đặt Gemini chọn "gemini-3.5-flash-lite" để dùng miễn phí & phản hồi nhanh (~1.5 giây).`
        : `Model ${model} has no free-tier quota (limit: 0) on Google AI Studio. Open Gemini Settings and select "gemini-3.5-flash-lite" for fast free-tier readings.`
      : code === "GEMINI_DAILY_QUOTA"
      ? locale === "vi"
        ? `Model ${model} đã chạm hạn mức ngày trên tài khoản Google AI Studio của bạn (429). Bạn có thể vào Cài Đặt Gemini chọn model khác (như gemini-3.5-flash-lite) hoặc dùng Giải Cục Bộ.`
        : `Model ${model} reached its daily quota on your Google AI Studio account (429). Switch to another model in Gemini Settings (such as gemini-3.5-flash-lite) or use Local Mode.`
      : getUserErrorMessage(code, locale, retryAfterSeconds);

  return new GeminiServiceError({
    code,
    message: userMessage,
    retryable,
    retryAfterSeconds,
    diagnostic,
  });
}

function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function scheduleSerializedWait(
  ms: number,
  signal?: AbortSignal
): Promise<void> {
  const next = retryQueueChain.then(() => sleepWithAbort(ms, signal));
  retryQueueChain = next.catch(() => undefined);
  return next;
}

function computeBackoffMs(
  attemptIndex: number,
  retryAfterSeconds: number | null
): number {
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    return Math.round(retryAfterSeconds * 1000 + Math.random() * 300);
  }
  return Math.round(900 * Math.pow(2, attemptIndex) + Math.random() * 400);
}

function buildFastThinkingConfig(model: string): Record<string, unknown> {
  const lower = model.toLowerCase();
  // Flash-Lite models do not support thinkingConfig (sending it causes HTTP 400)
  if (lower.includes("lite")) {
    return {};
  }
  if (lower.includes("flash")) {
    return { thinkingConfig: { thinkingBudget: 0 } };
  }
  if (lower.includes("pro")) {
    return { thinkingConfig: { thinkingBudget: 256 } };
  }
  return {};
}

/**
 * Non-streaming GET helper used only for model metadata listing / connection tests.
 */
async function fetchGeminiMetadata(params: {
  url: string;
  apiKey: string;
  model: string;
  locale: Locale;
  timeoutMs: number;
  externalSignal?: AbortSignal;
}): Promise<{ data: Record<string, unknown>; diagnostic: GeminiDiagnosticInfo }> {
  const startedAt = performance.now();
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  params.externalSignal?.addEventListener("abort", onExternalAbort, {
    once: true,
  });
  const timeoutId = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const res = await fetch(params.url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      signal: controller.signal,
    });

    const parsedBody = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const durationMs = Math.round(performance.now() - startedAt);

    if (res.ok) {
      return {
        data: parsedBody,
        diagnostic: {
          model: params.model,
          httpStatus: res.status,
          geminiStatus: "OK",
          errorCode: null,
          errorMessage: "",
          retryAfterSeconds: null,
          attempts: 1,
          durationMs,
          retryable: false,
        },
      };
    }

    throw classifyGeminiHttpError({
      httpStatus: res.status,
      body: parsedBody as GeminiErrorBody,
      retryAfterHeader: res.headers.get("retry-after"),
      model: params.model,
      locale: params.locale,
      attempts: 1,
      durationMs,
    });
  } catch (err) {
    if (err instanceof GeminiServiceError) throw err;
    if (params.externalSignal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    const durationMs = Math.round(performance.now() - startedAt);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const errCode: GeminiErrorCode = isTimeout
      ? "GEMINI_TIMEOUT"
      : "GEMINI_TLS_OR_NETWORK_ERROR";
    throw new GeminiServiceError({
      code: errCode,
      message: getUserErrorMessage(errCode, params.locale),
      retryable: isTimeout,
      retryAfterSeconds: null,
      diagnostic: {
        model: params.model,
        httpStatus: null,
        geminiStatus: isTimeout ? "DEADLINE_EXCEEDED" : "TLS_OR_NETWORK_ERROR",
        errorCode: errCode,
        errorMessage:
          err instanceof Error
            ? `${err.message} (Check browser console for ERR_CERT_AUTHORITY_INVALID / ERR_NETWORK)`
            : "TLS or network request failed before reaching Google",
        retryAfterSeconds: null,
        attempts: 1,
        durationMs,
        retryable: isTimeout,
      },
    });
  } finally {
    clearTimeout(timeoutId);
    params.externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * True real-time SSE streaming call to Gemini's :streamGenerateContent?alt=sse.
 * - Enforces a 10s first-chunk (TTFT) timeout so users never hang silently.
 * - Streams incremental chunks immediately via onChunk(accumulated, delta).
 * - Supports instant AbortSignal cancellation.
 * - Retries at most 2x ONLY on pre-stream transient 429/503 errors.
 * - Logs dev-only performance metrics (TTFT, total time, tokens, retries).
 */
async function fetchGeminiStreamWithRetry(params: {
  mode: "reading" | "chat";
  apiKey: string;
  model: string;
  body: Record<string, unknown>;
  promptChars: number;
  locale: Locale;
  externalSignal?: AbortSignal;
  onChunk?: (accumulatedText: string, delta: string) => void;
}): Promise<{
  text: string;
  diagnostic: GeminiDiagnosticInfo;
}> {
  const requestStartIso = new Date().toISOString();
  const startedAt = performance.now();
  const maxAttempts = 1 + GEMINI_REQUEST_CONFIG.maxTransientRetries;

  let currentBody = params.body;
  let strippedThinkingConfig = false;
  let retryCount = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (params.externalSignal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    params.externalSignal?.addEventListener("abort", onExternalAbort, {
      once: true,
    });

    let gotFirstChunk = false;
    let timedOutReason: "ttft" | "total" | null = null;

    // 10s first-chunk deadline (cleared immediately once first token arrives)
    const firstChunkTimer = setTimeout(() => {
      if (!gotFirstChunk) {
        timedOutReason = "ttft";
        controller.abort();
      }
    }, GEMINI_REQUEST_CONFIG.firstChunkTimeoutMs);

    // 30s total stream ceiling
    const totalTimer = setTimeout(() => {
      timedOutReason = "total";
      controller.abort();
    }, GEMINI_REQUEST_CONFIG.streamTotalTimeoutMs);

    try {
      const endpointUrl = buildStreamGenerateContentUrl(params.model);
      const res = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": params.apiKey,
        },
        signal: controller.signal,
        body: JSON.stringify(currentBody),
      });

      if (!res.ok) {
        // Always read response body as text first before attempting JSON parse or stream handling
        const rawErrorText = await res.text().catch(() => "");
        const parsedErr = parseGeminiErrorText(rawErrorText);
        const durationMs = Math.round(performance.now() - startedAt);

        logGeminiHttpError({
          endpoint: endpointUrl,
          model: params.model,
          httpStatus: res.status,
          attempt,
          parsed: parsedErr,
          rawText: rawErrorText,
        });

        const rawErrMsg = String(parsedErr?.error?.message || "").toLowerCase();

        // Auto-strip thinkingConfig if a model rejects the request with HTTP 400
        // (some Gemini Flash-Lite / preview models return generic "Request contains an invalid argument.")
        if (
          res.status === 400 &&
          !strippedThinkingConfig &&
          "generationConfig" in currentBody &&
          "thinkingConfig" in
            (currentBody.generationConfig as Record<string, unknown>)
        ) {
          strippedThinkingConfig = true;
          const genCfg = {
            ...(currentBody.generationConfig as Record<string, unknown>),
          };
          delete genCfg.thinkingConfig;
          currentBody = { ...currentBody, generationConfig: genCfg };
          attempt -= 1;
          continue;
        }

        const classified = classifyGeminiHttpError({
          httpStatus: res.status,
          body: parsedErr,
          retryAfterHeader: res.headers.get("retry-after"),
          model: params.model,
          locale: params.locale,
          attempts: attempt,
          durationMs,
        });

        const isTransientRetryable =
          classified.code === "GEMINI_RATE_LIMIT" ||
          classified.code === "GEMINI_SERVICE_UNAVAILABLE";
        const waitTooLong =
          classified.retryAfterSeconds !== null &&
          classified.retryAfterSeconds >
            GEMINI_REQUEST_CONFIG.maxAutoRetryWaitSeconds;

        if (!isTransientRetryable || waitTooLong || attempt >= maxAttempts) {
          throw classified;
        }

        retryCount += 1;
        const backoffMs = computeBackoffMs(
          attempt - 1,
          classified.retryAfterSeconds
        );
        await scheduleSerializedWait(backoffMs, params.externalSignal);
        continue;
      }

      if (!res.body) {
        throw new GeminiServiceError({
          code: "GEMINI_SERVICE_UNAVAILABLE",
          message: getUserErrorMessage("GEMINI_SERVICE_UNAVAILABLE", params.locale),
          retryable: true,
          retryAfterSeconds: null,
          diagnostic: {
            model: params.model,
            httpStatus: res.status,
            geminiStatus: "EMPTY_STREAM",
            errorCode: "GEMINI_SERVICE_UNAVAILABLE",
            errorMessage: "Response body stream was null.",
            retryAfterSeconds: null,
            attempts: attempt,
            durationMs: Math.round(performance.now() - startedAt),
            retryable: true,
          },
        });
      }

      // Consume SSE stream incrementally (handles chunks split across reads,
      // multi-line data events, empty heartbeat lines, [DONE], and finishReason)
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let sseBuffer = "";
      let accumulated = "";
      let timeToFirstTokenMs: number | null = null;
      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let finishReason: string | null = null;

      const processSSEEventBlock = (eventBlock: string) => {
        const dataLines: string[] = [];
        for (const rawLine of eventBlock.split(/\r?\n/)) {
          if (!rawLine || rawLine.startsWith(":")) continue; // Ignore empty heartbeat/comment lines
          if (rawLine.startsWith("data:")) {
            dataLines.push(rawLine.slice(5).trimStart());
          }
        }
        if (dataLines.length === 0) return;

        const payload = dataLines.join("\n").trim();
        if (!payload || payload === "[DONE]") return;

        let chunk: GeminiSSEChunk;
        try {
          chunk = JSON.parse(payload) as GeminiSSEChunk;
        } catch {
          return;
        }

        if (chunk.usageMetadata) {
          if (typeof chunk.usageMetadata.promptTokenCount === "number") {
            inputTokens = chunk.usageMetadata.promptTokenCount;
          }
          if (typeof chunk.usageMetadata.candidatesTokenCount === "number") {
            outputTokens = chunk.usageMetadata.candidatesTokenCount;
          }
        }

        const candidate = chunk.candidates?.[0];
        if (candidate?.finishReason) {
          finishReason = candidate.finishReason;
        }

        const delta =
          candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

        if (delta) {
          if (!gotFirstChunk) {
            gotFirstChunk = true;
            timeToFirstTokenMs = Math.round(performance.now() - startedAt);
            clearTimeout(firstChunkTimer);
          }
          accumulated += delta;
          params.onChunk?.(accumulated, delta);
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split(/\r?\n\r?\n/);
          sseBuffer = events.pop() ?? "";
          for (const eventBlock of events) {
            if (eventBlock.trim()) {
              processSSEEventBlock(eventBlock);
            }
          }
        }

        // Flush any remaining UTF-8 bytes and trailing SSE event
        sseBuffer += decoder.decode();
        if (sseBuffer.trim()) {
          processSSEEventBlock(sseBuffer);
        }
      } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
      }

      const totalGenerationMs = Math.round(performance.now() - startedAt);

      logDevPerfMetrics({
        mode: params.mode,
        model: params.model,
        requestStartIso,
        timeToFirstTokenMs,
        totalGenerationMs,
        promptChars: params.promptChars,
        inputTokens,
        outputTokens,
        requestsPerOperation: 1,
        retryCount,
      });

      if (!accumulated.trim()) {
        throw new GeminiServiceError({
          code: "GEMINI_SERVICE_UNAVAILABLE",
          message: getUserErrorMessage("GEMINI_SERVICE_UNAVAILABLE", params.locale),
          retryable: true,
          retryAfterSeconds: null,
          diagnostic: {
            model: params.model,
            httpStatus: res.status,
            geminiStatus: finishReason || "EMPTY_CONTENT",
            errorCode: "GEMINI_SERVICE_UNAVAILABLE",
            errorMessage: `Stream ended without generating text (finishReason=${finishReason ?? "none"}).`,
            retryAfterSeconds: null,
            attempts: attempt,
            durationMs: totalGenerationMs,
            timeToFirstTokenMs,
            inputTokens,
            outputTokens,
            finishReason,
            retryable: true,
          },
        });
      }

      return {
        text: accumulated.trim(),
        diagnostic: {
          model: params.model,
          httpStatus: res.status,
          geminiStatus: "OK",
          errorCode: null,
          errorMessage: "",
          retryAfterSeconds: null,
          attempts: attempt,
          durationMs: totalGenerationMs,
          timeToFirstTokenMs,
          inputTokens,
          outputTokens,
          finishReason,
          retryable: false,
        },
      };
    } catch (err) {
      if (err instanceof GeminiServiceError) throw err;
      if (params.externalSignal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const durationMs = Math.round(performance.now() - startedAt);
      const isTimeout = err instanceof Error && err.name === "AbortError";

      // Classify TLS/Certificate/Network failures distinctly from Timeouts & Mid-Stream Interruptions.
      // NEVER retry TLS/certificate errors (ERR_CERT_AUTHORITY_INVALID) or mid-stream interruptions.
      let errCode: GeminiErrorCode;
      let errMessage: string;
      let retryable: boolean;

      if (isTimeout) {
        errCode = "GEMINI_TIMEOUT";
        errMessage =
          timedOutReason === "ttft"
            ? params.locale === "vi"
              ? `Model ${params.model} chưa trả ký tự đầu tiên sau ${Math.round(GEMINI_REQUEST_CONFIG.firstChunkTimeoutMs / 1000)} giây. Hãy bấm Thử Lại, đổi sang "gemini-3.5-flash-lite" nhanh hơn, hoặc dùng Giải Cục Bộ.`
              : `Model ${params.model} did not emit a first token within ${Math.round(GEMINI_REQUEST_CONFIG.firstChunkTimeoutMs / 1000)} seconds. Retry, switch to "gemini-3.5-flash-lite", or use Local Mode.`
            : getUserErrorMessage("GEMINI_TIMEOUT", params.locale);
        retryable = true;
      } else if (gotFirstChunk) {
        errCode = "GEMINI_STREAM_INTERRUPTED";
        errMessage = getUserErrorMessage("GEMINI_STREAM_INTERRUPTED", params.locale);
        retryable = true;
      } else {
        // Browser threw TypeError: Failed to fetch before receiving HTTP status
        // (e.g. ERR_CERT_AUTHORITY_INVALID, ERR_NETWORK, corporate proxy/antivirus HTTPS block)
        errCode = "GEMINI_TLS_OR_NETWORK_ERROR";
        errMessage = getUserErrorMessage("GEMINI_TLS_OR_NETWORK_ERROR", params.locale);
        retryable = false;
      }

      throw new GeminiServiceError({
        code: errCode,
        message: errMessage,
        retryable,
        retryAfterSeconds: null,
        diagnostic: {
          model: params.model,
          httpStatus: null,
          geminiStatus: isTimeout
            ? "DEADLINE_EXCEEDED"
            : gotFirstChunk
            ? "STREAM_INTERRUPTED"
            : "TLS_OR_NETWORK_ERROR",
          errorCode: errCode,
          errorMessage: isTimeout
            ? `Timeout (${timedOutReason ?? "abort"} at ${durationMs}ms)`
            : err instanceof Error
            ? `${err.message} (Check browser console for ERR_CERT_AUTHORITY_INVALID / ERR_NETWORK)`
            : "TLS or network connection failed",
          retryAfterSeconds: null,
          attempts: attempt,
          durationMs,
          retryable,
        },
      });
    } finally {
      clearTimeout(firstChunkTimer);
      clearTimeout(totalTimer);
      params.externalSignal?.removeEventListener("abort", onExternalAbort);
    }
  }

  throw new GeminiServiceError({
    code: "GEMINI_NETWORK_ERROR",
    message: getUserErrorMessage("GEMINI_NETWORK_ERROR", params.locale),
    retryable: true,
    retryAfterSeconds: null,
    diagnostic: {
      model: params.model,
      httpStatus: null,
      geminiStatus: "UNKNOWN",
      errorCode: "GEMINI_NETWORK_ERROR",
      errorMessage: "Stream terminated unexpectedly.",
      retryAfterSeconds: null,
      attempts: maxAttempts,
      durationMs: Math.round(performance.now() - startedAt),
      retryable: true,
    },
  });
}

function buildCompactSystemInstruction(locale: Locale): string {
  const lang =
    locale === "vi"
      ? "Respond in warm, natural, fluent Vietnamese (keep canonical English Tarot card names)."
      : "Respond in warm, natural, fluent English.";

  return [
    "You are an empathetic, experienced Tarot Reader speaking directly to a querent.",
    lang,
    "Synthesize all 3 cards into ONE coherent human story tailored to the question, topic, positions, and upright/reversed orientations.",
    "Never copy textbook definitions, never include parenthetical PDF/book citations, never claim future certainty or read minds.",
    "Keep the entire reading vivid and concise (~500–750 words total).",
  ].join(" ");
}

function buildLeanReadingPrompt(params: {
  topicLabel: string;
  spreadName: string;
  userQuestion: string;
  cards: GroundedCardPayload[];
  spreadSignals: string[];
  combinationNotes: string[];
  locale: Locale;
}): string {
  const cardLines = params.cards.map((c, i) => {
    const orient = c.orientation === "upright" ? "Upright" : "Reversed";
    return `${i + 1}. [${c.positionLabel}] ${c.name} (${orient}) — Essence: ${c.generalMeaning.slice(0, 120)} | Topic: ${c.topicMeaning.slice(0, 140)}`;
  });

  const signals = [...params.spreadSignals, ...params.combinationNotes]
    .slice(0, 2)
    .join(" ");

  const headings =
    params.locale === "vi"
      ? [
          "## A. Năng Lượng Tổng Thể",
          "(2–3 câu mở đầu cảm nhận tổng quan trải bài)",
          "## B. Luận Giải Từng Lá",
          `### 1. ${params.cards[0]?.name ?? "Card 1"}`,
          "(2–3 câu theo vị trí, chiều bài và câu hỏi)",
          `### 2. ${params.cards[1]?.name ?? "Card 2"}`,
          "(2–3 câu theo vị trí, chiều bài và câu hỏi)",
          `### 3. ${params.cards[2]?.name ?? "Card 3"}`,
          "(2–3 câu theo vị trí, chiều bài và câu hỏi)",
          "## C. Mối Liên Kết Giữa 3 Lá Bài",
          "(1 đoạn 4–5 câu giải thích cách 3 lá tương tác, bổ trợ hoặc giằng co nhau)",
          "## D. Thông Điệp Sâu Sắc",
          "(1 đoạn 4–5 câu trò chuyện tự nhiên như Tarot Reader thực thụ)",
          "## E. Lời Khuyên & Tự Chiêm Nghiệm",
          "- Điều cần chú ý: ...",
          "- Điều dễ bỏ sót: ...",
          "- Gợi ý hành động: ...",
          "- Câu hỏi tự vấn: ...",
          "## F. Lời Nhắn Khép Lại",
          "(1–2 câu ấm áp, tôn trọng quyền chủ động của người hỏi)",
        ]
      : [
          "## A. Overall Energy",
          "(2–3 warm sentences)",
          "## B. Individual Card Interpretations",
          `### 1. ${params.cards[0]?.name ?? "Card 1"}`,
          "(2–3 contextual sentences)",
          `### 2. ${params.cards[1]?.name ?? "Card 2"}`,
          "(2–3 contextual sentences)",
          `### 3. ${params.cards[2]?.name ?? "Card 3"}`,
          "(2–3 contextual sentences)",
          "## C. Connection Between the Cards",
          "(1 paragraph of 4–5 sentences weaving how all 3 cards interact)",
          "## D. Deep Interpretation",
          "(1 flowing paragraph of 4–5 sentences like a human Tarot Reader)",
          "## E. Advice and Reflection",
          "- Pay attention to: ...",
          "- Possibly overlooking: ...",
          "- Possible action: ...",
          "- Reflection question: ...",
          "## F. Closing Message",
          "(1–2 warm, non-deterministic sentences)",
        ];

  return [
    `Topic: ${params.topicLabel} | Spread: ${params.spreadName}`,
    `Question: ${params.userQuestion.trim() || "(General reflection on this topic)"}`,
    "Cards:",
    ...cardLines,
    signals ? `Pattern note: ${signals}` : "",
    "",
    "Write the reading directly using these exact Markdown headings:",
    ...headings,
  ]
    .filter(Boolean)
    .join("\n");
}

function parseStreamedReadingMarkdown(
  rawMarkdown: string,
  cards: GroundedCardPayload[],
  fallback: AIReadingResult
): AIReadingResult {
  const extractSection = (letter: string): string => {
    const regex = new RegExp(
      `##\\s*${letter}\\.[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s*[A-F]\\.|$)`,
      "i"
    );
    const match = rawMarkdown.match(regex);
    return match ? match[1].trim() : "";
  };

  const secA = extractSection("A");
  const secB = extractSection("B");
  const secC = extractSection("C");
  const secD = extractSection("D");
  const secE = extractSection("E");
  const secF = extractSection("F");

  // Parse individual card subsections from Section B
  const cardSubsections = secB
    ? secB.split(/\n?###\s+/).filter((s) => s.trim().length > 0)
    : [];

  const cardInterpretations = cards.map((c, idx) => {
    const rawBlock = cardSubsections[idx] || "";
    const lines = rawBlock.split("\n");
    // Drop the heading line (e.g. "1. The Fool")
    const body = lines.slice(1).join("\n").trim() || rawBlock.trim();
    return {
      cardId: c.cardId,
      cardName: c.name,
      positionLabel: c.positionLabel,
      orientation: c.orientation,
      symbolismHighlight: c.symbolismHint,
      interpretation: body || fallback.cardInterpretations[idx]?.interpretation || "",
    };
  });

  // Parse Section E bullets
  const eLines = secE
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const stripLabel = (line?: string) =>
    line ? line.replace(/^[^:]{2,40}:\s*/, "").trim() : "";

  const payAttentionTo =
    stripLabel(eLines[0]) || fallback.adviceAndReflection.payAttentionTo;
  const possiblyOverlooking =
    stripLabel(eLines[1]) || fallback.adviceAndReflection.possiblyOverlooking;
  const actionLine = stripLabel(eLines[2]);
  const reflectionQuestion =
    stripLabel(eLines[3]) || fallback.adviceAndReflection.reflectionQuestion;

  return {
    overallEnergy: secA || rawMarkdown.split("\n\n")[0]?.trim() || fallback.overallEnergy,
    cardInterpretations,
    cardConnections: secC || fallback.cardConnections,
    deepInterpretation: secD || rawMarkdown.trim(),
    adviceAndReflection: {
      payAttentionTo,
      possiblyOverlooking,
      possibleActions: actionLine
        ? [actionLine]
        : fallback.adviceAndReflection.possibleActions,
      reflectionQuestion,
    },
    closingMessage: secF || fallback.closingMessage,
    suggestedFollowUps: fallback.suggestedFollowUps,
  };
}

interface RawGeminiModel {
  name?: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

function parseAvailableGeminiModels(
  data: Record<string, unknown>
): GeminiModelOption[] {
  const rawList = Array.isArray(data.models)
    ? (data.models as RawGeminiModel[])
    : [];

  return rawList
    .map((m) => {
      const id = String(m.name || "").replace(/^models\//, "").trim();
      const methods = Array.isArray(m.supportedGenerationMethods)
        ? m.supportedGenerationMethods.map(String)
        : [];
      return {
        id,
        displayName: String(m.displayName || id),
        description: String(m.description || ""),
        methods,
      };
    })
    .filter((m) => {
      if (!m.id.toLowerCase().startsWith("gemini-")) return false;
      if (!m.methods.includes("generateContent")) return false;
      const lower = m.id.toLowerCase();
      return !(
        lower.includes("embedding") ||
        lower.includes("imagen") ||
        lower.includes("image") ||
        lower.includes("nano-banana") ||
        lower.includes("transcribe") ||
        lower.includes("tts") ||
        lower.includes("audio") ||
        lower.includes("robotics") ||
        lower.includes("computer-use")
      );
    })
    .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }))
    .map(({ id, displayName, description }) => ({
      id,
      displayName,
      description,
    }));
}

export async function fetchAvailableGeminiModels(options?: {
  apiKey?: string;
  locale?: Locale;
  signal?: AbortSignal;
}): Promise<{
  models: GeminiModelOption[];
  diagnostic: GeminiDiagnosticInfo;
}> {
  const locale = options?.locale ?? "en";
  const cfg = getGeminiConfig({ apiKey: options?.apiKey });

  if (!cfg.apiKey) {
    throw new GeminiServiceError({
      code: "GEMINI_INVALID_API_KEY",
      message: getUserErrorMessage("GEMINI_INVALID_API_KEY", locale),
      retryable: false,
      retryAfterSeconds: null,
      diagnostic: {
        model: cfg.model,
        httpStatus: null,
        geminiStatus: "MISSING_API_KEY",
        errorCode: "GEMINI_INVALID_API_KEY",
        errorMessage: "No Gemini API key configured.",
        retryAfterSeconds: null,
        attempts: 0,
        durationMs: 0,
        retryable: false,
      },
    });
  }

  const { data, diagnostic } = await fetchGeminiMetadata({
    url: buildListModelsUrl(),
    apiKey: cfg.apiKey,
    model: cfg.model,
    locale,
    timeoutMs: GEMINI_REQUEST_CONFIG.testTimeoutMs,
    externalSignal: options?.signal,
  });

  return {
    models: parseAvailableGeminiModels(data),
    diagnostic,
  };
}

export async function testGeminiConnection(
  locale: Locale = "en",
  signal?: AbortSignal,
  overrides?: { apiKey?: string }
): Promise<GeminiConnectionTestResult> {
  const cfg = getGeminiConfig(overrides);

  if (!cfg.apiKey) {
    const diagnostic: GeminiDiagnosticInfo = {
      model: cfg.model,
      httpStatus: null,
      geminiStatus: "MISSING_API_KEY",
      errorCode: "GEMINI_INVALID_API_KEY",
      errorMessage: "No Gemini API key configured.",
      retryAfterSeconds: null,
      attempts: 0,
      durationMs: 0,
      retryable: false,
    };
    return {
      ok: false,
      model: cfg.model,
      availableModels: [],
      selectedModelSupported: false,
      message:
        locale === "vi"
          ? "Chưa có Gemini API Key. Hãy nhập API Key của bạn để kiểm tra kết nối."
          : "No Gemini API key entered. Enter your API key to test the connection.",
      diagnostic,
    };
  }

  try {
    const { models, diagnostic } = await fetchAvailableGeminiModels({
      apiKey: cfg.apiKey,
      locale,
      signal,
    });

    if (models.length === 0) {
      return {
        ok: false,
        model: cfg.model,
        availableModels: [],
        selectedModelSupported: false,
        message: getUserErrorMessage("GEMINI_MODEL_UNAVAILABLE", locale),
        diagnostic: {
          ...diagnostic,
          errorCode: "GEMINI_MODEL_UNAVAILABLE",
          errorMessage: "No generateContent Gemini models returned for this key.",
          retryable: false,
        },
      };
    }

    const selectedSupported = models.some((m) => m.id === cfg.model);
    const effectiveModel = selectedSupported ? cfg.model : models[0].id;

    return {
      ok: true,
      model: cfg.model,
      availableModels: models,
      selectedModelSupported: selectedSupported,
      message:
        locale === "vi"
          ? "Kết nối thành công! API Key của bạn đã sẵn sàng để giải bài Tarot bằng Gemini AI."
          : "Connected! Your API Key is ready for AI Tarot readings.",
      diagnostic: {
        ...diagnostic,
        model: cfg.model,
      },
    };
  } catch (err) {
    if (err instanceof GeminiServiceError) {
      return {
        ok: false,
        model: cfg.model,
        availableModels: [],
        selectedModelSupported: false,
        message: err.message,
        diagnostic: err.diagnostic,
      };
    }
    const fallbackDiag: GeminiDiagnosticInfo = {
      model: cfg.model,
      httpStatus: null,
      geminiStatus: "NETWORK_ERROR",
      errorCode: "GEMINI_NETWORK_ERROR",
      errorMessage:
        err instanceof Error ? err.message : "Connection test failed",
      retryAfterSeconds: null,
      attempts: 1,
      durationMs: 0,
      retryable: true,
    };
    return {
      ok: false,
      model: cfg.model,
      availableModels: [],
      selectedModelSupported: false,
      message: getUserErrorMessage("GEMINI_NETWORK_ERROR", locale),
      diagnostic: fallbackDiag,
    };
  }
}

export async function generateTarotReading(params: {
  readingId: string;
  topic: TopicMeta;
  spread: SpreadConfig;
  drawnCards: DrawnCard[];
  userQuestion: string;
  locale: Locale;
  forceLocal?: boolean;
  signal?: AbortSignal;
  onChunk?: (accumulatedText: string, delta: string) => void;
}): Promise<ReadingGenerationOutput> {
  const {
    readingId,
    topic,
    spread,
    drawnCards,
    userQuestion,
    locale,
    forceLocal = false,
    signal,
    onChunk,
  } = params;

  const cfg = getGeminiConfig();
  const localFallback = buildLocalAIReadingFallback(
    topic,
    spread,
    drawnCards,
    locale,
    userQuestion
  );

  if (forceLocal || !cfg.apiKey) {
    return {
      reading: localFallback,
      provider: "local-fallback",
    };
  }

  const dedupeKey = `${readingId}:${locale}:${cfg.model}`;
  const existing = inFlightReadings.get(dedupeKey);
  if (existing) return existing;

  const task = (async (): Promise<ReadingGenerationOutput> => {
    try {
      const grounding = buildCompactGroundingPayload(
        drawnCards,
        topic,
        spread,
        locale
      );

      const systemText = buildCompactSystemInstruction(locale);
      const promptText = buildLeanReadingPrompt({
        topicLabel: getLocalizedTopicLabel(topic.id, locale, topic.label),
        spreadName: getLocalizedSpreadName(spread.id, locale, spread.name),
        userQuestion,
        cards: grounding.cards,
        spreadSignals: grounding.spreadSignals,
        combinationNotes: grounding.combinationNotes,
        locale,
      });

      const { text, diagnostic } = await fetchGeminiStreamWithRetry({
        mode: "reading",
        apiKey: cfg.apiKey,
        model: cfg.model,
        promptChars: systemText.length + promptText.length,
        locale,
        externalSignal: signal,
        onChunk,
        body: {
          system_instruction: { parts: [{ text: systemText }] },
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: GEMINI_REQUEST_CONFIG.readingTemperature,
            topP: GEMINI_REQUEST_CONFIG.topP,
            maxOutputTokens: GEMINI_REQUEST_CONFIG.readingMaxOutputTokens,
            ...buildFastThinkingConfig(cfg.model),
          },
        },
      });

      const reading = parseStreamedReadingMarkdown(
        text,
        grounding.cards,
        localFallback
      );

      return {
        reading,
        provider: "gemini",
        model: cfg.model,
        diagnostic,
      };
    } finally {
      inFlightReadings.delete(dedupeKey);
    }
  })();

  inFlightReadings.set(dedupeKey, task);
  return task;
}

export async function sendTarotMessage(
  context: TarotChatContext,
  history: ChatMessage[],
  userMessage: string,
  options?: {
    useLocalFallback?: boolean;
    signal?: AbortSignal;
    onChunk?: (accumulatedText: string, delta: string) => void;
  }
): Promise<ChatMessageOutput> {
  const cfg = getGeminiConfig();

  if (options?.useLocalFallback || !cfg.apiKey) {
    const reply = await tarotChatService.sendMessage(
      context,
      history,
      userMessage
    );
    return { reply, provider: "local-fallback" };
  }

  if (inFlightChatPromise) {
    return inFlightChatPromise;
  }

  const task = (async (): Promise<ChatMessageOutput> => {
    try {
      const compactCards = context.drawnCards
        .map((d, i) => {
          const pos = getLocalizedPositionLabel(
            context.spread.id,
            i,
            context.locale,
            d.position.label
          );
          const orient = d.orientation === "upright" ? "Upright" : "Reversed";
          return `${i + 1}. ${pos}: ${d.card.name} (${orient})`;
        })
        .join(" | ");

      const initialTakeaway = context.initialReading
        ? context.initialReading.overallEnergy.slice(0, 200)
        : "";

      const systemText = buildCompactSystemInstruction(context.locale);
      const contextBlock = [
        `Topic: ${getLocalizedTopicLabel(context.topic.id, context.locale, context.topic.label)} | Spread: ${getLocalizedSpreadName(context.spread.id, context.locale, context.spread.name)}`,
        context.userQuestion?.trim()
          ? `Original Question: ${context.userQuestion.trim()}`
          : "",
        `Cards: ${compactCards}`,
        initialTakeaway ? `Summary: ${initialTakeaway}` : "",
        "Answer in 1–2 warm, concise paragraphs grounded strictly in these 3 cards. Never redraw cards.",
      ]
        .filter(Boolean)
        .join("\n");

      const contents: Array<{
        role: "user" | "model";
        parts: Array<{ text: string }>;
      }> = [
        {
          role: "user",
          parts: [{ text: contextBlock }],
        },
        {
          role: "model",
          parts: [
            {
              text:
                context.locale === "vi"
                  ? "Mình đã nắm rõ trải bài của bạn. Bạn hãy đặt câu hỏi nhé."
                  : "I have your three-card spread in mind. What would you like to ask?",
            },
          ],
        },
      ];

      const recentHistory = history.slice(
        -GEMINI_REQUEST_CONFIG.maxChatHistoryMessages
      );
      for (const msg of recentHistory) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }

      const lastContent = contents[contents.length - 1];
      if (
        !lastContent ||
        lastContent.role !== "user" ||
        lastContent.parts[0]?.text !== userMessage
      ) {
        contents.push({
          role: "user",
          parts: [{ text: userMessage }],
        });
      }

      const promptChars =
        systemText.length +
        contents.reduce((sum, c) => sum + (c.parts[0]?.text.length ?? 0), 0);

      const { text, diagnostic } = await fetchGeminiStreamWithRetry({
        mode: "chat",
        apiKey: cfg.apiKey,
        model: cfg.model,
        promptChars,
        locale: context.locale,
        externalSignal: options?.signal,
        onChunk: options?.onChunk,
        body: {
          system_instruction: { parts: [{ text: systemText }] },
          contents,
          generationConfig: {
            temperature: GEMINI_REQUEST_CONFIG.chatTemperature,
            topP: GEMINI_REQUEST_CONFIG.topP,
            maxOutputTokens: GEMINI_REQUEST_CONFIG.chatMaxOutputTokens,
            ...buildFastThinkingConfig(cfg.model),
          },
        },
      });

      return {
        reply: text,
        provider: "gemini",
        model: cfg.model,
        diagnostic,
      };
    } finally {
      inFlightChatPromise = null;
    }
  })();

  inFlightChatPromise = task;
  return task;
}
