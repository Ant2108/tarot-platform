import type { Metadata } from "next";
import { AIConfigurationClient } from "@/components/ai/AIConfigurationClient";

export const metadata: Metadata = {
  title: "AI Configuration (BYOK) — Vespera Tarot",
  description:
    "Configure your personal Google Gemini API Key and preferred model directly in your browser.",
};

export default function SettingsPage() {
  return <AIConfigurationClient />;
}
