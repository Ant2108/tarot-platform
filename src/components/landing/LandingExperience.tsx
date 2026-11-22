"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Eye,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/card";
import { UI_TEXT } from "@/lib/i18n";
import { withBasePath } from "@/lib/utils";
import { useLocaleStore } from "@/store/locale-store";
import type { TarotCard } from "@/types/tarot";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HeroTarotScene = dynamic(
  () =>
    import("@/components/three/HeroTarotScene").then((m) => m.HeroTarotScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="h-44 w-28 animate-pulse rounded-md border border-[rgba(212,180,117,0.25)] bg-white/[0.03]" />
      </div>
    ),
  }
);

const STEP_ICONS = [Compass, Layers, Eye];

export function LandingExperience({
  featuredCards,
}: {
  featuredCards: TarotCard[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocaleStore();
  const t = UI_TEXT[locale].landing;

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-stagger", {
          y: 26,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "transform",
        });

        gsap.utils.toArray<HTMLElement>(".reveal-section").forEach((section) => {
          gsap.from(section, {
            y: 22,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
            immediateRender: false,
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: section,
              start: "top 94%",
              once: true,
            },
          });
        });

        gsap.from(".featured-card-item", {
          y: 18,
          opacity: 0,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
          immediateRender: false,
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: ".featured-grid",
            start: "top 95%",
            once: true,
          },
        });

        const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 350);
        return () => clearTimeout(refreshTimer);
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[rgba(212,180,117,0.12)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12 lg:px-8">
          <div className="space-y-6 lg:col-span-6">
            <div className="hero-stagger">
              <Badge tone="gold">{t.badge}</Badge>
            </div>
            <h1 className="hero-stagger font-editorial text-[clamp(1.45rem,5.7vw,2.85rem)] sm:text-[clamp(2.2rem,5vw,3.15rem)] lg:text-[clamp(2.25rem,3.1vw,3.35rem)] font-semibold leading-[1.12] tracking-tight text-[var(--arcana-ink)]">
              <span className="block whitespace-nowrap">{t.heroTitle1}</span>
              <span className="block whitespace-nowrap text-[var(--arcana-gold)]">
                {t.heroTitle2}
              </span>
            </h1>
            <p className="hero-stagger max-w-xl text-sm leading-relaxed text-[var(--arcana-stone)] sm:text-base">
              {t.heroDesc}
            </p>
            <div className="hero-stagger flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" variant="gold">
                <Link href="/reading">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  {t.startReading}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/library">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  {t.exploreLibrary}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative h-[340px] sm:h-[430px] lg:col-span-6 lg:h-[480px]">
            <HeroTarotScene />
          </div>
        </div>
      </section>

      {/* Introduction to Tarot */}
      <section className="reveal-section mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="space-y-4 lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--arcana-gold)]">
              {t.sec1Label}
            </p>
            <h2 className="font-editorial text-3xl font-semibold leading-tight sm:text-4xl">
              {t.sec1Title}
            </h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-[var(--arcana-stone)] lg:col-span-7 sm:text-base">
            <p>{t.sec1P1}</p>
            <p>{t.sec1P2}</p>
          </div>
        </div>
      </section>

      {/* How Tarot Reading Works */}
      <section className="reveal-section border-y border-[rgba(212,180,117,0.12)] bg-[rgba(12,16,29,0.55)]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-12 max-w-2xl space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--arcana-gold)]">
              {t.sec2Label}
            </p>
            <h2 className="font-editorial text-3xl font-semibold sm:text-4xl">
              {t.sec2Title}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {t.steps.map((item, idx) => {
              const Icon = STEP_ICONS[idx] ?? Compass;
              return (
                <Panel
                  key={item.step}
                  className="p-6 transition-colors hover:border-[rgba(212,180,117,0.36)]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-editorial text-2xl text-[var(--arcana-gold)]">
                      {item.step}
                    </span>
                    <Icon
                      className="h-5 w-5 text-[var(--arcana-gold)]/80"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="font-editorial text-2xl font-semibold text-[var(--arcana-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--arcana-stone)]">
                    {item.description}
                  </p>
                </Panel>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Tarot Cards */}
      <section className="reveal-section mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--arcana-gold)]">
              {t.sec3Label}
            </p>
            <h2 className="font-editorial text-3xl font-semibold sm:text-4xl">
              {t.sec3Title}
            </h2>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--arcana-gold-light)] hover:text-[var(--arcana-gold)]"
          >
            {t.viewAll}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="featured-grid grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {featuredCards.map((card) => (
            <Link
              key={card.id}
              href={`/library/${card.slug}`}
              className="featured-card-item group surface-panel flex flex-col overflow-hidden rounded-md p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(212,180,117,0.45)]"
            >
              <div className="aspect-[7/12] overflow-hidden rounded-sm bg-[#07080d]">
                <img
                  src={withBasePath(card.image)}
                  alt={card.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="pt-3 pb-1 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--arcana-stone)]">
                  {card.arcana === "Major Arcana"
                    ? `Arcana ${card.number}`
                    : card.suit}
                </p>
                <h3 className="mt-0.5 font-editorial text-base font-semibold text-[var(--arcana-ink)] group-hover:text-[var(--arcana-gold-light)]">
                  {card.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore Tarot Library CTA */}
      <section className="reveal-section mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Panel className="relative overflow-hidden p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <Badge tone="violet">{t.ctaBadge}</Badge>
              <h2 className="font-editorial text-3xl font-semibold sm:text-4xl">
                {t.ctaTitle}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--arcana-stone)] sm:text-base">
                {t.ctaDesc}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              <Button asChild size="lg" variant="gold">
                <Link href="/library">{t.openLibrary}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/reading">{t.drawThree}</Link>
              </Button>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
