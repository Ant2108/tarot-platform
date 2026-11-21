import rawDeck from "@/data/tarot-cards.json";
import rawSources from "@/data/extracted-sources.json";
import type {
  TarotCard,
  ExtractedSourcesDataset,
  ExtractedSourceEntry,
} from "@/types/tarot";

export const TAROT_CARDS: TarotCard[] = rawDeck.cards as TarotCard[];
export const TAROT_DATA_DISCLAIMER: string = rawDeck.disclaimer;
export const EXTRACTED_SOURCES: ExtractedSourcesDataset =
  rawSources as ExtractedSourcesDataset;

export function getCardBySlug(slug: string): TarotCard | undefined {
  return TAROT_CARDS.find((card) => card.slug === slug);
}

export function getCardById(id: string): TarotCard | undefined {
  return TAROT_CARDS.find((card) => card.id === id);
}

export function getExtractedSourcesForCard(
  cardId: string
): ExtractedSourceEntry[] {
  return EXTRACTED_SOURCES.entries.filter((entry) => entry.cardId === cardId);
}

export function getFeaturedCards(): TarotCard[] {
  const featuredSlugs = [
    "the-fool",
    "the-high-priestess",
    "the-star",
    "the-moon",
    "the-sun",
    "the-world",
  ];
  return featuredSlugs
    .map((slug) => getCardBySlug(slug))
    .filter((card): card is TarotCard => Boolean(card));
}

export function getCardLocalized(
  card: TarotCard,
  locale: "vi" | "en"
) {
  if (locale === "en" && card.en) {
    return card.en;
  }
  return {
    keywords: card.keywords,
    general: card.general,
    topics: card.topics,
  };
}

export function shuffleDeckIndices(count: number): number[] {
  const arr = Array.from({ length: count }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
