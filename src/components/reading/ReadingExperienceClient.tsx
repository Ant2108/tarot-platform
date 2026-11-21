"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Coins,
  Compass,
  Eye,
  GraduationCap,
  Heart,
  HeartPulse,
  History,
  Home,
  MessageCircleQuestion,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { ReadingInterpretation } from "./ReadingInterpretation";
import { TarotChatInterface } from "./TarotChatInterface";
import { TAROT_TOPICS, getSpreadById, getTopicById } from "@/data/spreads";
import {
  UI_TEXT,
  getLocalizedPositionLabel,
  getLocalizedSpreadDesc,
  getLocalizedSpreadName,
  getLocalizedTopicDesc,
  getLocalizedTopicLabel,
} from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale-store";
import { useReadingStore, type ReadingPhase } from "@/store/reading-store";
import type { TarotTopicId } from "@/types/tarot";

const ReadingTableScene = dynamic(
  () =>
    import("@/components/three/ReadingTableScene").then(
      (m) => m.ReadingTableScene
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[340px] sm:h-[420px] items-center justify-center rounded-md border border-[rgba(212,180,117,0.18)] bg-[#0c101d] text-xs uppercase tracking-[0.2em] text-[var(--arcana-stone)]">
        Preparing 3D Tarot Table...
      </div>
    ),
  }
);

const TOPIC_ICONS: Record<TarotTopicId, typeof Heart> = {
  love: Heart,
  career: Briefcase,
  family: Home,
  finance: Coins,
  personalGrowth: Sparkles,
  general: Compass,
  customQuestion: MessageCircleQuestion,
  energyCheck: Zap,
  study: GraduationCap,
  health: HeartPulse,
};

const PHASE_ORDER: ReadingPhase[] = [
  "topic",
  "spread",
  "shuffle",
  "select",
  "reveal",
  "result",
];

