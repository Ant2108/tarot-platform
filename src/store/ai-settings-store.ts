"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AIProviderId = "google-gemini";
export type ConnectionStatus = "unconfigured" | "connected" | "error";

export interface GeminiModelOption {
  id: string;
  displayName: string;
  description: string;
}

export function maskApiKey(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 10) return "••••••••••";
  return `${trimmed.slice(0, 4)}••••••••••••${trimmed.slice(-4)}`;
}

interface AISettingsState {
  provider: AIProviderId;
  apiKey: string;
  model: string;
  availableModels: GeminiModelOption[];
  connectionStatus: ConnectionStatus;
  lastTestedAt: string | null;
  lastError: string | null;
  isSettingsOpen: boolean;

  setProvider: (provider: AIProviderId) => void;
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setAvailableModels: (models: GeminiModelOption[]) => void;
  setConnectionResult: (params: {
    status: ConnectionStatus;
    error?: string | null;
    models?: GeminiModelOption[];
    testedAt?: string;
  }) => void;
  clearApiKey: () => void;
  openSettings: () => void;
  closeSettings: () => void;
}

function sanitizeStoredModel(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (
    trimmed === "gemini-2.5-pro" ||
    trimmed === "gemini-2.5-flash" ||
    trimmed === "gemini-2.0-flash"
  ) {
    return "";
  }
  return trimmed;
}

export const useAISettingsStore = create<AISettingsState>()(
  persist(
    (set) => ({
      provider: "google-gemini",
      apiKey: "",
      model: "",
      availableModels: [],
      connectionStatus: "unconfigured",
      lastTestedAt: null,
      lastError: null,
      isSettingsOpen: false,

      setProvider: (provider) => set({ provider }),

      setApiKey: (key) => {
        const clean = key.trim();
        set({
          apiKey: clean,
          connectionStatus: clean ? "unconfigured" : "unconfigured",
          lastError: null,
        });
      },

      setModel: (model) => set({ model: model.trim() }),

      setAvailableModels: (availableModels) => set({ availableModels }),

      setConnectionResult: ({ status, error = null, models, testedAt }) =>
        set((state) => ({
          connectionStatus: status,
          lastError: error,
          availableModels: models ?? state.availableModels,
          lastTestedAt: testedAt ?? new Date().toISOString(),
        })),

      clearApiKey: () =>
        set({
          apiKey: "",
          availableModels: [],
          connectionStatus: "unconfigured",
          lastTestedAt: null,
          lastError: null,
        }),

      openSettings: () => set({ isSettingsOpen: true }),
      closeSettings: () => set({ isSettingsOpen: false }),
    }),
    {
      name: "vespera-gemini-settings-v1",
      version: 5,
      migrate: (persistedState: unknown) => {
        const state = (persistedState ?? {}) as Partial<AISettingsState>;
        const cleanKey =
          typeof state.apiKey === "string" ? state.apiKey.trim() : "";
        return {
          provider: "google-gemini" as AIProviderId,
          apiKey: cleanKey,
          model: sanitizeStoredModel(state.model),
          availableModels: Array.isArray(state.availableModels)
            ? state.availableModels
            : [],
          connectionStatus: cleanKey
            ? state.connectionStatus ?? "unconfigured"
            : "unconfigured",
          lastTestedAt:
            typeof state.lastTestedAt === "string" ? state.lastTestedAt : null,
          lastError:
            typeof state.lastError === "string" ? state.lastError : null,
        };
      },
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        model: state.model,
        availableModels: state.availableModels,
        connectionStatus: state.connectionStatus,
        lastTestedAt: state.lastTestedAt,
        lastError: state.lastError,
      }),
    }
  )
);
