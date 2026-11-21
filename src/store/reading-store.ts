"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSpreadById, getTopicById } from "@/data/spreads";
import { TAROT_CARDS, shuffleDeckIndices } from "@/lib/tarot-data";
import type {
  AIProviderMode,
  GeminiDiagnosticInfo,
  GeminiErrorCode,
} from "@/services/geminiService";
import type {
  AIReadingResult,
  CardOrientation,
  ChatMessage,
  DrawnCard,
  ReadingRecord,
  TarotTopicId,
} from "@/types/tarot";

export type ReadingPhase =
  | "topic"
  | "spread"
  | "shuffle"
  | "select"
  | "reveal"
  | "result";

export type AIStatus = "idle" | "loading" | "success" | "error";

interface ReadingState {
  readingId: string;
  phase: ReadingPhase;
  topicId: TarotTopicId;
  spreadId: string;
  userQuestion: string;
  deckOrder: number[];
  shuffleCount: number;
  selectedDeckSlots: number[];
  drawnCards: DrawnCard[];

  // AI Consultation & Conversation Memory
  aiReading: AIReadingResult | null;
  aiReadingId: string | null;
  aiReadingLocale: "vi" | "en" | null;
  aiStatus: AIStatus;
  aiError: string | null;
  aiErrorCode: GeminiErrorCode | null;
  aiRetryable: boolean;
  aiDiagnostic: GeminiDiagnosticInfo | null;
  aiProvider: AIProviderMode;
  chatHistory: ChatMessage[];

  // Optional localStorage history
  readingHistory: ReadingRecord[];

  setTopic: (topicId: TarotTopicId) => void;
  setSpread: (spreadId: string) => void;
  setUserQuestion: (q: string) => void;
  setPhase: (phase: ReadingPhase) => void;
  shuffleDeck: () => void;
  selectCardFromSlot: (slotIndex: number) => void;
  revealCardAt: (positionIndex: number) => void;
  revealAllCards: () => void;
  setAIReadingLoading: () => void;
  resetAIStatusIfLoading: () => void;
  setAIReadingSuccess: (
    reading: AIReadingResult,
    readingId: string,
    locale: "vi" | "en",
    provider: AIProviderMode,
    diagnostic?: GeminiDiagnosticInfo | null
  ) => void;
  setAIReadingError: (
    error: string,
    options?: {
      code?: GeminiErrorCode | null;
      retryable?: boolean;
      diagnostic?: GeminiDiagnosticInfo | null;
    }
  ) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  saveCurrentReadingToHistory: () => void;
  clearHistory: () => void;
  resetReading: () => void;
}

const initialDeck = Array.from({ length: TAROT_CARDS.length }, (_, i) => i);

