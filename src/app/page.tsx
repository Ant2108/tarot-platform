import { LandingExperience } from "@/components/landing/LandingExperience";
import { getFeaturedCards } from "@/lib/tarot-data";

export default function HomePage() {
  const featuredCards = getFeaturedCards();
  return <LandingExperience featuredCards={featuredCards} />;
}
