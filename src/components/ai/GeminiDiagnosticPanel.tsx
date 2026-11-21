"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Terminal } from "lucide-react";
import type { GeminiDiagnosticInfo } from "@/services/geminiService";

interface GeminiDiagnosticPanelProps {
  diagnostic: GeminiDiagnosticInfo | null | undefined;
}

/**
 * Development-only diagnostic readout for inspecting real Gemini API responses.
 * Never renders in production builds and never displays API keys.
 */
export function GeminiDiagnosticPanel({
  diagnostic,
}: GeminiDiagnosticPanelProps) {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== "development" || !diagnostic) {
    return null;
  }

  return (
    <div className="mt-3 rounded-sm border border-white/10 bg-black/40 text-[11px] font-mono text-[var(--arcana-stone)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:text-[var(--arcana-ink)] cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-[var(--arcana-gold)]" aria-hidden="true" />
          DEV Diagnostics · {diagnostic.model} · HTTP{" "}
          {diagnostic.httpStatus ?? "N/A"} ({diagnostic.durationMs}ms)
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>

      {open && (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-1 border-t border-white/10 px-3 py-2.5 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] uppercase text-[var(--arcana-stone)]/70">
              Selected Model
            </dt>
            <dd className="text-[var(--arcana-ink)]">{diagnostic.model}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-[var(--arcana-stone)]/70">
              HTTP / Gemini Status
            </dt>
            <dd className="text-[var(--arcana-ink)]">
              {diagnostic.httpStatus ?? "N/A"} /{" "}
              {diagnostic.geminiStatus ?? "N/A"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-[var(--arcana-stone)]/70">
              Error Code
            </dt>
            <dd className="text-[var(--arcana-ink)]">
              {diagnostic.errorCode ?? "NONE"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-[var(--arcana-stone)]/70">
              Timing & Retries
            </dt>
            <dd className="text-[var(--arcana-ink)]">
              TTFT={diagnostic.timeToFirstTokenMs ?? "N/A"}ms, total=
              {diagnostic.durationMs}ms, attempts={diagnostic.attempts}
              {diagnostic.retryAfterSeconds !== null
                ? `, retryAfter=${diagnostic.retryAfterSeconds}s`
                : ""}
            </dd>
          </div>
          {(diagnostic.inputTokens != null ||
            diagnostic.outputTokens != null ||
            diagnostic.finishReason) && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase text-[var(--arcana-stone)]/70">
                Tokens & Finish Reason
              </dt>
              <dd className="text-[var(--arcana-ink)]">
                input={diagnostic.inputTokens ?? "N/A"}, output=
                {diagnostic.outputTokens ?? "N/A"}
                {diagnostic.finishReason
                  ? `, finishReason=${diagnostic.finishReason}`
                  : ""}
              </dd>
            </div>
          )}
          {diagnostic.quotaMetric && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase text-[var(--arcana-stone)]/70">
                Quota Metric
              </dt>
              <dd className="break-all text-amber-200/90">
                {diagnostic.quotaMetric}
              </dd>
            </div>
          )}
          {diagnostic.errorMessage && (
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase text-[var(--arcana-stone)]/70">
                Error Message
              </dt>
              <dd className="break-words text-amber-200/90">
                {diagnostic.errorMessage}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
