"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  PlugZap,
  Settings2,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeminiDiagnosticPanel } from "@/components/ai/GeminiDiagnosticPanel";
import { DEFAULT_GEMINI_MODEL } from "@/config/gemini";
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
    model,
    availableModels,
    isSettingsOpen,
    setApiKey,
    setModel,
    setConnectionResult,
    clearApiKey,
    closeSettings,
  } = useAISettingsStore();

  const hasSavedKey = Boolean(apiKey.trim());
  const [isEditingKey, setIsEditingKey] = useState(!hasSavedKey);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [draftModel, setDraftModel] = useState(model || DEFAULT_GEMINI_MODEL);
  const [showKey, setShowKey] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] =
    useState<GeminiConnectionTestResult | null>(null);
  const testAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      setIsEditingKey(!Boolean(apiKey.trim()));
      setNewKeyInput("");
      setDraftModel(model || DEFAULT_GEMINI_MODEL);
      setShowKey(false);
      setSavedFlash(false);
      setTestResult(null);
    } else {
      testAbortRef.current?.abort();
    }
  }, [isSettingsOpen, apiKey, model]);

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingKey && newKeyInput.trim()) {
      setApiKey(newKeyInput.trim());
      setNewKeyInput("");
      setIsEditingKey(false);
    }
    setModel(draftModel.trim() || DEFAULT_GEMINI_MODEL);
    setSavedFlash(true);
    setTimeout(() => {
      closeSettings();
    }, 300);
  };

  const handleTestConnection = async () => {
    if (testing || !effectiveKey) return;
    testAbortRef.current?.abort();
    const controller = new AbortController();
    testAbortRef.current = controller;

    setTesting(true);
    setTestResult(null);
    try {
      const result = await testGeminiConnection(locale, controller.signal, {
        apiKey: effectiveKey,
        model: draftModel,
      });
      if (controller.signal.aborted) return;
      setTestResult(result);
      if (result.ok) {
        if (isEditingKey && newKeyInput.trim()) {
          setApiKey(newKeyInput.trim());
          setNewKeyInput("");
          setIsEditingKey(false);
        }
        setDraftModel(result.model);
        setModel(result.model);
        setConnectionResult({
          status: "connected",
          error: null,
          models: result.availableModels,
        });
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
            Bring Your Own Key (BYOK)
          </span>
        </div>

        <h2
          id="gemini-settings-title"
          className="mt-2 font-editorial text-2xl text-[var(--arcana-ink)] sm:text-3xl"
        >
          {isVi ? "Cấu Hình Gemini Cá Nhân" : "Personal Gemini Configuration"}
        </h2>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
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
                {isVi ? "Lấy key tại AI Studio" : "Get key on AI Studio"}
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
                  placeholder="AIzaSy..."
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

          <div className="space-y-1.5">
            <label
              htmlFor="gemini-modal-model"
              className="text-xs font-medium text-[var(--arcana-ink)]"
            >
              {isVi ? "Model Gemini" : "Gemini Model"}
            </label>
            {availableModels.length > 0 ? (
              <select
                id="gemini-modal-model"
                value={draftModel}
                onChange={(e) => setDraftModel(e.target.value)}
                className="flex h-10 w-full rounded-sm border border-[rgba(212,180,117,0.22)] bg-[rgba(7,8,13,0.8)] px-3 py-2 font-mono text-xs text-[var(--arcana-ink)] focus:border-[var(--arcana-gold)] focus:outline-none"
              >
                {!availableModels.some((m) => m.id === draftModel) && (
                  <option value={draftModel} className="bg-[#0c0e17]">
                    {draftModel}
                  </option>
                )}
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0c0e17]">
                    {m.id} — {m.displayName}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id="gemini-modal-model"
                type="text"
                value={draftModel}
                onChange={(e) => setDraftModel(e.target.value)}
                placeholder={DEFAULT_GEMINI_MODEL}
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs"
              />
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
                ? "API key chỉ lưu trên trình duyệt của bạn (localStorage) — không an toàn tuyệt đối trên máy dùng chung. Hãy xóa key sau khi dùng xong."
                : "Your API key is stored only in your browser (localStorage) — not fully secure on shared devices. Delete your key when done."}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing || !effectiveKey}
              >
                {testing ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <PlugZap className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isVi ? "Kiểm Tra & Tải Model" : "Test & Fetch Models"}
              </Button>
              {hasSavedKey && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {isVi ? "Xóa" : "Delete"}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                onClick={closeSettings}
                className="inline-flex items-center gap-1 px-2 text-[11px] text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)]"
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                {isVi ? "Trang Cài Đặt" : "Full Page"}
              </Link>
              <Button type="submit" variant="gold" size="sm">
                {savedFlash ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {isVi ? "Đã Lưu" : "Saved"}
                  </>
                ) : isVi ? (
                  "Lưu"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
