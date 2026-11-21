"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { UI_TEXT } from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale-store";

export function SiteFooter() {
  const { locale } = useLocaleStore();
  const t = UI_TEXT[locale].footer;

  return (
    <footer className="border-t border-[rgba(212,180,117,0.14)] bg-[rgba(7,8,13,0.92)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Compass
                className="h-4 w-4 text-[var(--arcana-gold)]"
                aria-hidden="true"
              />
              <span className="font-editorial text-lg font-semibold uppercase tracking-wider">
                Vespera Tarot
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-[var(--arcana-stone)]">
              {t.tagline}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--arcana-gold)]">
              {t.explore}
            </h3>
            <ul className="space-y-2 text-sm text-[var(--arcana-stone)]">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-[var(--arcana-ink)]"
                >
                  {t.sanctuary}
                </Link>
              </li>
              <li>
                <Link
                  href="/reading"
                  className="transition-colors hover:text-[var(--arcana-ink)]"
                >
                  {t.reading}
                </Link>
              </li>
              <li>
                <Link
                  href="/library"
                  className="transition-colors hover:text-[var(--arcana-ink)]"
                >
                  {t.library}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--arcana-gold)]">
              {t.attributionTitle}
            </h3>
            <p className="text-xs leading-relaxed text-[var(--arcana-stone)]">
              {t.attributionBody}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[var(--arcana-stone)] sm:flex-row sm:items-center">
          <p>{t.bottomLeft}</p>
          <p>{t.bottomRight}</p>
        </div>
      </div>
    </footer>
  );
}
