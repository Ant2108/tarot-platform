"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Globe, HelpCircle, KeyRound, Menu, Settings2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UI_TEXT } from "@/lib/i18n";
import { cn, withBasePath } from "@/lib/utils";
import { useAISettingsStore } from "@/store/ai-settings-store";
import { useLocaleStore } from "@/store/locale-store";
import { useTutorialStore } from "@/store/tutorial-store";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, setLocale } = useLocaleStore();
  const { apiKey, openSettings } = useAISettingsStore();
  const { openTutorial } = useTutorialStore();
  const hasGeminiKey = Boolean(apiKey.trim());
  const t = UI_TEXT[locale].nav;

  const navItems = [
    { href: "/", label: t.home },
    { href: "/reading", label: t.reading, icon: Sparkles },
    { href: "/library", label: t.library, icon: BookOpen },
    {
      href: "/settings",
      label: locale === "vi" ? "Cài Đặt AI" : "AI Settings",
      icon: Settings2,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(212,180,117,0.14)] bg-[rgba(7,8,13,0.82)] backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 text-[var(--arcana-ink)]"
        >
          <img
            src={withBasePath("/vespera-logo.png")}
            alt="Vespera Tarot"
            className="h-9 w-9 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="whitespace-nowrap font-editorial text-lg font-semibold tracking-wider uppercase xl:text-xl">
            Vespera <span className="text-[var(--arcana-gold)]">Tarot</span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 items-center gap-4 lg:flex xl:gap-7"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.08em] transition-colors xl:text-xs xl:tracking-[0.15em]",
                isActive(item.href)
                  ? "text-[var(--arcana-gold-light)]"
                  : "text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)]"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
          {/* VI / EN Switcher */}
          <div
            role="group"
            aria-label="Language switcher"
            className="inline-flex items-center rounded-sm border border-[rgba(212,180,117,0.24)] bg-[rgba(7,8,13,0.7)] p-0.5 text-[11px]"
          >
            <Globe
              className="mx-1.5 h-3.5 w-3.5 text-[var(--arcana-gold)]"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => setLocale("vi")}
              className={cn(
                "rounded-sm px-2 py-1 font-medium uppercase tracking-wider transition-colors cursor-pointer",
                locale === "vi"
                  ? "bg-[rgba(212,180,117,0.2)] text-[var(--arcana-gold-light)]"
                  : "text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)]"
              )}
            >
              VI
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={cn(
                "rounded-sm px-2 py-1 font-medium uppercase tracking-wider transition-colors cursor-pointer",
                locale === "en"
                  ? "bg-[rgba(212,180,117,0.2)] text-[var(--arcana-gold-light)]"
                  : "text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)]"
              )}
            >
              EN
            </button>
          </div>

          <button
            type="button"
            onClick={openSettings}
            title={
              locale === "vi"
                ? "Cài đặt Gemini AI API Key"
                : "Gemini AI API Key Settings"
            }
            className={cn(
              "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer",
              hasGeminiKey
                ? "border-[rgba(212,180,117,0.45)] bg-[rgba(212,180,117,0.12)] text-[var(--arcana-gold-light)] hover:bg-[rgba(212,180,117,0.18)]"
                : "border-[rgba(212,180,117,0.22)] bg-[rgba(7,8,13,0.7)] text-[var(--arcana-stone)] hover:border-[rgba(212,180,117,0.4)] hover:text-[var(--arcana-ink)]"
            )}
          >
            <KeyRound className="h-3.5 w-3.5 text-[var(--arcana-gold)]" aria-hidden="true" />
            <span className="hidden xl:inline">Gemini AI</span>
            <span className="xl:hidden">AI</span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                hasGeminiKey ? "bg-emerald-400" : "bg-[var(--arcana-stone)]/50"
              )}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={openTutorial}
            title={locale === "vi" ? "Hướng dẫn sử dụng" : "User guide"}
            aria-label={locale === "vi" ? "Hướng dẫn sử dụng" : "User guide"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[rgba(212,180,117,0.22)] bg-[rgba(7,8,13,0.7)] text-[var(--arcana-stone)] transition-colors hover:border-[rgba(212,180,117,0.45)] hover:text-[var(--arcana-gold-light)] cursor-pointer"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </button>

          <Button asChild size="sm" variant="gold" className="hidden xl:inline-flex">
            <Link href="/reading">{t.cta}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={openSettings}
            aria-label="Gemini AI Settings"
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium cursor-pointer",
              hasGeminiKey
                ? "border-[rgba(212,180,117,0.45)] bg-[rgba(212,180,117,0.12)] text-[var(--arcana-gold-light)]"
                : "border-[rgba(212,180,117,0.24)] text-[var(--arcana-stone)]"
            )}
          >
            <KeyRound className="h-3.5 w-3.5 text-[var(--arcana-gold)]" aria-hidden="true" />
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                hasGeminiKey ? "bg-emerald-400" : "bg-[var(--arcana-stone)]/50"
              )}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
            aria-label="Switch language"
            className="flex h-10 items-center gap-1 rounded-sm border border-[rgba(212,180,117,0.24)] px-2.5 text-xs font-medium uppercase text-[var(--arcana-gold-light)] cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            {locale.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-[rgba(212,180,117,0.22)] text-[var(--arcana-ink)] cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[rgba(212,180,117,0.14)] bg-[var(--arcana-bg)] px-4 py-5 lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-sm px-3 py-2.5 text-sm uppercase tracking-[0.14em]",
                  isActive(item.href)
                    ? "bg-[rgba(212,180,117,0.12)] text-[var(--arcana-gold-light)]"
                    : "text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)]"
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openTutorial();
              }}
              className="flex items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm uppercase tracking-[0.14em] text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)] cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              {locale === "vi" ? "Hướng Dẫn Sử Dụng" : "User Guide"}
            </button>
            <Button
              asChild
              variant="gold"
              className="mt-2 w-full"
              onClick={() => setMobileOpen(false)}
            >
              <Link href="/reading">{t.cta}</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
