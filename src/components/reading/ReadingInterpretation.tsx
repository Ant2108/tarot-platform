"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  HeartHandshake,
  KeyRound,
  Loader2,
  RefreshCw,
  Sparkles,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { GeminiDiagnosticPanel } from "@/components/ai/GeminiDiagnosticPanel";
import { StreamingMarkdown } from "@/components/ai/StreamingMarkdown";
import { DEFAULT_GEMINI_MODEL } from "@/config/gemini";
import { UI_TEXT, getLocalizedTopicLabel } from "@/lib/i18n";
import { withBasePath } from "@/lib/utils";
import {
  GeminiServiceError,
  generateTarotReading,
} from "@/services/geminiService";
import { useAISettingsStore } from "@/store/ai-settings-store";
import { useLocaleStore } from "@/store/locale-store";
import { useReadingStore } from "@/store/reading-store";
import type { DrawnCard, SpreadConfig, TopicMeta } from "@/types/tarot";

gsap.registerPlugin(useGSAP);

interface ReadingInterpretationProps {
  readingId: string;
  topic: TopicMeta;
  spread: SpreadConfig;
  drawnCards: DrawnCard[];
  userQuestion?: string;
}

export function ReadingInterpretation({
  readingId,
  topic,
  spread,
  drawnCards,
  userQuestion = "",
}: ReadingInterpretationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoTriggeredKeyRef = useRef<string | null>(null);
  const requestSeqRef = useRef(0);
  const isRunningRef = useRef(false);
  const isMountedRef = useRef(true);

  const { locale } = useLocaleStore();
  const { apiKey, model, _hasHydrated, openSettings } = useAISettingsStore();
  const hasGeminiKey = Boolean(apiKey.trim());
  const activeModel = model.trim() || DEFAULT_GEMINI_MODEL;
  const t = UI_TEXT[locale].interpretation;
  const topicLabel = getLocalizedTopicLabel(topic.id, locale, topic.label);

  const {
    aiReading,
    aiReadingId,
    aiReadingLocale,
    aiStatus,
    aiError,
    aiErrorCode,
    aiRetryable,
    aiDiagnostic,
    aiProvider,
    setAIReadingLoading,
    resetAIStatusIfLoading,
    setAIReadingSuccess,
    setAIReadingError,
  } = useReadingStore();

  const [refsOpen, setRefsOpen] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const handleCancelGeneration = useCallback(() => {
    requestSeqRef.current += 1;
    isRunningRef.current = false;
    abortControllerRef.current?.abort();
    setStreamingText("");
    setAIReadingError(
      locale === "vi"
        ? "Bạn đã dừng phiên luận giải Gemini. Bạn có thể bấm Thử Lại hoặc chuyển sang Giải Cục Bộ."
        : "Generation cancelled. You can retry or switch to Local Mode.",
      { retryable: true }
    );
  }, [locale, setAIReadingError]);

  const runGeneration = useCallback(
    async (forceLocal = false) => {
      if (drawnCards.length !== 3) return;
      // Prevent duplicate concurrent requests on rapid clicks
      if (isRunningRef.current && !forceLocal) return;

      isRunningRef.current = true;
      const mySeq = ++requestSeqRef.current;
      if (forceLocal) {
        abortControllerRef.current?.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStreamingText("");
      setAIReadingLoading();
      try {
        const res = await generateTarotReading({
          readingId,
          topic,
          spread,
          drawnCards,
          userQuestion,
          locale,
          forceLocal,
          signal: controller.signal,
          onChunk: (accumulated) => {
            if (
              isMountedRef.current &&
              !controller.signal.aborted &&
              requestSeqRef.current === mySeq
            ) {
              setStreamingText(accumulated);
            }
          },
        });
        if (controller.signal.aborted || requestSeqRef.current !== mySeq) return;
        setAIReadingSuccess(
          res.reading,
          readingId,
          locale,
          res.provider,
          res.diagnostic ?? null
        );
      } catch (err) {
        if (controller.signal.aborted || requestSeqRef.current !== mySeq) return;
        if (err instanceof GeminiServiceError) {
          setAIReadingError(err.message, {
            code: err.code,
            retryable: err.retryable,
            diagnostic: err.diagnostic,
          });
        } else {
          setAIReadingError(
            err instanceof Error
              ? err.message
              : locale === "vi"
              ? "Đã xảy ra lỗi khi kết nối AI Tarot Reader."
              : "An error occurred while contacting the AI Tarot Reader.",
            { retryable: true }
          );
        }
      } finally {
        if (requestSeqRef.current === mySeq) {
          isRunningRef.current = false;
          if (isMountedRef.current) {
            setStreamingText("");
          }
          resetAIStatusIfLoading();
        }
      }
    },
    [
      drawnCards,
      locale,
      readingId,
      resetAIStatusIfLoading,
      setAIReadingError,
      setAIReadingLoading,
      setAIReadingSuccess,
      spread,
      topic,
      userQuestion,
    ]
  );

  // Track mount state without aborting in-flight single-flight Gemini requests on React StrictMode dev remount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // StrictMode-safe auto-generation: waits for localStorage hydration,
  // triggers at most ONE request per (readingId, locale, hasGeminiKey, activeModel),
  // and automatically re-runs when the user switches to a different model or adds an API key.
  useEffect(() => {
    if (!_hasHydrated) return;
    if (drawnCards.length !== 3) return;
    if (aiStatus === "loading") return;

    const triggerKey = `${readingId}:${locale}:${hasGeminiKey ? `gemini:${activeModel}` : "local"}`;
    const alreadyMatches =
      aiReading !== null &&
      aiReadingId === readingId &&
      aiReadingLocale === locale &&
      aiStatus === "success";
    const shouldUpgradeToGemini =
      alreadyMatches && hasGeminiKey && aiProvider === "local-fallback";
    const modelChangedAfterError =
      aiStatus === "error" && autoTriggeredKeyRef.current !== triggerKey;

    if (alreadyMatches && !shouldUpgradeToGemini) return;
    if (aiStatus === "error" && !modelChangedAfterError) return;
    if (autoTriggeredKeyRef.current === triggerKey) return;

    autoTriggeredKeyRef.current = triggerKey;
    runGeneration(false);
  }, [
    _hasHydrated,
    activeModel,
    aiProvider,
    aiReading,
    aiReadingId,
    aiReadingLocale,
    aiStatus,
    drawnCards.length,
    hasGeminiKey,
    locale,
    readingId,
    runGeneration,
  ]);

  useGSAP(
    () => {
      if (aiStatus !== "success") return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".interp-reveal", {
          y: 20,
          opacity: 0,
          duration: 0.7,
          stagger: 0.09,
          ease: "power2.out",
          clearProps: "transform",
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [aiStatus, locale] }
  );

  // Live SSE Streaming & Initial Loading State (never blocks cards above; supports Cancel)
  if (aiStatus === "loading" || (aiStatus === "idle" && !aiReading)) {
    if (streamingText) {
      return (
        <Panel className="p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
              <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-[0.2em]">
                {locale === "vi"
                  ? "Tarot Reader đang luận giải trực tiếp..."
                  : "Tarot Reader streaming live..."}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelGeneration}
            >
              <Square className="h-3 w-3" aria-hidden="true" />
              {locale === "vi" ? "Dừng" : "Cancel"}
            </Button>
          </div>
          <StreamingMarkdown text={streamingText} isStreaming />
        </Panel>
      );
    }

    return (
      <Panel className="p-8 sm:p-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--arcana-gold)]" />
        <h2 className="mt-4 font-editorial text-2xl sm:text-3xl text-[var(--arcana-ink)]">
          {locale === "vi"
            ? "Tarot Reader đang cảm nhận và kết nối 3 lá bài của bạn..."
            : "Your Tarot Reader is tuning into your three-card spread..."}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--arcana-stone)]">
          {locale === "vi"
            ? "Đang chờ luồng phản hồi trực tiếp từ Gemini (tối đa 10 giây cho ký tự đầu tiên)."
            : "Awaiting live stream from Gemini (10s max for first response chunk)."}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancelGeneration}
          >
            <Square className="h-3 w-3" aria-hidden="true" />
            {locale === "vi" ? "Hủy" : "Cancel"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => runGeneration(true)}
          >
            {locale === "vi"
              ? "Xem ngay bản luận giải cục bộ"
              : "View Offline Reading Immediately"}
          </Button>
        </div>
      </Panel>
    );
  }

  // Error State with Contextual Retry (only when meaningful), Settings & Offline Fallback
  if (aiStatus === "error" || !aiReading) {
    const showSettingsAction =
      aiErrorCode === "GEMINI_INVALID_API_KEY" ||
      aiErrorCode === "GEMINI_PERMISSION_DENIED" ||
      aiErrorCode === "GEMINI_MODEL_UNAVAILABLE";

    return (
      <Panel className="p-6 sm:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <h3 className="font-editorial text-2xl text-[var(--arcana-ink)]">
                {locale === "vi"
                  ? "Chưa thể kết nối AI Tarot Reader"
                  : "Unable to Reach AI Tarot Reader"}
              </h3>
              <p className="text-xs text-[var(--arcana-stone)]">
                {aiError ||
                  (locale === "vi"
                    ? "Vui lòng thử lại hoặc sử dụng chế độ luận giải cục bộ."
                    : "Please retry or switch to the local contextual reading.")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={aiRetryable ? "gold" : "outline"}
              onClick={() => runGeneration(false)}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {locale === "vi" ? "Thử Lại" : "Retry AI"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showSettingsAction || aiErrorCode === "GEMINI_DAILY_QUOTA" ? "gold" : "outline"}
              onClick={openSettings}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              {locale === "vi" ? "Cài Đặt Gemini" : "Gemini Settings"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => runGeneration(true)}
            >
              {locale === "vi"
                ? "Dùng Luận Giải Cục Bộ"
                : "Use Local Reading"}
            </Button>
          </div>
        </div>
        <GeminiDiagnosticPanel diagnostic={aiDiagnostic} />
      </Panel>
    );
  }

  const isGemini = aiProvider === "gemini";

  return (
    <div ref={containerRef} className="space-y-8">
      {/* BYOK Setup Prompt when hydration is complete and no personal Gemini API Key is configured */}
      {_hasHydrated && !hasGeminiKey && (
        <Panel className="border-[rgba(212,180,117,0.3)] bg-[rgba(212,180,117,0.05)] p-5 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <KeyRound
                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--arcana-gold)]"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--arcana-gold-light)]">
                  {locale === "vi"
                    ? "Đang dùng chế độ cục bộ (Offline Fallback)"
                    : "Offline Tarot Fallback Active"}
                </p>
                <p className="text-xs leading-relaxed text-[var(--arcana-stone)]">
                  {locale === "vi"
                    ? "Mỗi người dùng sử dụng Gemini API Key của riêng mình. Nhập API Key cá nhân để AI Tarot Reader luận giải sâu và trò chuyện trực tiếp về trải bài này."
                    : "Each visitor uses their own Google Gemini API Key. Configure your personal key to unlock deep AI Tarot synthesis and contextual follow-up chat."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="gold" onClick={openSettings}>
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                {locale === "vi" ? "Nhập API Key Ngay" : "Quick Setup"}
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/settings">
                  {locale === "vi" ? "Trang Cài Đặt AI" : "AI Settings Page"}
                </Link>
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* A. OVERALL ENERGY */}
      <Panel className="interp-reveal p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">
              {locale === "vi" ? "Năng Lượng Tổng Thể" : "Overall Energy"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isGemini ? "gold" : "violet"}>
              {isGemini
                ? "Gemini AI Tarot Reader"
                : locale === "vi"
                ? "Chế Độ Cục Bộ (Offline)"
                : "Local Contextual Mode"}
            </Badge>
            {hasGeminiKey ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => runGeneration(false)}
                  className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)] cursor-pointer"
                  title={
                    locale === "vi"
                      ? "Luận giải lại bằng Gemini AI"
                      : "Regenerate with Gemini AI"
                  }
                >
                  <RefreshCw className="h-3 w-3" aria-hidden="true" />
                  {locale === "vi" ? "Gemini AI" : "Gemini AI"}
                </button>
                <span className="text-[var(--arcana-stone)]/40">·</span>
                <button
                  type="button"
                  onClick={() => runGeneration(true)}
                  className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)] cursor-pointer"
                >
                  {locale === "vi" ? "Giải cục bộ" : "Local Mode"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex items-center gap-1.5 rounded-sm border border-[rgba(212,180,117,0.35)] bg-[rgba(212,180,117,0.1)] px-2.5 py-1 text-[11px] font-medium text-[var(--arcana-gold-light)] hover:bg-[rgba(212,180,117,0.18)] cursor-pointer"
              >
                <KeyRound className="h-3 w-3" aria-hidden="true" />
                {locale === "vi"
                  ? "Kết nối Gemini AI"
                  : "Connect Gemini AI"}
              </button>
            )}
          </div>
        </div>

        {userQuestion.trim() && (
          <p className="mt-3 text-xs italic text-[var(--arcana-gold-light)]/90">
            {t.yourQuestion}: &ldquo;{userQuestion.trim()}&rdquo; · {topicLabel}
          </p>
        )}

        <p className="mt-4 font-editorial text-xl leading-relaxed text-[var(--arcana-ink)] sm:text-2xl">
          {aiReading.overallEnergy}
        </p>

        <GeminiDiagnosticPanel diagnostic={aiDiagnostic} />
      </Panel>

      {/* B. INDIVIDUAL CARD INTERPRETATIONS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {drawnCards.map((item, idx) => {
          const { card, orientation } = item;
          const cardAI = aiReading.cardInterpretations[idx];

          return (
            <Panel
              key={card.id}
              className="interp-reveal flex flex-col justify-between p-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--arcana-gold)]">
                      0{idx + 1} · {cardAI?.positionLabel ?? item.position.label}
                    </p>
                    <p className="text-[11px] text-[var(--arcana-stone)]">
                      {card.astrology ?? card.element}
                    </p>
                  </div>
                  <Badge tone={orientation === "upright" ? "gold" : "violet"}>
                    {orientation === "upright" ? t.upright : t.reversed}
                  </Badge>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-24 shrink-0 self-start aspect-[7/12] overflow-hidden rounded-sm border border-[rgba(212,180,117,0.3)] bg-[#07080d]">
                    <img
                      src={withBasePath(card.image)}
                      alt={`${card.name} (${orientation})`}
                      className={`h-full w-full object-cover ${
                        orientation === "reversed" ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="font-editorial text-2xl font-semibold leading-tight text-[var(--arcana-ink)]">
                      {card.name}
                    </h3>
                    {locale === "vi" && card.titleVi && (
                      <p className="text-xs text-[var(--arcana-gold-light)]">
                        {card.titleVi}
                      </p>
                    )}
                    {cardAI?.symbolismHighlight && (
                      <p className="pt-1 text-[11px] italic leading-relaxed text-[var(--arcana-stone)]">
                        {cardAI.symbolismHighlight}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 text-xs leading-relaxed text-[var(--arcana-ink)]/92 sm:text-sm">
                  {cardAI?.interpretation}
                </div>
              </div>

              <div className="mt-5 border-t border-white/10 pt-3">
                <Link
                  href={`/library/${card.slug}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--arcana-gold-light)] hover:text-[var(--arcana-gold)]"
                >
                  {t.openStudy}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>

      {/* C. CONNECTION BETWEEN CARDS (Visually Prominent Core Section) */}
      <section className="interp-reveal rounded-md border border-[rgba(212,180,117,0.38)] bg-[radial-gradient(ellipse_at_top_left,rgba(110,92,142,0.18)_0%,rgba(12,16,29,0.92)_60%)] p-6 sm:p-8 shadow-[0_0_40px_rgba(212,180,117,0.08)]">
        <div className="flex items-center gap-2 text-[var(--arcana-gold-light)]">
          <Compass className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em]">
            {locale === "vi"
              ? "Mối Liên Kết Giữa Ba Lá Bài"
              : "Connection Between the Cards"}
          </span>
        </div>
        <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--arcana-ink)]/95 sm:text-base">
          {aiReading.cardConnections}
        </div>
      </section>

      {/* D. DEEP INTERPRETATION (Human Tarot Reader Voice) */}
      <Panel className="interp-reveal p-6 sm:p-8">
        <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
          <Eye className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-[0.2em]">
            {locale === "vi" ? "Luận Giải Sâu" : "Deep Interpretation"}
          </span>
        </div>
        <div className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--arcana-ink)]/92 sm:text-base">
          {aiReading.deepInterpretation}
        </div>
      </Panel>

      {/* E. ADVICE & REFLECTION */}
      <Panel className="interp-reveal p-6 sm:p-8">
        <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
          <HeartHandshake className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs font-medium uppercase tracking-[0.2em]">
            {locale === "vi" ? "Lời Khuyên & Chiêm Nghiệm" : "Advice & Reflection"}
          </span>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-sm border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arcana-gold-light)]">
              {locale === "vi" ? "Điều cần chú ý" : "What to Pay Attention To"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--arcana-ink)]/90 sm:text-sm">
              {aiReading.adviceAndReflection.payAttentionTo}
            </p>
          </div>
          <div className="rounded-sm border border-white/10 bg-white/[0.025] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arcana-gold-light)]">
              {locale === "vi"
                ? "Điều bạn có thể đang bỏ lỡ"
                : "What You Might Be Overlooking"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[var(--arcana-ink)]/90 sm:text-sm">
              {aiReading.adviceAndReflection.possiblyOverlooking}
            </p>
          </div>
        </div>

        {aiReading.adviceAndReflection.possibleActions.length > 0 && (
          <div className="mt-5 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arcana-stone)]">
              {locale === "vi"
                ? "Gợi ý hành động & góc nhìn mới"
                : "Possible Actions & Perspective Shifts"}
            </p>
            <ul className="grid gap-3 md:grid-cols-3">
              {aiReading.adviceAndReflection.possibleActions.map((act, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-sm border border-white/10 bg-white/[0.02] p-3.5 text-xs leading-relaxed text-[var(--arcana-ink)]/90"
                >
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--arcana-gold)]"
                    aria-hidden="true"
                  />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-sm border border-[rgba(212,180,117,0.28)] bg-[rgba(212,180,117,0.06)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--arcana-gold)]">
            {locale === "vi" ? "Câu hỏi chiêm nghiệm dành cho bạn" : "A Question to Sit With"}
          </p>
          <p className="mt-1.5 font-editorial text-xl italic text-[var(--arcana-ink)]">
            &ldquo;{aiReading.adviceAndReflection.reflectionQuestion}&rdquo;
          </p>
        </div>
      </Panel>

      {/* F. CLOSING MESSAGE */}
      <div className="interp-reveal rounded-md border border-white/10 bg-[rgba(7,8,13,0.55)] px-6 py-5 text-center">
        <p className="mx-auto max-w-2xl font-editorial text-lg italic leading-relaxed text-[var(--arcana-gold-light)]/95 sm:text-xl">
          {aiReading.closingMessage}
        </p>
      </div>

      {/* OPTIONAL EXPANDABLE TRADITIONAL CARD REFERENCES (Kept out of main reading) */}
      <div className="rounded-md border border-white/10 bg-[rgba(7,8,13,0.4)]">
        <button
          type="button"
          onClick={() => setRefsOpen((v) => !v)}
          aria-expanded={refsOpen}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left text-xs font-medium uppercase tracking-[0.16em] text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)] cursor-pointer"
        >
          <span className="inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--arcana-gold)]" aria-hidden="true" />
            {locale === "vi"
              ? "Tài Liệu Tham Chiếu Truyền Thống (Tùy chọn)"
              : "Traditional Card References (Optional)"}
          </span>
          {refsOpen ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {refsOpen && (
          <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-3 text-xs">
            {drawnCards.map((d) => (
              <div
                key={d.card.id}
                className="space-y-1.5 rounded-sm border border-white/10 bg-white/[0.02] p-3.5"
              >
                <p className="font-semibold text-[var(--arcana-ink)]">
                  {d.card.name} ({d.orientation})
                </p>
                {d.card.sourceReferences.map((ref, i) => (
                  <p key={i} className="text-[11px] text-[var(--arcana-stone)]">
                    • {ref.sourceTitle} ({ref.pageNumbers})
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
