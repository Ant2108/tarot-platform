"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "vi" | "en";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: "vi",
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set({ locale: get().locale === "vi" ? "en" : "vi" }),
    }),
    {
      name: "vespera-tarot-locale",
    }
  )
);
