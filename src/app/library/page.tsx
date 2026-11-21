import type { Metadata } from "next";
import { TarotLibraryClient } from "@/components/library/TarotLibraryClient";
import { TAROT_CARDS, TAROT_DATA_DISCLAIMER } from "@/lib/tarot-data";

export const metadata: Metadata = {
  title: "78-Card Tarot Library — Vespera Tarot",
  description:
    "Search and study all 78 Rider-Waite-Smith Tarot cards across Major and Minor Arcana with upright, reversed, and topic meanings.",
};

export default function LibraryPage() {
  return (
    <TarotLibraryClient
      cards={TAROT_CARDS}
      disclaimer={TAROT_DATA_DISCLAIMER}
    />
  );
}
