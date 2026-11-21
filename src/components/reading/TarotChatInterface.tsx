"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  KeyRound,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/card";
import { GeminiDiagnosticPanel } from "@/components/ai/GeminiDiagnosticPanel";
import { StreamingMarkdown } from "@/components/ai/StreamingMarkdown";
import {
  UI_TEXT,
  getLocalizedPositionLabel,
  getLocalizedSpreadName,
  getLocalizedTopicLabel,
} from "@/lib/i18n";
import {
  GeminiServiceError,
  isGeminiConfigured,
  sendTarotMessage,
  type GeminiDiagnosticInfo,
} from "@/services/geminiService";
import { tarotChatService } from "@/services/tarot-chat-service";
import { useAISettingsStore } from "@/store/ai-settings-store";
import { useLocaleStore } from "@/store/locale-store";
import { useReadingStore } from "@/store/reading-store";
import type { DrawnCard, SpreadConfig, TopicMeta } from "@/types/tarot";

interface TarotChatInterfaceProps {
  readingId: string;
  topic: TopicMeta;
  spread: SpreadConfig;
  drawnCards: DrawnCard[];
  userQuestion?: string;
}

export function TarotChatInterface({
  readingId,
  topic,
  spread,
  drawnCards,
  userQuestion = "",
}: TarotChatInterfaceProps) {
  const { locale } = useLocaleStore();
  const { apiKey, openSettings } = useAISettingsStore();
  const hasGeminiKey = Boolean(apiKey.trim());
  const t = UI_TEXT[locale].chat;
  const ti = UI_TEXT[locale].interpretation;

  const { aiReading, aiProvider, chatHistory, addChatMessage, clearChat } =
    useReadingStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingReply, setStreamingReply] = useState("");
  const [preferLocalChat, setPreferLocalChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatRetryable, setChatRetryable] = useState(true);
  const [chatDiagnostic, setChatDiagnostic] =
    useState<GeminiDiagnosticInfo | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Synchronous ref lock prevents rapid double-click duplicate requests
  const submittingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const context = useMemo(
    () => ({
      readingId,
      topic,
      spread,
      drawnCards,
      userQuestion,
      initialReading: aiReading,
      locale,
    }),
    [readingId, topic, spread, drawnCards, userQuestion, aiReading, locale]
  );

  const suggestions = useMemo(() => {
    if (aiReading?.suggestedFollowUps?.length) {
      return aiReading.suggestedFollowUps;
    }
    return tarotChatService.getSuggestedQuestions(context);
  }, [aiReading, context]);

  const handleCancelChat = () => {
    abortControllerRef.current?.abort();
    submittingRef.current = false;
    setLoading(false);
    setStreamingReply("");
  };

  const handleSend = async (
    rawText?: string,
    isRetry = false,
    forceLocal = false
  ) => {
    const text = (rawText ?? input).trim();
    if (!text || loading || submittingRef.current) return;

    submittingRef.current = true;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setChatError(null);
    setChatDiagnostic(null);
    setLastFailedText(null);
    setStreamingReply("");

    let historyForCall = chatHistory;
    if (!isRetry) {
      const userMsg = {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content: text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      addChatMessage(userMsg);
      historyForCall = [...chatHistory, userMsg];
      if (!rawText) setInput("");
    }

    setLoading(true);
    try {
      const useLocal = forceLocal || preferLocalChat || !isGeminiConfigured();
      const { reply, diagnostic } = await sendTarotMessage(
        context,
        historyForCall,
        text,
        {
          useLocalFallback: useLocal,
          signal: controller.signal,
          onChunk: (accumulated) => {
            if (!controller.signal.aborted) {
              setStreamingReply(accumulated);
              requestAnimationFrame(() => {
                scrollRef.current?.scrollTo({
                  top: scrollRef.current.scrollHeight,
                });
              });
            }
          },
        }
      );
      if (controller.signal.aborted) return;
      setStreamingReply("");
      if (diagnostic) setChatDiagnostic(diagnostic);
      addChatMessage({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (err) {
      if (controller.signal.aborted) return;
      setStreamingReply("");
      if (err instanceof GeminiServiceError) {
        setChatError(err.message);
        setChatRetryable(err.retryable);
        setChatDiagnostic(err.diagnostic);
      } else {
        setChatError(
          err instanceof Error
            ? err.message
            : locale === "vi"
            ? "Không thể gửi câu hỏi tới AI Tarot Reader."
            : "Unable to send follow-up to AI Tarot Reader."
        );
        setChatRetryable(true);
      }
      setLastFailedText(text);
    } finally {
      submittingRef.current = false;
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  };

  const isGemini =
    hasGeminiKey &&
    !preferLocalChat &&
    (aiProvider === "gemini" || isGeminiConfigured());

  return (
    <Panel className="overflow-hidden">
      <div className="grid lg:grid-cols-12">
        {/* Left Context Panel */}
        <aside className="border-b border-white/10 bg-[rgba(7,8,13,0.45)] p-6 lg:col-span-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                {t.contextTitle}
              </span>
            </div>
            <Badge tone={isGemini ? "gold" : "muted"}>
              {isGemini ? "Gemini AI" : t.offlineBadge}
            </Badge>
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-[11px] uppercase tracking-widest text-[var(--arcana-stone)]">
              {t.topicSpread}
            </p>
            <p className="font-editorial text-xl font-semibold text-[var(--arcana-ink)]">
              {getLocalizedTopicLabel(topic.id, locale, topic.label)}
            </p>
            <p className="text-xs text-[var(--arcana-stone)]">
              {getLocalizedSpreadName(spread.id, locale, spread.name)}
            </p>
          </div>

          {userQuestion && (
            <div className="mt-4 rounded-sm border border-[rgba(212,180,117,0.2)] bg-white/[0.02] p-3 text-xs text-[var(--arcana-ink)]/90">
              <p className="text-[10px] uppercase tracking-wider text-[var(--arcana-gold)]">
                {ti.yourQuestion}
              </p>
              <p className="mt-1 italic">&ldquo;{userQuestion}&rdquo;</p>
            </div>
          )}

          <div className="mt-5 space-y-2.5">
            <p className="text-[11px] uppercase tracking-widest text-[var(--arcana-stone)]">
              {t.selectedCards}
            </p>
            {drawnCards.map((d, idx) => (
              <div
                key={d.card.id}
                className="flex items-center justify-between rounded-sm border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--arcana-gold)]">
                    {getLocalizedPositionLabel(
                      spread.id,
                      idx,
                      locale,
                      d.position.label
                    )}
                  </p>
                  <p className="truncate text-xs font-medium text-[var(--arcana-ink)]">
                    {d.card.name}
                  </p>
                </div>
                <Badge tone={d.orientation === "upright" ? "gold" : "violet"}>
                  {d.orientation === "upright" ? ti.upright : ti.reversed}
                </Badge>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Conversation Panel */}
        <div className="flex h-[520px] flex-col lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2">
              <MessageSquare
                className="h-4 w-4 shrink-0 text-[var(--arcana-gold)]"
                aria-hidden="true"
              />
              <h3 className="font-editorial text-xl font-semibold sm:text-2xl">
                {t.dialogueTitle}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {hasGeminiKey ? (
                <div className="inline-flex items-center rounded-sm border border-[rgba(212,180,117,0.25)] bg-[rgba(7,8,13,0.65)] p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreferLocalChat(false)}
                    className={`rounded-sm px-2 py-0.5 transition-colors cursor-pointer ${
                      !preferLocalChat
                        ? "bg-[rgba(212,180,117,0.2)] text-[var(--arcana-gold-light)]"
                        : "text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)]"
                    }`}
                  >
                    Gemini AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferLocalChat(true)}
                    className={`rounded-sm px-2 py-0.5 transition-colors cursor-pointer ${
                      preferLocalChat
                        ? "bg-[rgba(212,180,117,0.2)] text-[var(--arcana-gold-light)]"
                        : "text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)]"
                    }`}
                  >
                    {locale === "vi" ? "Cục Bộ" : "Local"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openSettings}
                  className="inline-flex items-center gap-1 rounded-sm border border-[rgba(212,180,117,0.32)] bg-[rgba(212,180,117,0.08)] px-2 py-1 text-[11px] text-[var(--arcana-gold-light)] hover:bg-[rgba(212,180,117,0.16)] cursor-pointer"
                >
                  <KeyRound className="h-3 w-3" aria-hidden="true" />
                  {locale === "vi" ? "Kết nối Gemini" : "Connect Gemini"}
                </button>
              )}
              {chatHistory.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearChat}
                  aria-label="Clear chat history"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {t.clear}
                </Button>
              )}
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
          >
            {chatHistory.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles
                  className="mb-3 h-7 w-7 text-[var(--arcana-gold)]/70"
                  aria-hidden="true"
                />
                <p className="font-editorial text-2xl text-[var(--arcana-ink)]">
                  {t.emptyTitle}
                </p>
                <p className="mt-1 max-w-md text-xs leading-relaxed text-[var(--arcana-stone)]">
                  {t.emptyDesc}
                </p>
              </div>
            ) : (
              chatHistory.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-md px-4 py-3 text-xs leading-relaxed sm:text-sm ${
                      msg.role === "user"
                        ? "bg-[rgba(212,180,117,0.18)] border border-[rgba(212,180,117,0.35)] text-[var(--arcana-ink)]"
                        : "bg-white/[0.04] border border-white/10 text-[var(--arcana-ink)]/92"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <StreamingMarkdown text={msg.content} />
                    ) : (
                      <div className="whitespace-pre-line">{msg.content}</div>
                    )}
                    <p className="mt-2 text-[10px] text-[var(--arcana-stone)]">
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))
            )}

            {loading && streamingReply && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-md border border-[rgba(212,180,117,0.22)] bg-white/[0.04] px-4 py-3">
                  <StreamingMarkdown text={streamingReply} isStreaming />
                </div>
              </div>
            )}

            {loading && !streamingReply && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-[var(--arcana-stone)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--arcana-gold)]" />
                  {t.thinking}
                </div>
              </div>
            )}

            {chatError && (
              <div className="rounded-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {chatError}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {lastFailedText && chatRetryable && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => handleSend(lastFailedText, true, false)}
                      >
                        <RefreshCw className="h-3 w-3" aria-hidden="true" />
                        {locale === "vi" ? "Thử lại" : "Retry"}
                      </Button>
                    )}
                    {lastFailedText && (
                      <Button
                        type="button"
                        size="sm"
                        variant="gold"
                        disabled={loading}
                        onClick={() => {
                          setPreferLocalChat(true);
                          handleSend(lastFailedText, true, true);
                        }}
                      >
                        {locale === "vi"
                          ? "Trả lời cục bộ ngay"
                          : "Answer Locally Now"}
                      </Button>
                    )}
                  </div>
                </div>
                <GeminiDiagnosticPanel diagnostic={chatDiagnostic} />
              </div>
            )}
          </div>

          {chatHistory.length === 0 && !loading && (
            <div className="flex flex-wrap gap-1.5 border-t border-white/10 bg-[rgba(7,8,13,0.35)] px-4 py-3 sm:px-6">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-[rgba(212,180,117,0.24)] bg-white/[0.02] px-3 py-1 text-left text-[11px] text-[var(--arcana-stone)] transition-colors hover:border-[var(--arcana-gold)] hover:text-[var(--arcana-gold-light)] cursor-pointer disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-white/10 p-4"
          >
            <label htmlFor="tarot-chat-input" className="sr-only">
              {t.placeholder}
            </label>
            <Input
              id="tarot-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={loading}
            />
            {loading ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCancelChat}
                aria-label="Cancel response"
                title={locale === "vi" ? "Dừng phản hồi" : "Cancel response"}
              >
                <Square className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="gold"
                size="icon"
                disabled={!input.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </form>
        </div>
      </div>
    </Panel>
  );
}