function createReadingId(): string {
  return `reading-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      readingId: createReadingId(),
      phase: "topic",
      topicId: "love",
      spreadId: "love-timeline",
      userQuestion: "",
      deckOrder: initialDeck,
      shuffleCount: 0,
      selectedDeckSlots: [],
      drawnCards: [],

      aiReading: null,
      aiReadingId: null,
      aiReadingLocale: null,
      aiStatus: "idle",
      aiError: null,
      aiErrorCode: null,
      aiRetryable: true,
      aiDiagnostic: null,
      aiProvider: "local-fallback",
      chatHistory: [],
      readingHistory: [],

      setTopic: (topicId) => {
        const topic = getTopicById(topicId);
        set({
          topicId,
          spreadId: topic.spreads[0].id,
        });
      },

      setSpread: (spreadId) => set({ spreadId }),

      setUserQuestion: (userQuestion) => set({ userQuestion }),

      setPhase: (phase) => set({ phase }),

      shuffleDeck: () => {
        set((state) => ({
          readingId: createReadingId(),
          deckOrder: shuffleDeckIndices(TAROT_CARDS.length),
          shuffleCount: state.shuffleCount + 1,
          selectedDeckSlots: [],
          drawnCards: [],
          aiReading: null,
          aiReadingId: null,
          aiReadingLocale: null,
          aiStatus: "idle",
          aiError: null,
          aiErrorCode: null,
          aiRetryable: true,
          aiDiagnostic: null,
          chatHistory: [],
        }));
      },

      selectCardFromSlot: (slotIndex) => {
        const state = get();
        if (state.drawnCards.length >= 3) return;
        if (state.selectedDeckSlots.includes(slotIndex)) return;

        const spread = getSpreadById(state.spreadId);
        const positionIndex = state.drawnCards.length;
        const cardIndex = state.deckOrder[slotIndex % state.deckOrder.length];
        const card = TAROT_CARDS[cardIndex];
        if (!card) return;

        const orientation: CardOrientation =
          Math.random() < 0.3 ? "reversed" : "upright";

        const nextDrawn: DrawnCard = {
          card,
          orientation,
          position: spread.positions[positionIndex],
          revealed: false,
        };

        const updatedDrawn = [...state.drawnCards, nextDrawn];
        const updatedSlots = [...state.selectedDeckSlots, slotIndex];
        const activeReadingId = state.readingId;

        // Keep phase in "select" while the 3rd card finishes its smooth lift-up animation
        set({
          selectedDeckSlots: updatedSlots,
          drawnCards: updatedDrawn,
          phase: "select",
        });

        if (updatedDrawn.length === 3) {
          setTimeout(() => {
            const latest = get();
            if (
              latest.readingId === activeReadingId &&
              latest.phase === "select" &&
              latest.drawnCards.length === 3
            ) {
              set({ phase: "reveal" });
            }
          }, 850);
        }
      },

      revealCardAt: (positionIndex) => {
        const state = get();
        const updated = state.drawnCards.map((d, idx) =>
          idx === positionIndex ? { ...d, revealed: true } : d
        );
        const allRevealed =
          updated.length === 3 && updated.every((d) => d.revealed);
        const activeReadingId = state.readingId;

        // Flip card immediately, then wait for the 3D flip animation to finish before entering "result"
        set({
          drawnCards: updated,
        });

        if (allRevealed) {
          setTimeout(() => {
            const latest = get();
            if (
              latest.readingId === activeReadingId &&
              latest.phase === "reveal" &&
              latest.drawnCards.length === 3 &&
              latest.drawnCards.every((d) => d.revealed)
            ) {
              set({ phase: "result" });
              latest.saveCurrentReadingToHistory();
            }
          }, 950);
        }
      },

      revealAllCards: () => {
        const state = get();
        if (state.drawnCards.length < 3) return;
        const alreadyAllRevealed = state.drawnCards.every((d) => d.revealed);
        if (alreadyAllRevealed) {
          set({ phase: "result" });
          get().saveCurrentReadingToHistory();
          return;
        }
        const updated = state.drawnCards.map((d) => ({ ...d, revealed: true }));
        const activeReadingId = state.readingId;

        set({
          drawnCards: updated,
        });

        setTimeout(() => {
          const latest = get();
          if (
            latest.readingId === activeReadingId &&
            latest.phase === "reveal" &&
            latest.drawnCards.length === 3
          ) {
            set({ phase: "result" });
            latest.saveCurrentReadingToHistory();
          }
        }, 950);
      },

      setAIReadingLoading: () =>
        set({
          aiStatus: "loading",
          aiError: null,
          aiErrorCode: null,
          aiRetryable: false,
        }),

      resetAIStatusIfLoading: () =>
        set((state) =>
          state.aiStatus === "loading" ? { aiStatus: "idle" } : state
        ),

      setAIReadingSuccess: (reading, readingId, locale, provider, diagnostic = null) =>
        set({
          aiReading: reading,
          aiReadingId: readingId,
          aiReadingLocale: locale,
          aiStatus: "success",
          aiError: null,
          aiErrorCode: null,
          aiRetryable: false,
          aiDiagnostic: diagnostic,
          aiProvider: provider,
        }),

      setAIReadingError: (error, options) =>
        set({
          aiStatus: "error",
          aiError: error,
          aiErrorCode: options?.code ?? null,
          aiRetryable: options?.retryable ?? true,
          aiDiagnostic: options?.diagnostic ?? null,
        }),

      addChatMessage: (message) =>
        set((state) => ({ chatHistory: [...state.chatHistory, message] })),

      clearChat: () => set({ chatHistory: [] }),

      saveCurrentReadingToHistory: () => {
        const state = get();
        if (state.drawnCards.length !== 3) return;
        const spread = getSpreadById(state.spreadId);
        const record: ReadingRecord = {
          id: state.readingId,
          createdAt: new Date().toISOString(),
          topicId: state.topicId,
          spreadId: state.spreadId,
          spreadName: spread.name,
          cards: state.drawnCards.map((d) => ({
            cardId: d.card.id,
            cardName: d.card.name,
            slug: d.card.slug,
            orientation: d.orientation,
            positionLabel: d.position.label,
          })),
        };
        const deduped = state.readingHistory.filter((r) => r.id !== record.id);
        set({
          readingHistory: [record, ...deduped].slice(0, 12),
        });
      },

      clearHistory: () => set({ readingHistory: [] }),

      resetReading: () =>
        set({
          readingId: createReadingId(),
          phase: "topic",
          selectedDeckSlots: [],
          drawnCards: [],
          aiReading: null,
          aiReadingId: null,
          aiReadingLocale: null,
          aiStatus: "idle",
          aiError: null,
          aiErrorCode: null,
          aiRetryable: true,
          aiDiagnostic: null,
          chatHistory: [],
          deckOrder: shuffleDeckIndices(TAROT_CARDS.length),
        }),
    }),
    {
      name: "arcana-tarot-reading-history",
      partialize: (state) => ({
        readingHistory: state.readingHistory,
      }),
    }
  )
);
