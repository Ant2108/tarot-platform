import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TagTone = "gold" | "muted" | "violet" | "warning";

const TONE_MAP: Record<TagTone, string> = {
  gold: "border-[rgba(212,180,117,0.4)] bg-[rgba(212,180,117,0.12)] text-[var(--arcana-gold-light)]",
  muted: "border-white/10 bg-white/[0.04] text-[var(--arcana-stone)]",
  violet: "border-[rgba(110,92,142,0.45)] bg-[rgba(110,92,142,0.18)] text-[#d4c9ea]",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-200",
};

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wider uppercase",
        TONE_MAP[tone],
        className
      )}
      {...props}
    />
  );
}
