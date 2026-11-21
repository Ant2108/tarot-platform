import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardDetailClient } from "@/components/library/CardDetailClient";
import {
  TAROT_CARDS,
  getCardBySlug,
  getExtractedSourcesForCard,
} from "@/lib/tarot-data";

export function generateStaticParams() {
  return TAROT_CARDS.map((card) => ({
    slug: card.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) {
    return { title: "Card Not Found — Vespera Tarot" };
  }
  return {
    title: `${card.name} — 78-Card Tarot Library | Vespera Tarot`,
    description: card.general.upright,
  };
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) notFound();

  const extractedSources = getExtractedSourcesForCard(card.id);
  return <CardDetailClient card={card} extractedSources={extractedSources} />;
}
