export type ArcanaType = "Major Arcana" | "Minor Arcana";

export type SuitType = "Wands" | "Cups" | "Swords" | "Pentacles" | null;

export type CardOrientation = "upright" | "reversed";

export type CardTopicKey =
  | "general"
  | "love"
  | "family"
  | "career"
  | "finance"
  | "personalGrowth";

export type TarotTopicId =
  | CardTopicKey
  | "customQuestion"
  | "energyCheck"
  | "study"
  | "health";

export interface OrientationText {
  upright: string;
  reversed: string;
}

export interface SourceReference {
  sourceTitle: string;
  author?: string;
  pdfFile?: string;
  pageNumbers?: string;
  verified: boolean;
}

export interface TarotCard {
  id: string;
  index: number;
  slug: string;
  name: string;
  titleVi?: string;
  astrology?: string;
  pastPresentFuture?: string;
  cardCombinations?: string;
  arcana: ArcanaType;
  suit: SuitType;
  number: string;
  element: "Fire" | "Water" | "Air" | "Earth" | "Spirit";
  image: string;
  glb: string;
  keywords: {
    upright: string[];
    reversed: string[];
  };
  general: OrientationText;
  topics: Record<CardTopicKey, OrientationText>;
  en?: {
    keywords: {
      upright: string[];
      reversed: string[];
    };
    general: OrientationText;
    topics: Record<CardTopicKey, OrientationText>;
  };
  /**
   * Explicitly distinguishes demonstration data from verified book/PDF extractions.
   */
  dataStatus: "demonstration" | "verified";
  sourceReferences: SourceReference[];
}

export interface ExtractedSourceEntry {
  cardId: string;
  sourceTitle: string;
  pdfFile: string;
  pageRange: string;
  rawExcerpt: string;
  extractedAt: string;
}

export interface ExtractedSourcesDataset {
  schemaVersion: string;
  status: "unpopulated" | "populated";
  notes: string;
  entries: ExtractedSourceEntry[];
}

export interface SpreadPosition {
  index: number;
  label: string;
  subtitle: string;
  promptHint: string;
}

export interface SpreadConfig {
  id: string;
  topicId: TarotTopicId;
  name: string;
  description: string;
  positions: [SpreadPosition, SpreadPosition, SpreadPosition];
}

export interface TopicMeta {
  id: TarotTopicId;
  label: string;
  shortLabel: string;
  description: string;
  spreads: SpreadConfig[];
}

export interface DrawnCard {
  card: TarotCard;
  orientation: CardOrientation;
  position: SpreadPosition;
  revealed: boolean;
}

export interface ReadingRecord {
  id: string;
  createdAt: string;
  topicId: TarotTopicId;
  spreadId: string;
  spreadName: string;
  cards: {
    cardId: string;
    cardName: string;
    slug: string;
    orientation: CardOrientation;
    positionLabel: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AICardInterpretation {
  cardId: string;
  cardName: string;
  positionLabel: string;
  orientation: CardOrientation;
  symbolismHighlight: string;
  interpretation: string;
}

export interface AIAdviceAndReflection {
  payAttentionTo: string;
  possiblyOverlooking: string;
  possibleActions: string[];
  reflectionQuestion: string;
}

export interface AIReadingResult {
  overallEnergy: string;
  cardInterpretations: AICardInterpretation[];
  cardConnections: string;
  deepInterpretation: string;
  adviceAndReflection: AIAdviceAndReflection;
  closingMessage: string;
  suggestedFollowUps: string[];
}

export interface GroundedCardPayload {
  cardId: string;
  name: string;
  titleVi?: string;
  orientation: CardOrientation;
  positionIndex: number;
  positionLabel: string;
  positionSubtitle: string;
  arcana: ArcanaType;
  suit: SuitType;
  element: string;
  astrology?: string;
  keywords: string[];
  generalMeaning: string;
  topicMeaning: string;
  growthMeaning: string;
  symbolismHint: string;
}

export interface TarotChatContext {
  readingId: string;
  topic: TopicMeta;
  spread: SpreadConfig;
  drawnCards: DrawnCard[];
  userQuestion?: string;
  initialReading?: AIReadingResult | null;
  locale: "vi" | "en";
}

/**
 * Clean abstraction for Tarot conversational reflection.
 * Implementations can swap the local mock service for a future AI provider
 * without changing any UI component.
 */
export interface TarotChatService {
  readonly providerName: string;
  readonly isMock: boolean;
  getSuggestedQuestions(context: TarotChatContext): string[];
  sendMessage(
    context: TarotChatContext,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string>;
}
