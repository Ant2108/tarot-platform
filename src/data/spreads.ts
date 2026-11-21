import type { TopicMeta, TarotTopicId, SpreadConfig } from "@/types/tarot";

export const TAROT_TOPICS: TopicMeta[] = [
  {
    id: "love",
    label: "Love & Relationships",
    shortLabel: "Love",
    description:
      "Illuminate emotional currents, relational patterns, and unspoken dynamics between hearts.",
    spreads: [
      {
        id: "love-timeline",
        topicId: "love",
        name: "Arc of Connection",
        description:
          "Trace how past emotional imprints shape the present bond and where the relationship is unfolding.",
        positions: [
          {
            index: 0,
            label: "Past",
            subtitle: "Emotional Foundation",
            promptHint: "What shaped the current relational landscape.",
          },
          {
            index: 1,
            label: "Present",
            subtitle: "Living Dynamic",
            promptHint: "The energy currently active between you.",
          },
          {
            index: 2,
            label: "Future",
            subtitle: "Emerging Trajectory",
            promptHint: "Where this path naturally leads if unchanged.",
          },
        ],
      },
      {
        id: "love-mirror",
        topicId: "love",
        name: "Mirror of Two Hearts",
        description:
          "Examine your inner stance, the other person's energy, and the bridge uniting you.",
        positions: [
          {
            index: 0,
            label: "Your Energy",
            subtitle: "What You Bring",
            promptHint: "Your desires, boundaries, and emotional posture.",
          },
          {
            index: 1,
            label: "Their Energy",
            subtitle: "The Counterpart",
            promptHint: "How the other party or situation responds.",
          },
          {
            index: 2,
            label: "Shared Path",
            subtitle: "Relational Guidance",
            promptHint: "What nurtures harmony and clarity.",
          },
        ],
      },
    ],
  },
  {
    id: "career",
    label: "Career & Vocation",
    shortLabel: "Career",
    description:
      "Clarify strategic direction, professional friction, and latent opportunities in your work.",
    spreads: [
      {
        id: "career-compass",
        topicId: "career",
        name: "Vocational Compass",
        description:
          "Assess your current standing, the primary obstacle, and the most fertile opening ahead.",
        positions: [
          {
            index: 0,
            label: "Current Situation",
            subtitle: "Present Standing",
            promptHint: "Where your work and momentum stand today.",
          },
          {
            index: 1,
            label: "Challenges",
            subtitle: "Point of Friction",
            promptHint: "What requires discipline, tact, or restructuring.",
          },
          {
            index: 2,
            label: "Opportunities",
            subtitle: "Opening Horizon",
            promptHint: "Untapped leverage and growth potential.",
          },
        ],
      },
      {
        id: "career-craft",
        topicId: "career",
        name: "Mastery & Next Move",
        description:
          "Align your core strength with the action most likely to elevate your craft.",
        positions: [
          {
            index: 0,
            label: "Core Strength",
            subtitle: "Your Asset",
            promptHint: "The skill or posture working in your favor.",
          },
          {
            index: 1,
            label: "Blind Spot",
            subtitle: "Hidden Factor",
            promptHint: "An overlooked dynamic in the workplace.",
          },
          {
            index: 2,
            label: "Recommended Action",
            subtitle: "Strategic Step",
            promptHint: "The clearest next move to pursue.",
          },
        ],
      },
    ],
  },
  {
    id: "family",
    label: "Family & Home",
    shortLabel: "Family",
    description:
      "Navigate household harmony, ancestral patterns, and grounded guidance for loved ones.",
    spreads: [
      {
        id: "family-roots",
        topicId: "family",
        name: "Hearth & Roots",
        description:
          "Uncover the surface tension, its deeper origin, and a compassionate path toward equilibrium.",
        positions: [
          {
            index: 0,
            label: "Current Problem",
            subtitle: "Surface Tension",
            promptHint: "The immediate household or family dynamic.",
          },
          {
            index: 1,
            label: "Root Cause",
            subtitle: "Underlying Origin",
            promptHint: "The unspoken history or need beneath the surface.",
          },
          {
            index: 2,
            label: "Guidance",
            subtitle: "Path to Harmony",
            promptHint: "How to restore warmth, boundaries, and understanding.",
          },
        ],
      },
      {
        id: "family-sanctuary",
        topicId: "family",
        name: "Sanctuary Balance",
        description:
          "Reflect on what sustains the home, what needs healing, and what brings collective peace.",
        positions: [
          {
            index: 0,
            label: "Shared Strength",
            subtitle: "What Unites",
            promptHint: "The bond anchoring the family.",
          },
          {
            index: 1,
            label: "Needs Care",
            subtitle: "Tender Area",
            promptHint: "Where patience and listening are needed.",
          },
          {
            index: 2,
            label: "Next Season",
            subtitle: "Household Outlook",
            promptHint: "How the atmosphere shifts with care.",
          },
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance & Abundance",
    shortLabel: "Finance",
    description:
      "Inspect material stability, resource habits, and sustainable paths to prosperity.",
    spreads: [
      {
        id: "finance-flow",
        topicId: "finance",
        name: "Ledger of Flow",
        description:
          "Evaluate your current financial footing, hidden leaks or blocks, and practical counsel.",
        positions: [
          {
            index: 0,
            label: "Current Resources",
            subtitle: "Material Footing",
            promptHint: "Your present relationship with security and income.",
          },
          {
            index: 1,
            label: "Financial Block",
            subtitle: "Hidden Drain",
            promptHint: "Habits, fears, or external constraints to address.",
          },
          {
            index: 2,
            label: "Prosperity Path",
            subtitle: "Prudent Strategy",
            promptHint: "Where disciplined stewardship yields growth.",
          },
        ],
      },
      {
        id: "finance-harvest",
        topicId: "finance",
        name: "Seed & Harvest",
        description:
          "Distinguish short-term decisions from long-term wealth building.",
        positions: [
          {
            index: 0,
            label: "What to Protect",
            subtitle: "Preservation",
            promptHint: "Assets and stability to guard carefully.",
          },
          {
            index: 1,
            label: "Where to Invest",
            subtitle: "Cultivation",
            promptHint: "Effort or capital that compounds over time.",
          },
          {
            index: 2,
            label: "Long-Term Yield",
            subtitle: "Future Harvest",
            promptHint: "The material outcome of steady choices.",
          },
        ],
      },
    ],
  },
  {
    id: "personalGrowth",
    label: "Personal Growth",
    shortLabel: "Growth",
    description:
      "Turn inward to examine shadow patterns, creative awakening, and authentic evolution.",
    spreads: [
      {
        id: "growth-alchemy",
        topicId: "personalGrowth",
        name: "Inner Alchemy",
        description:
          "Surface what is asking to be outgrown, the catalyst for change, and your emerging self.",
        positions: [
          {
            index: 0,
            label: "Inner Shadow",
            subtitle: "Pattern to Witness",
            promptHint: "An unconscious belief or habit seeking awareness.",
          },
          {
            index: 1,
            label: "Catalyst",
            subtitle: "Turning Point",
            promptHint: "The insight or practice sparking transformation.",
          },
          {
            index: 2,
            label: "Integration",
            subtitle: "Higher Alignment",
            promptHint: "Who you are becoming as you integrate this lesson.",
          },
        ],
      },
      {
        id: "growth-clarity",
        topicId: "personalGrowth",
        name: "Mind, Heart & Action",
        description:
          "Harmonize thought, emotion, and embodied daily practice.",
        positions: [
          {
            index: 0,
            label: "Mind",
            subtitle: "Perspective",
            promptHint: "How your thoughts frame the present moment.",
          },
          {
            index: 1,
            label: "Heart",
            subtitle: "Truth",
            promptHint: "What your intuition quietly knows.",
          },
          {
            index: 2,
            label: "Embodied Step",
            subtitle: "Practice",
            promptHint: "A grounded action that honors both.",
          },
        ],
      },
    ],
  },
  {
    id: "general",
    label: "General Reading",
    shortLabel: "General",
    description:
      "A holistic celestial overview of your current chapter, energies, and guiding themes.",
    spreads: [
      {
        id: "general-triad",
        topicId: "general",
        name: "Celestial Triad",
        description:
          "The timeless three-card arc illuminating where you have been, where you stand, and what approaches.",
        positions: [
          {
            index: 0,
            label: "Threshold Past",
            subtitle: "Recent Influence",
            promptHint: "Energies receding yet still echoing.",
          },
          {
            index: 1,
            label: "Present Center",
            subtitle: "Focal Point",
            promptHint: "The core theme asking for your attention now.",
          },
          {
            index: 2,
            label: "Approaching Horizon",
            subtitle: "Unfolding Guidance",
            promptHint: "The theme gathering momentum ahead.",
          },
        ],
      },
      {
        id: "general-synthesis",
        topicId: "general",
        name: "Situation, Obstacle & Counsel",
        description:
          "A direct, practical diagnostic spread for any open question.",
        positions: [
          {
            index: 0,
            label: "Situation",
            subtitle: "Core Context",
            promptHint: "The essential reality of your inquiry.",
          },
          {
            index: 1,
            label: "Challenge",
            subtitle: "What Crosses You",
            promptHint: "The tension or test within the moment.",
          },
          {
            index: 2,
            label: "Counsel",
            subtitle: "Wise Orientation",
            promptHint: "The most constructive stance to adopt.",
          },
        ],
      },
    ],
  },
];

export function getTopicById(topicId: TarotTopicId): TopicMeta {
  return TAROT_TOPICS.find((t) => t.id === topicId) ?? TAROT_TOPICS[5];
}

export function getSpreadById(spreadId: string): SpreadConfig {
  for (const topic of TAROT_TOPICS) {
    const found = topic.spreads.find((s) => s.id === spreadId);
    if (found) return found;
  }
  return TAROT_TOPICS[5].spreads[0];
}
