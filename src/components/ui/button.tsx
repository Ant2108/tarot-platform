import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "gold" | "outline" | "ghost" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  gold: "bg-[var(--arcana-gold)] text-[#07080d] hover:bg-[var(--arcana-gold-light)] shadow-[0_0_24px_rgba(212,180,117,0.18)]",
  outline:
    "border border-[rgba(212,180,117,0.34)] bg-transparent text-[var(--arcana-ink)] hover:border-[var(--arcana-gold)] hover:bg-[rgba(212,180,117,0.08)]",
  ghost:
    "bg-transparent text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)] hover:bg-white/5",
  subtle:
    "bg-white/[0.06] text-[var(--arcana-ink)] border border-white/10 hover:bg-white/10",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-sm uppercase tracking-[0.14em]",
  icon: "h-10 w-10",
};

export function Button({
  className,
  variant = "gold",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const Element = asChild ? Slot : "button";
  return (
    <Element
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium tracking-wide transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-45",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...props}
    />
  );
}