export function ReadingExperienceClient() {
  const { locale } = useLocaleStore();
  const t = UI_TEXT[locale].reading;

  const {
    readingId,
    phase,
    topicId,
    spreadId,
    userQuestion,
    shuffleCount,
    selectedDeckSlots,
    drawnCards,
    readingHistory,
    setTopic,
    setSpread,
    setUserQuestion,
    setPhase,
    shuffleDeck,
    selectCardFromSlot,
    revealCardAt,
    revealAllCards,
    clearHistory,
    resetReading,
  } = useReadingStore();

  const [isShuffling, setIsShuffling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeTopic = getTopicById(topicId);
  const activeSpread = getSpreadById(spreadId);

  const activeTopicLabel = getLocalizedTopicLabel(
    activeTopic.id,
    locale,
    activeTopic.label
  );
  const activeSpreadName = getLocalizedSpreadName(
    activeSpread.id,
    locale,
    activeSpread.name
  );

  const handleShuffle = () => {
    setIsShuffling(true);
    shuffleDeck();
    setTimeout(() => {
      setIsShuffling(false);
    }, 950);
  };

  const currentStepIndex = PHASE_ORDER.indexOf(phase);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header & Controls */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[rgba(212,180,117,0.14)] pb-6 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--arcana-gold)]">
            {t.eyebrow}
          </p>
          <h1 className="font-editorial text-4xl font-semibold sm:text-5xl">
            {t.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowHistory((v) => !v)}
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            {t.history} ({readingHistory.length})
          </Button>
          {phase !== "topic" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetReading}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.newReading}
            </Button>
          )}
        </div>
      </div>

      {/* Step Progress Bar */}
      <ol
        aria-label="Reading progress"
        className="mb-8 flex flex-wrap items-center gap-2 text-xs"
      >
        {t.steps.map((label, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;
          return (
            <li
              key={label}
              className={`rounded-full border px-3 py-1 tracking-wider uppercase ${
                isCurrent
                  ? "border-[var(--arcana-gold)] bg-[rgba(212,180,117,0.18)] text-[var(--arcana-gold-light)]"
                  : isCompleted
                  ? "border-[rgba(212,180,117,0.3)] text-[var(--arcana-ink)]"
                  : "border-white/10 text-[var(--arcana-stone)]/60"
              }`}
            >
              {label}
            </li>
          );
        })}
      </ol>

      {/* Optional LocalStorage Reading History */}
      {showHistory && (
        <Panel className="mb-8 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-editorial text-2xl font-semibold">
              {t.savedHistory}
            </h2>
            {readingHistory.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearHistory}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t.clearHistory}
              </Button>
            )}
          </div>
          {readingHistory.length === 0 ? (
            <p className="text-xs text-[var(--arcana-stone)]">{t.noHistory}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {readingHistory.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-sm border border-white/10 bg-white/[0.02] p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--arcana-gold-light)]">
                      {getLocalizedSpreadName(rec.spreadId, locale, rec.spreadName)}
                    </span>
                    <span className="text-[10px] text-[var(--arcana-stone)]">
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-[var(--arcana-stone)]">
                    {rec.cards.map((c) => (
                      <li key={c.cardId} className="flex justify-between gap-2">
                        <Link
                          href={`/library/${c.slug}`}
                          className="hover:text-[var(--arcana-ink)]"
                        >
                          {c.positionLabel}: {c.cardName}
                        </Link>
                        <span className="uppercase text-[10px]">
                          {c.orientation}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: Select Topic & Enter Situation/Question */}
        {phase === "topic" && (
          <motion.section
            key="topic"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="max-w-2xl space-y-2">
              <h2 className="font-editorial text-3xl font-semibold">
                {t.chooseTopicTitle}
              </h2>
              <p className="text-sm text-[var(--arcana-stone)]">
                {t.chooseTopicDesc}
              </p>
            </div>

            {/* Situation / Question Input */}
            <Panel className="p-5">
              <label
                htmlFor="reading-user-question"
                className="block text-xs font-medium uppercase tracking-[0.16em] text-[var(--arcana-gold-light)]"
              >
                {t.questionLabel}
              </label>
              <textarea
                id="reading-user-question"
                rows={2}
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder={t.questionPlaceholder}
                className="mt-2.5 w-full rounded-sm border border-[rgba(212,180,117,0.22)] bg-[rgba(7,8,13,0.75)] px-3.5 py-2.5 text-sm text-[var(--arcana-ink)] placeholder:text-[var(--arcana-stone)]/65 focus:border-[var(--arcana-gold)] focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="gold"
                  onClick={() => {
                    setTopic("customQuestion");
                    shuffleDeck();
                    setPhase("shuffle");
                  }}
                >
                  <MessageCircleQuestion
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  {locale === "vi"
                    ? "Bốc Ngay Theo Câu Hỏi Này"
                    : "Draw Directly for This Question"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTopic("energyCheck");
                    if (!userQuestion.trim()) {
                      setUserQuestion(
                        locale === "vi"
                          ? "Check năng lượng hiện tại của mình hôm nay"
                          : "Check my current energy today"
                      );
                    }
                    shuffleDeck();
                    setPhase("shuffle");
                  }}
                >
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  {locale === "vi"
                    ? "Check Năng Lượng Nhanh"
                    : "Quick Energy Check"}
                </Button>
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TAROT_TOPICS.map((topic) => {
                const Icon = TOPIC_ICONS[topic.id];
                const selected = topic.id === topicId;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setTopic(topic.id)}
                    className={`surface-panel flex flex-col justify-between rounded-md p-6 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-[var(--arcana-gold)] ring-1 ring-[rgba(212,180,117,0.45)]"
                        : "hover:border-[rgba(212,180,117,0.38)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <Icon
                          className="h-5 w-5 text-[var(--arcana-gold)]"
                          aria-hidden="true"
                        />
                        {selected && <Badge tone="gold">{t.selected}</Badge>}
                      </div>
                      <h3 className="mt-4 font-editorial text-2xl font-semibold text-[var(--arcana-ink)]">
                        {getLocalizedTopicLabel(topic.id, locale, topic.label)}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--arcana-stone)]">
                        {getLocalizedTopicDesc(
                          topic.id,
                          locale,
                          topic.description
                        )}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
                      {topic.spreads[0].positions.map((pos, pIdx) => (
                        <span
                          key={pos.label}
                          className="rounded-sm bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--arcana-stone)]"
                        >
                          {getLocalizedPositionLabel(
                            topic.spreads[0].id,
                            pIdx,
                            locale,
                            pos.label
                          )}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                size="lg"
                variant="gold"
                onClick={() => setPhase("spread")}
              >
                {t.nextSpread}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </motion.section>
        )}

        {/* STEP 2: Select Spread */}
        {phase === "spread" && (
          <motion.section
            key="spread"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Badge tone="gold">{activeTopicLabel}</Badge>
              <h2 className="font-editorial text-3xl font-semibold">
                {t.chooseSpreadTitle}
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {activeTopic.spreads.map((sp) => {
                const selected = sp.id === spreadId;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setSpread(sp.id)}
                    className={`surface-panel rounded-md p-6 text-left transition-all cursor-pointer ${
                      selected
                        ? "border-[var(--arcana-gold)] ring-1 ring-[rgba(212,180,117,0.45)]"
                        : "hover:border-[rgba(212,180,117,0.35)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-editorial text-2xl font-semibold">
                        {getLocalizedSpreadName(sp.id, locale, sp.name)}
                      </h3>
                      {selected && <Badge tone="gold">{t.selected}</Badge>}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--arcana-stone)]">
                      {getLocalizedSpreadDesc(sp.id, locale, sp.description)}
                    </p>
                    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {sp.positions.map((pos, idx) => (
                        <div
                          key={pos.label}
                          className="rounded-sm border border-white/10 bg-white/[0.03] p-2.5"
                        >
                          <p className="text-[10px] uppercase tracking-widest text-[var(--arcana-gold)]">
                            {t.cardSlot} {idx + 1}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-[var(--arcana-ink)]">
                            {getLocalizedPositionLabel(
                              sp.id,
                              idx,
                              locale,
                              pos.label
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPhase("topic")}
              >
                {t.backToTopics}
              </Button>
              <Button
                type="button"
                size="lg"
                variant="gold"
                onClick={() => {
                  shuffleDeck();
                  setPhase("shuffle");
                }}
              >
                {t.proceedDeck}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </motion.section>
        )}

        {/* STEPS 3–6: 3D Deck Shuffle, Select 3, Reveal & Result */}
        {(phase === "shuffle" ||
          phase === "select" ||
          phase === "reveal" ||
          phase === "result") && (
          <motion.section
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            <ReadingTableScene
              phase={phase}
              spread={activeSpread}
              drawnCards={drawnCards}
              selectedSlots={selectedDeckSlots}
              shuffleCount={shuffleCount}
              isShuffling={isShuffling}
              onSelectSlot={selectCardFromSlot}
              onRevealCard={revealCardAt}
            />

            {phase === "shuffle" && (
              <Panel className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold">
                    {t.shuffleTitle}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--arcana-stone)]">
                    {t.shuffleDescPrefix}{" "}
                    <strong className="text-[var(--arcana-ink)]">
                      {activeTopicLabel} ({activeSpreadName})
                    </strong>
                    . {t.shuffledCount} {shuffleCount} {t.times}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShuffle}
                    disabled={isShuffling}
                  >
                    <Shuffle className="h-4 w-4" aria-hidden="true" />
                    {isShuffling ? t.shuffling : t.shuffleAgain}
                  </Button>
                  <Button
                    type="button"
                    variant="gold"
                    onClick={() => setPhase("select")}
                    disabled={isShuffling}
                  >
                    {t.fanDeck}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </Panel>
            )}

            {phase === "select" && (
              <Panel className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
                <div>
                  {drawnCards.length >= 3 ? (
                    <>
                      <h2 className="font-editorial text-2xl font-semibold text-[var(--arcana-gold-light)]">
                        {locale === "vi"
                          ? "Đã rút đủ 3 lá bài..."
                          : "All 3 cards drawn..."}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--arcana-stone)]">
                        {locale === "vi"
                          ? "Đang sắp xếp 3 lá bài lên bàn trải bài để bạn lật mở."
                          : "Arranging your three cards on the reading table."}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-editorial text-2xl font-semibold">
                        {t.selectMorePrefix} {3 - drawnCards.length}{" "}
                        {t.selectMoreSuffix}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--arcana-stone)]">
                        {t.selectHint}{" "}
                        <strong className="text-[var(--arcana-gold-light)]">
                          {getLocalizedPositionLabel(
                            activeSpread.id,
                            drawnCards.length,
                            locale,
                            activeSpread.positions[drawnCards.length]?.label ?? ""
                          )}
                        </strong>
                        .
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeSpread.positions.map((pos, idx) => (
                    <Badge
                      key={pos.label}
                      tone={drawnCards[idx] ? "gold" : "muted"}
                    >
                      {idx + 1}.{" "}
                      {getLocalizedPositionLabel(
                        activeSpread.id,
                        idx,
                        locale,
                        pos.label
                      )}
                    </Badge>
                  ))}
                </div>
              </Panel>
            )}

            {phase === "reveal" && (
              <Panel className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold">
                    {drawnCards.length === 3 && drawnCards.every((d) => d.revealed)
                      ? locale === "vi"
                        ? "Đang mở lá bài cuối cùng..."
                        : "Revealing your final card..."
                      : t.revealTitle}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--arcana-stone)]">
                    {drawnCards.length === 3 && drawnCards.every((d) => d.revealed)
                      ? locale === "vi"
                        ? "Chờ lá bài lật xong để bắt đầu luận giải trọn vẹn."
                        : "Finishing card flip before starting your reading."
                      : t.revealDesc}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {drawnCards.map((item, idx) => (
                    <Button
                      key={item.card.id}
                      type="button"
                      size="sm"
                      variant={item.revealed ? "subtle" : "outline"}
                      disabled={item.revealed}
                      onClick={() => revealCardAt(idx)}
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {getLocalizedPositionLabel(
                        activeSpread.id,
                        idx,
                        locale,
                        item.position.label
                      )}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="gold"
                    disabled={
                      drawnCards.length === 3 &&
                      drawnCards.every((d) => d.revealed)
                    }
                    onClick={revealAllCards}
                  >
                    {t.revealAll}
                  </Button>
                </div>
              </Panel>
            )}

            {phase === "result" && (
              <div className="space-y-10">
                <ReadingInterpretation
                  readingId={readingId}
                  topic={activeTopic}
                  spread={activeSpread}
                  drawnCards={drawnCards}
                  userQuestion={userQuestion}
                />

                <TarotChatInterface
                  readingId={readingId}
                  topic={activeTopic}
                  spread={activeSpread}
                  drawnCards={drawnCards}
                  userQuestion={userQuestion}
                />
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
