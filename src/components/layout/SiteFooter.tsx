"use client";

import { Compass } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-[rgba(212,180,117,0.16)] bg-[rgba(7,8,13,0.94)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-7 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-[var(--arcana-ink)]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(212,180,117,0.35)] bg-[rgba(212,180,117,0.08)] text-[var(--arcana-gold)]">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="font-editorial text-sm font-semibold uppercase tracking-[0.22em]">
            Vespera <span className="text-[var(--arcana-gold)]">Tarot</span>
          </span>
        </div>

        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--arcana-stone)]">
          © 2026 Copyright by{" "}
          <span className="font-medium text-[var(--arcana-gold-light)]">
            Ant
          </span>
          . All rights reserved.
        </p>
      </div>
    </footer>
  );
}
