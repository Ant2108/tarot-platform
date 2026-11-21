"use client";

import { memo } from "react";

interface StreamingMarkdownProps {
  text: string;
  isStreaming?: boolean;
}

function renderInlineFormatting(line: string): React.ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[var(--arcana-ink)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={idx} className="italic text-[var(--arcana-gold-light)]/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Lightweight memoized Markdown renderer for live SSE Gemini chunks.
 * Isolates token-by-token re-renders to this small component only.
 */
export const StreamingMarkdown = memo(function StreamingMarkdown({
  text,
  isStreaming = false,
}: StreamingMarkdownProps) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-[var(--arcana-ink)]/90">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return null;

        if (line.startsWith("## ") || line.startsWith("### ")) {
          const headingText = line.replace(/^#{2,3}\s+/, "");
          return (
            <h3
              key={idx}
              className="pt-2 font-editorial text-xl font-semibold text-[var(--arcana-gold-light)]"
            >
              {headingText}
            </h3>
          );
        }

        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <p key={idx} className="flex items-start gap-2 pl-1">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--arcana-gold)]" />
              <span>{renderInlineFormatting(line.slice(2))}</span>
            </p>
          );
        }

        return <p key={idx}>{renderInlineFormatting(line)}</p>;
      })}

      {isStreaming && (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-1.5 animate-pulse rounded-xs bg-[var(--arcana-gold)] align-middle"
        />
      )}
    </div>
  );
});
