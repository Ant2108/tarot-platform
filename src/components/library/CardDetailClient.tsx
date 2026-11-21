"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  BookMarked,
  Box,
  FileWarning,
  Image as ImageIcon,
  Info,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UI_TEXT, getLocalizedTopicLabel } from "@/lib/i18n";
import { getCardLocalized } from "@/lib/tarot-data";
import { withBasePath } from "@/lib/utils";
import { useLocaleStore } from "@/store/locale-store";
import type {
  CardOrientation,
  ExtractedSourceEntry,
  TarotCard,
  TarotTopicId,
} from "@/types/tarot";

const CardInspectScene = dynamic(
  () =>
    import("@/components/three/CardInspectScene").then(
      (m) => m.CardInspectScene
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest text-[var(--arcana-stone)]">
        Loading 3D Blender Asset...
      </div>
    ),
  }
);

const TOPIC_IDS: TarotTopicId[] = [
  "love",
  "family",
  "career",
  "finance",
  "personalGrowth",
];

export function CardDetailClient({
  card,
  extractedSources,
}: {
  card: TarotCard;
  extractedSources: ExtractedSourceEntry[];
}) {
  const { locale } = useLocaleStore();
  const t = UI_TEXT[locale].library;
  const loc = getCardLocalized(card, locale);

  const [orientation, setOrientation] = useState<CardOrientation>("upright");
  const [inspect3D, setInspect3D] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t.backToLibrary}
        </Link>

        <Button asChild size="sm" variant="outline">
          <Link href="/reading">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t.drawReading}
          </Link>
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-4 lg:col-span-4">
          <Panel className="overflow-hidden p-4">
            <div className="relative aspect-[7/12] w-full overflow-hidden rounded-sm border border-[rgba(212,180,117,0.28)] bg-[#07080d]">
              {inspect3D ? (
                <CardInspectScene
                  glbPath={card.glb}
                  orientation={orientation}
                />
              ) : (
                <img
                  src={withBasePath(card.image)}
                  alt={`${card.name} (${orientation})`}
                  className={`h-full w-full object-cover transition-transform duration-500 ${
                    orientation === "reversed" ? "rotate-180" : ""
                  }`}
                />
              )}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                variant={inspect3D ? "gold" : "outline"}
                onClick={() => setInspect3D((v) => !v)}
                className="w-full"
              >
                {inspect3D ? (
                  <>
                    <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.return2D}
                  </>
                ) : (
                  <>
                    <Box className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.inspect3D}
                  </>
                )}
              </Button>
            </div>
          </Panel>

          <Panel className="p-5">
            <dl className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="uppercase tracking-widest text-[var(--arcana-stone)]">
                  {t.arcana}
                </dt>
                <dd className="mt-1 font-medium text-[var(--arcana-ink)]">
                  {card.arcana}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest text-[var(--arcana-stone)]">
                  {t.number}
                </dt>
                <dd className="mt-1 font-medium text-[var(--arcana-ink)]">
                  {card.number}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest text-[var(--arcana-stone)]">
                  {t.suit}
                </dt>
                <dd className="mt-1 font-medium text-[var(--arcana-ink)]">
                  {card.suit ?? "Major Archetype"}
                </dd>
              </div>
              <div>
                <dt className="uppercase tracking-widest text-[var(--arcana-stone)]">
                  {t.element}
                </dt>
                <dd className="mt-1 font-medium text-[var(--arcana-ink)]">
                  {card.element}
                </dd>
              </div>
              {card.astrology && (
                <div className="col-span-2 border-t border-white/10 pt-3">
                  <dt className="uppercase tracking-widest text-[var(--arcana-stone)]">
                    {t.astrology}
                  </dt>
                  <dd className="mt-1 font-medium text-[var(--arcana-gold-light)]">
                    {card.astrology}
                  </dd>
                </div>
              )}
            </dl>
          </Panel>
        </div>

        {/* Right Column */}
        <div className="space-y-8 lg:col-span-8">
          <div className="space-y-3 border-b border-[rgba(212,180,117,0.14)] pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">{card.arcana}</Badge>
              {card.suit && <Badge tone="violet">{card.suit}</Badge>}
              {card.dataStatus === "verified" ? (
                <Badge tone="gold">Verified PDF Source</Badge>
              ) : (
                <Badge tone="warning">Demonstration Data</Badge>
              )}
            </div>
            <h1 className="font-editorial text-4xl font-semibold sm:text-5xl">
              {card.name}
            </h1>
            {locale === "vi" && card.titleVi && (
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--arcana-gold-light)]">
                {card.titleVi}
              </p>
            )}
            <p className="text-sm leading-relaxed text-[var(--arcana-stone)]">
              {loc.general[orientation]}
            </p>
          </div>

          <Tabs
            value={orientation}
            onValueChange={(v) => setOrientation(v as CardOrientation)}
          >
            <TabsList>
              <TabsTrigger value="upright">{t.uprightTab}</TabsTrigger>
              <TabsTrigger value="reversed">{t.reversedTab}</TabsTrigger>
            </TabsList>

            {(["upright", "reversed"] as const).map((dir) => (
              <TabsContent key={dir} value={dir} className="space-y-6">
                <Panel className="p-6">
                  <h2 className="font-editorial text-2xl font-semibold text-[var(--arcana-gold-light)]">
                    {dir === "upright" ? t.uprightEssence : t.reversedEssence}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--arcana-ink)]/90 sm:text-base">
                    {loc.general[dir]}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {loc.keywords[dir].map((kw) => (
                      <Badge key={kw} tone="muted">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </Panel>

                <div className="grid gap-4 sm:grid-cols-2">
                  {TOPIC_IDS.map((topicId) => (
                    <Panel key={topicId} className="p-5">
                      <h3 className="font-editorial text-xl font-semibold text-[var(--arcana-gold-light)]">
                        {getLocalizedTopicLabel(topicId, locale, topicId)}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--arcana-stone)]">
                        {loc.topics[topicId][dir]}
                      </p>
                    </Panel>
                  ))}
                </div>

                {(card.pastPresentFuture || card.cardCombinations) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {card.pastPresentFuture && (
                      <Panel className="p-5">
                        <h3 className="font-editorial text-xl font-semibold text-[var(--arcana-gold-light)]">
                          {t.ppfTitle}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--arcana-stone)]">
                          {card.pastPresentFuture}
                        </p>
                      </Panel>
                    )}
                    {card.cardCombinations && (
                      <Panel className="p-5">
                        <h3 className="font-editorial text-xl font-semibold text-[var(--arcana-gold-light)]">
                          {t.combosTitle}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--arcana-stone)]">
                          {card.cardCombinations}
                        </p>
                      </Panel>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Original PDF Source & Page References */}
          <Panel className="p-6">
            <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
              <BookMarked className="h-4 w-4" aria-hidden="true" />
              <h2 className="font-editorial text-2xl font-semibold text-[var(--arcana-ink)]">
                {t.sourcesTitle}
              </h2>
            </div>

            {card.sourceReferences.length > 0 || extractedSources.length > 0 ? (
              <ul className="mt-4 space-y-3 text-sm text-[var(--arcana-stone)]">
                {card.sourceReferences.map((ref, idx) => (
                  <li
                    key={idx}
                    className="rounded-sm border border-white/10 bg-white/[0.02] p-3"
                  >
                    <p className="font-medium text-[var(--arcana-ink)]">
                      {ref.sourceTitle}
                    </p>
                    {ref.pageNumbers && (
                      <p className="text-xs text-[var(--arcana-gold)]">
                        {ref.pageNumbers}
                      </p>
                    )}
                  </li>
                ))}
                {extractedSources.map((entry, idx) => (
                  <li
                    key={`ext-${idx}`}
                    className="rounded-sm border border-white/10 bg-white/[0.02] p-3"
                  >
                    <p className="font-medium text-[var(--arcana-ink)]">
                      {entry.sourceTitle} ({entry.pageRange})
                    </p>
                    <p className="mt-1 text-xs leading-relaxed">
                      {entry.rawExcerpt}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 flex items-start gap-3 rounded-sm border border-amber-500/25 bg-amber-500/[0.06] p-4">
                <FileWarning
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
                  aria-hidden="true"
                />
                <p className="text-xs text-[var(--arcana-stone)]">
                  Verified PDF citation unavailable for this card.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--arcana-stone)]">
              <Info
                className="h-3.5 w-3.5 text-[var(--arcana-gold)]"
                aria-hidden="true"
              />
              <span>{t.sourceNote}</span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
