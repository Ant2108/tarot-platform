import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-sm border border-[rgba(212,180,117,0.22)] bg-[rgba(7,8,13,0.75)] px-3.5 text-sm text-[var(--arcana-ink)] placeholder:text-[var(--arcana-stone)]/70 transition-colors focus:border-[var(--arcana-gold)] focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
