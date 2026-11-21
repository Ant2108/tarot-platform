"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  PlugZap,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeminiDiagnosticPanel } from "@/components/ai/GeminiDiagnosticPanel";
import {
  testGeminiConnection,
  type GeminiConnectionTestResult,
} from "@/services/geminiService";
import { maskApiKey, useAISettingsStore } from "@/store/ai-settings-store";
import { useLocaleStore } from "@/store/locale-store";

export function GeminiSettingsModal() {
  const { locale } = useLocaleStore();
  const {
    apiKey,
    isSettingsOpen,
    setApiKey,
    setConnectionResult,
    clearApiKey,
    closeSettings,
  } = useAISettingsStore();

  const hasSavedKey = Boolean(apiKey.trim());
  const [isEditingKey, setIsEditingKey] = useState(!hasSavedKey);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [showGuide, setShowGuide] = useState(!hasSavedKey);
  const [savedFlash, setSavedFlash] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] =
    useState<GeminiConnectionTestResult | null>(null);
  const testAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      const hasKey = Boolean(apiKey.trim());
      setIsEditingKey(!hasKey);
      setShowGuide(!hasKey);
      setNewKeyInput("");
      setShowKey(false);
      setSavedFlash(false);
      setTestResult(null);
    } else {
      testAbortRef.current?.abort();
    }
  }, [isSettingsOpen, apiKey]);

  useEffect(() => {
    if (!isSettingsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSettings();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  const isVi = locale === "vi";
  const effectiveKey = isEditingKey
    ? newKeyInput.trim() || apiKey.trim()
    : apiKey.trim();

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testing || !effectiveKey) return;

    testAbortRef.current?.abort();
    const controller = new AbortController();
    testAbortRef.current = controller;

    setTesting(true);
    setTestResult(null);
    try {
      const result = await testGeminiConnection(locale, controller.signal, {
        apiKey: effectiveKey,
      });
      if (controller.signal.aborted) return;
      setTestResult(result);
      if (result.ok) {
        if (isEditingKey && newKeyInput.trim()) {
          setApiKey(newKeyInput.trim());
          setNewKeyInput("");
          setIsEditingKey(false);
        }
        setConnectionResult({
          status: "connected",
          error: null,
        });
        setSavedFlash(true);
        setTimeout(() => {
          closeSettings();
        }, 550);
      } else {
        setConnectionResult({
          status: "error",
          error: result.message,
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    clearApiKey();
    setNewKeyInput("");
    setIsEditingKey(true);
    setShowGuide(true);
    setTestResult(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gemini-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,5,10,0.82)] px-4 py-6 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm border border-[rgba(212,180,117,0.28)] bg-[#0c0e17] p-6 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={closeSettings}
          aria-label={isVi ? "Đóng cài đặt" : "Close settings"}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-sm text-[var(--arcana-stone)] hover:bg-[rgba(212,180,117,0.1)] hover:text-[var(--arcana-ink)] cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
            Gemini 3.5 Flash-Lite · {isVi ? "Miễn Phí & Nhanh" : "Fast & Free"}
          </span>
        </div>

        <h2
          id="gemini-settings-title"
          className="mt-2 font-editorial text-2xl text-[var(--arcana-ink)] sm:text-3xl"
        >
          {isVi ? "Kết Nối Gemini AI" : "Connect Gemini AI"}
        </h2>

        <form onSubmit={handleTestAndSave} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--arcana-ink)]">
                <KeyRound
                  className="h-3.5 w-3.5 text-[var(--arcana-gold)]"
                  aria-hidden="true"
                />
                Google Gemini API Key
              </span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[var(--arcana-gold-light)] hover:underline"
              >
                {isVi ? "Lấy key miễn phí" : "Get free key"}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>

            {hasSavedKey && !isEditingKey ? (
              <div className="flex items-center justify-between gap-2 rounded-sm border border-[rgba(212,180,117,0.28)] bg-[rgba(212,180,117,0.06)] px-3 py-2.5">
                <span className="font-mono text-xs text-[var(--arcana-gold-light)]">
                  {maskApiKey(apiKey)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewKeyInput("");
                    setIsEditingKey(true);
                  }}
                  className="text-[11px] text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)] cursor-pointer"
                >
                  {isVi ? "Đổi Key" : "Update"}
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="gemini-api-key-input"
                  type={showKey ? "text" : "password"}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder={
                    isVi ? "Dán API Key vào đây (AIza...)" : "Paste API Key here (AIza...)"
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((prev) => !prev)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)] cursor-pointer"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Collapsible 4-step beginner guide */}
          <div className="rounded-sm border border-white/10 bg-white/[0.02]">
            <button
              type="button"
              onClick={() => setShowGuide((v) => !v)}
              className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium text-[var(--arcana-gold-light)] cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                {isVi
                  ? "Chưa có key? Xem hướng dẫn 4 bước (1 phút)"
                  : "New here? 4-step guide to get a free key (1 min)"}
              </span>
              {showGuide ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {showGuide && (
              <ol className="space-y-1.5 border-t border-white/10 px-3.5 py-3 text-[11px] leading-relaxed text-[var(--arcana-stone)] list-decimal list-inside">
                {isVi ? (
                  <>
                    <li>
                      Mở{" "}
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--arcana-gold-light)] underline"
                      >
                        Google AI Studio
                      </a>{" "}
                      và đăng nhập bằng Gmail (miễn phí, không cần thẻ).
                    </li>
                    <li>
                      Bấm nút <strong className="text-[var(--arcana-ink)]">Create API key</strong> → chọn dự án mặc định.
                    </li>
                    <li>
                      Bấm <strong className="text-[var(--arcana-ink)]">Copy</strong> để sao chép chuỗi mã vừa tạo.
                    </li>
                    <li>
                      Dán vào ô trên rồi bấm <strong className="text-[var(--arcana-ink)]">Kiểm Tra & Lưu</strong> — xong!
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      Open{" "}
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--arcana-gold-light)] underline"
                      >
                        Google AI Studio
                      </a>{" "}
                      and sign in with Gmail (free, no card needed).
                    </li>
                    <li>
                      Click <strong className="text-[var(--arcana-ink)]">Create API key</strong> and choose the default project.
                    </li>
                    <li>
                      Click <strong className="text-[var(--arcana-ink)]">Copy</strong> to copy the generated key.
                    </li>
                    <li>
                      Paste it above and click <strong className="text-[var(--arcana-ink)]">Test & Save</strong> — done!
                    </li>
                  </>
                )}
              </ol>
            )}
          </div>

          {testResult && (
            <div
              className={`rounded-sm border p-3 text-xs ${
                testResult.ok
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : "border-amber-400/30 bg-amber-500/10 text-amber-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {testResult.ok ? (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span>{testResult.message}</span>
              </div>
              <GeminiDiagnosticPanel diagnostic={testResult.diagnostic} />
            </div>
          )}

          <div className="flex items-start gap-2.5 rounded-sm border border-[rgba(212,180,117,0.16)] bg-[rgba(212,180,117,0.04)] p-3 text-[11px] leading-relaxed text-[var(--arcana-stone)]">
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--arcana-gold)]"
              aria-hidden="true"
            />
            <span>
              {isVi
                ? "API key chỉ lưu trên trình duyệt này (localStorage). Nếu dùng máy công cộng, hãy bấm Xóa sau khi xem bài xong."
                : "Your key is stored only in this browser (localStorage). Delete it when finished on a shared device."}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              {hasSavedKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {isVi ? "Xóa Key" : "Delete Key"}
                </Button>
              )}
              <Link
                href="/settings"
                onClick={closeSettings}
                className="text-[11px] text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)]"
              >
                {isVi ? "Xem hướng dẫn chi tiết" : "Full guide page"}
              </Link>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="sm"
              disabled={testing || !effectiveKey}
            >
              {testing ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : savedFlash ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <PlugZap className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {testing
                ? isVi
                  ? "Đang kiểm tra..."
                  : "Testing..."
                : savedFlash
                ? isVi
                  ? "Đã Lưu!"
                  : "Saved!"
                : isVi
                ? "Kiểm Tra & Lưu"
                : "Test & Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
