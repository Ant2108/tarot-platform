"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Info, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UI_TEXT, getLocalizedTopicLabel } from "@/lib/i18n";
import { getCardLocalized } from "@/lib/tarot-data";
import { withBasePath } from "@/lib/utils";
import { useLocaleStore } from "@/store/locale-store";
import type {
  ArcanaType,
  CardOrientation,
  SuitType,
  TarotCard,
  TarotTopicId,
} from "@/types/tarot";

const TOPIC_IDS: TarotTopicId[] = [
  "general",
  "love",
  "family",
  "career",
  "finance",
  "personalGrowth",
];

const SUIT_OPTIONS: { value: "all" | Exclude<SuitType, null>; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Wands", label: "Wands (14)" },
  { value: "Cups", label: "Cups (14)" },
  { value: "Swords", label: "Swords (14)" },
  { value: "Pentacles", label: "Pentacles (14)" },
];

export function TarotLibraryClient({
  cards,
  disclaimer,
}: {
  cards: TarotCard[];
  disclaimer: string;
}) {
  const { locale } = useLocaleStore();
  const t = UI_TEXT[locale].library;

  const [query, setQuery] = useState("");
  const [arcanaFilter, setArcanaFilter] = useState<"all" | ArcanaType>("all");
  const [suitFilter, setSuitFilter] = useState<"all" | Exclude<SuitType, null>>("all");
  const [topicFilter, setTopicFilter] = useState<TarotTopicId>("general");
  const [orientation, setOrientation] = useState<CardOrientation>("upright");

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      if (arcanaFilter !== "all" && card.arcana !== arcanaFilter) return false;
      if (suitFilter !== "all" && card.suit !== suitFilter) return false;
      if (!q) return true;

      const loc = getCardLocalized(card, locale);
      const inName =
        card.name.toLowerCase().includes(q) ||
        (card.titleVi?.toLowerCase().includes(q) ?? false);
      const inKeywords = [
        ...loc.keywords.upright,
        ...loc.keywords.reversed,
        ...card.keywords.upright,
      ].some((kw) => kw.toLowerCase().includes(q));
      const inSuit = card.suit?.toLowerCase().includes(q) ?? false;
      return inName || inKeywords || inSuit;
    });
  }, [cards, query, arcanaFilter, suitFilter, locale]);

  const resetFilters = () => {
    setQuery("");
    setArcanaFilter("all");
    setSuitFilter("all");
    setTopicFilter("general");
    setOrientation("upright");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-4 border-b border-[rgba(212,180,117,0.14)] pb-8 md:flex-row md:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen
              className="h-4 w-4 text-[var(--arcana-gold)]"
              aria-hidden="true"
            />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--arcana-gold)]">
              {t.eyebrow}
            </span>
          </div>
          <h1 className="font-editorial text-4xl font-semibold sm:text-5xl">
            {t.title}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--arcana-stone)]">
            {t.desc}
          </p>
        </div>

        <Tabs
          value={orientation}
          onValueChange={(v) => setOrientation(v as CardOrientation)}
        >
          <TabsList aria-label="Card orientation preview">
            <TabsTrigger value="upright">{t.upright}</TabsTrigger>
            <TabsTrigger value="reversed">{t.reversed}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Transparency Banner */}
      <div className="mb-8 flex items-start gap-3 rounded-sm border border-[rgba(212,180,117,0.22)] bg-[rgba(212,180,117,0.06)] px-4 py-3 text-xs text-[var(--arcana-stone)]">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--arcana-gold)]"
          aria-hidden="true"
        />
        <p>
          {locale === "vi"
            ? disclaimer
            : "Vietnamese interpretations are verified directly from the user's two imported PDF guides with page citations. English previews provide normalized bilingual equivalents for English mode."}
        </p>
      </div>

      {/* Filter Controls */}
      <Panel className="mb-10 p-5">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <label htmlFor="tarot-search" className="sr-only">
              {t.searchPlaceholder}
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--arcana-stone)]"
              aria-hidden="true"
            />
            <Input
              id="tarot-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:col-span-5">
            {(["all", "Major Arcana", "Minor Arcana"] as const).map((arc) => (
              <Button
                key={arc}
                type="button"
                size="sm"
                variant={arcanaFilter === arc ? "gold" : "outline"}
                onClick={() => {
                  setArcanaFilter(arc);
                  if (arc === "Major Arcana") setSuitFilter("all");
                }}
              >
                {arc === "all"
                  ? t.all
                  : arc === "Major Arcana"
                  ? t.major
                  : t.minor}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 lg:col-span-3">
            <span className="text-xs text-[var(--arcana-stone)]">
              {t.showing}{" "}
              <strong className="text-[var(--arcana-ink)]">
                {filteredCards.length}
              </strong>{" "}
              / 78
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetFilters}
              aria-label={t.reset}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {t.reset}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] uppercase tracking-widest text-[var(--arcana-stone)]">
              {t.suitLabel}
            </span>
            {SUIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={arcanaFilter === "Major Arcana" && opt.value !== "all"}
                onClick={() => {
                  setSuitFilter(opt.value);
                  if (opt.value !== "all") setArcanaFilter("Minor Arcana");
                }}
                className={`rounded-sm border px-2.5 py-1 text-xs transition-colors cursor-pointer disabled:opacity-35 ${
                  suitFilter === opt.value
                    ? "border-[var(--arcana-gold)] bg-[rgba(212,180,117,0.16)] text-[var(--arcana-gold-light)]"
                    : "border-white/10 text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)]"
                }`}
              >
                {opt.value === "all" ? t.allSuits : opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] uppercase tracking-widest text-[var(--arcana-stone)]">
              {t.topicLens}
            </span>
            <select
              aria-label={t.topicLens}
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value as TarotTopicId)}
              className="h-9 rounded-sm border border-[rgba(212,180,117,0.24)] bg-[#07080d] px-3 text-xs text-[var(--arcana-ink)] focus:border-[var(--arcana-gold)] focus:outline-none cursor-pointer"
            >
              {TOPIC_IDS.map((id) => (
                <option key={id} value={id}>
                  {getLocalizedTopicLabel(id, locale, id)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Panel>

      {/* Card Grid */}
      {filteredCards.length === 0 ? (
        <Panel className="p-12 text-center">
          <p className="font-editorial text-2xl text-[var(--arcana-ink)]">
            {t.emptyTitle}
          </p>
          <p className="mt-2 text-sm text-[var(--arcana-stone)]">
            {t.emptyDesc}
          </p>
          <Button variant="outline" className="mt-5" onClick={resetFilters}>
            {t.resetAll}
          </Button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCards.map((card) => {
            const loc = getCardLocalized(card, locale);
            return (
              <Link
                key={card.id}
                href={`/library/${card.slug}`}
                className="group surface-panel flex flex-col overflow-hidden rounded-md transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(212,180,117,0.45)]"
              >
                <div className="flex items-start gap-4 p-4">
                  <div className="w-24 shrink-0 self-start aspect-[7/12] overflow-hidden rounded-sm border border-[rgba(212,180,117,0.28)] bg-[#07080d]">
                    <img
                      src={withBasePath(card.image)}
                      alt={`${card.name} (${orientation})`}
                      loading="lazy"
                      className={`h-full w-full object-cover transition-transform duration-300 ${
                        orientation === "reversed" ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          tone={card.arcana === "Major Arcana" ? "gold" : "muted"}
                        >
                          {card.suit ?? "Major"}
                        </Badge>
                        <span className="text-[11px] text-[var(--arcana-stone)]">
                          #{card.number}
                        </span>
                      </div>
                      <h2 className="mt-2 font-editorial text-xl font-semibold leading-snug text-[var(--arcana-ink)] group-hover:text-[var(--arcana-gold-light)]">
                        {card.name}
                      </h2>
                      {locale === "vi" && card.titleVi && (
                        <p className="text-[11px] text-[var(--arcana-gold-light)]/90">
                          {card.titleVi}
                        </p>
                      )}
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[var(--arcana-stone)]">
                        {loc.topics[topicFilter][orientation]}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {loc.keywords[orientation].slice(0, 2).map((kw) => (
                        <span
                          key={kw}
                          className="rounded-sm bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-[var(--arcana-stone)]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
