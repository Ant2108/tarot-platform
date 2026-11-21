"use client";

import { create } from "zustand";

const FOREVER_KEY = "vespera-tutorial-dismissed-forever-v1";
const SESSION_KEY = "vespera-tutorial-skipped-session-v1";

interface TutorialState {
  isOpen: boolean;
  initialized: boolean;
  initTutorial: () => void;
  openTutorial: () => void;
  skipOnce: () => void;
  dismissForever: () => void;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  isOpen: false,
  initialized: false,

  initTutorial: () => {
    if (typeof window === "undefined") return;
    const dismissedForever = localStorage.getItem(FOREVER_KEY) === "1";
    const skippedSession = sessionStorage.getItem(SESSION_KEY) === "1";
    set({
      initialized: true,
      isOpen: !dismissedForever && !skippedSession,
    });
  },

  openTutorial: () => set({ isOpen: true }),

  skipOnce: () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    set({ isOpen: false });
  },

  dismissForever: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(FOREVER_KEY, "1");
      sessionStorage.setItem(SESSION_KEY, "1");
    }
    set({ isOpen: false });
  },
}));
