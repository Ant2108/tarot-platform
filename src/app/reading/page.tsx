import type { Metadata } from "next";
import { ReadingExperienceClient } from "@/components/reading/ReadingExperienceClient";

export const metadata: Metadata = {
  title: "Three-Card 3D Tarot Reading — Vespera Tarot",
  description:
    "Draw, flip, and interpret a three-card Rider-Waite-Smith Tarot spread in 3D with topic-specific spreads and local reflection chat.",
};

export default function ReadingPage() {
  return <ReadingExperienceClient />;
}
