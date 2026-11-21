"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  PlugZap,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GeminiDiagnosticPanel } from "@/components/ai/GeminiDiagnosticPanel";
import { DEFAULT_GEMINI_MODEL } from "@/config/gemini";
import {
  testGeminiConnection,
  type GeminiConnectionTestResult,
} from "@/services/geminiService";
import {
  maskApiKey,
  useAISettingsStore,
  type AIProviderId,
} from "@/store/ai-settings-store";
import { useLocaleStore } from "@/store/locale-store";

export function AIConfigurationClient() {
  const { locale } = useLocaleStore();
  const isVi = locale === "vi";

  const {
    provider,
    apiKey,
    model,
    availableModels,
    connectionStatus,
    lastTestedAt,
    lastError,
    setProvider,
    setApiKey,
    setModel,
    setConnectionResult,
    clearApiKey,
  } = useAISettingsStore();

  const hasSavedKey = Boolean(apiKey.trim());
  const [isEditingKey, setIsEditingKey] = useState(!hasSavedKey);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    model || DEFAULT_GEMINI_MODEL
  );
  const [testing, setTesting] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [testResult, setTestResult] =
    useState<GeminiConnectionTestResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSelectedModel(model || DEFAULT_GEMINI_MODEL);
  }, [model]);

  useEffect(() => {
    if (!hasSavedKey) {
      setIsEditingKey(true);
    }
  }, [hasSavedKey]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const effectiveKeyForAction = isEditingKey
    ? newKeyInput.trim() || apiKey.trim()
    : apiKey.trim();

  const handleTestAndFetchModels = async () => {
    if (testing) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testGeminiConnection(locale, controller.signal, {
        apiKey: effectiveKeyForAction,
        model: selectedModel,
      });
      if (controller.signal.aborted) return;

      setTestResult(result);

      if (result.ok) {
        if (isEditingKey && newKeyInput.trim()) {
          setApiKey(newKeyInput.trim());
          setNewKeyInput("");
          setShowKeyInput(false);
          setIsEditingKey(false);
        }
        setSelectedModel(result.model);
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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingKey && newKeyInput.trim()) {
      setApiKey(newKeyInput.trim());
      setNewKeyInput("");
      setShowKeyInput(false);
      setIsEditingKey(false);
    }
    setModel(selectedModel.trim() || DEFAULT_GEMINI_MODEL);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleDeleteKey = () => {
    abortRef.current?.abort();
    clearApiKey();
    setNewKeyInput("");
    setShowKeyInput(false);
    setIsEditingKey(true);
    setTestResult(null);
  };

  const statusBadge =
    !hasSavedKey || connectionStatus === "unconfigured"
      ? {
          tone: "muted" as const,
          label: isVi
            ? hasSavedKey
              ? "Đã lưu (Chưa kiểm tra)"
              : "Chưa cấu hình"
            : hasSavedKey
            ? "Saved (Untested)"
            : "Not Configured",
        }
      : connectionStatus === "connected"
      ? {
          tone: "gold" as const,
          label: isVi ? "Đã kết nối Gemini" : "Connected to Gemini",
        }
      : {
          tone: "violet" as const,
          label: isVi ? "Lỗi kết nối" : "Connection Error",
        };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/reading"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {isVi ? "Quay lại Trải Bài 3D" : "Back to 3D Reading"}
          </Link>
          <div className="mt-3 flex items-center gap-2 text-[var(--arcana-gold)]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-[0.2em]">
              {isVi ? "Bring Your Own Key (BYOK)" : "Bring Your Own Key (BYOK)"}
            </span>
          </div>
          <h1 className="mt-2 font-editorial text-4xl font-semibold text-[var(--arcana-ink)] sm:text-5xl">
            {isVi ? "Cấu Hình AI Tarot Reader" : "AI Tarot Reader Configuration"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--arcana-stone)]">
            {isVi
              ? "Mỗi người dùng sử dụng Gemini API Key của riêng mình. Website hoạt động 100% trên trình duyệt, không có máy chủ trung gian và không dùng chung API Key."
              : "Every visitor uses their own Google Gemini API Key. This website runs 100% in your browser with no backend server and no shared application API key."}
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Badge tone={statusBadge.tone}>{statusBadge.label}</Badge>
          {lastTestedAt && hasSavedKey && (
            <span className="text-[11px] text-[var(--arcana-stone)]">
              {isVi ? "Kiểm tra lúc: " : "Last tested: "}
              {new Date(lastTestedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-6">
        {/* 1. AI Provider Selection */}
        <Panel className="p-6 sm:p-7">
          <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
            <Cpu className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
              {isVi ? "1. Nhà Cung Cấp AI" : "1. AI Provider"}
            </h2>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setProvider("google-gemini" as AIProviderId)}
              className={`rounded-sm border p-4 text-left transition-colors cursor-pointer ${
                provider === "google-gemini"
                  ? "border-[var(--arcana-gold)] bg-[rgba(212,180,117,0.1)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-editorial text-xl font-semibold text-[var(--arcana-ink)]">
                  Google Gemini
                </span>
                <Badge tone="gold">{isVi ? "Đang chọn" : "Selected"}</Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--arcana-stone)]">
                {isVi
                  ? "Gọi trực tiếp Google Gemini API từ trình duyệt của bạn bằng API Key cá nhân."
                  : "Direct browser calls to Google Gemini API using your personal API key."}
              </p>
            </button>

            <div className="rounded-sm border border-dashed border-white/10 bg-white/[0.01] p-4 opacity-70">
              <div className="flex items-center justify-between">
                <span className="font-editorial text-xl font-semibold text-[var(--arcana-stone)]">
                  {isVi ? "Chế Độ Cục Bộ (Offline)" : "Offline Fallback Engine"}
                </span>
                <Badge tone="muted">{isVi ? "Luôn sẵn sàng" : "Always Ready"}</Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--arcana-stone)]">
                {isVi
                  ? "Tự động kích hoạt khi chưa có API Key hoặc khi quota Gemini của bạn đã hết."
                  : "Automatically available whenever no API key is configured or your Gemini quota is exhausted."}
              </p>
            </div>
          </div>
        </Panel>

        {/* 2. API Key Management (Masked after saving) */}
        <Panel className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
                {isVi ? "2. Gemini API Key Cá Nhân" : "2. Your Personal Gemini API Key"}
              </h2>
            </div>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--arcana-gold-light)] hover:underline"
            >
              {isVi ? "Tạo API Key tại Google AI Studio" : "Create API Key in Google AI Studio"}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          {hasSavedKey && !isEditingKey ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[rgba(212,180,117,0.28)] bg-[rgba(212,180,117,0.06)] px-4 py-3.5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[var(--arcana-stone)]">
                  {isVi ? "API Key đang lưu (đã che bảo mật)" : "Saved API Key (Masked)"}
                </p>
                <p className="mt-0.5 font-mono text-sm text-[var(--arcana-gold-light)]">
                  {maskApiKey(apiKey)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewKeyInput("");
                    setShowKeyInput(false);
                    setIsEditingKey(true);
                  }}
                >
                  {isVi ? "Đổi Key" : "Update Key"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteKey}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {isVi ? "Xóa Key" : "Delete Key"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="relative">
                <label htmlFor="settings-gemini-key" className="sr-only">
                  Gemini API Key
                </label>
                <Input
                  id="settings-gemini-key"
                  type={showKeyInput ? "text" : "password"}
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyInput((v) => !v)}
                  aria-label={showKeyInput ? "Hide API key" : "Show API key"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)] cursor-pointer"
                >
                  {showKeyInput ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {hasSavedKey && (
                <button
                  type="button"
                  onClick={() => {
                    setNewKeyInput("");
                    setIsEditingKey(false);
                  }}
                  className="text-xs text-[var(--arcana-stone)] hover:text-[var(--arcana-ink)] cursor-pointer"
                >
                  {isVi ? "Hủy đổi key (giữ key hiện tại)" : "Cancel update (keep saved key)"}
                </button>
              )}
            </div>
          )}

          {/* Test Connection & Fetch Models Action */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={handleTestAndFetchModels}
              disabled={testing || !effectiveKeyForAction}
            >
              {testing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <PlugZap className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isVi
                ? "Kiểm Tra Kết Nối & Tải Danh Sách Model"
                : "Test Connection & Fetch Available Models"}
            </Button>

            {hasSavedKey && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteKey}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {isVi ? "Xóa API Key khỏi trình duyệt" : "Remove API Key"}
              </Button>
            )}
          </div>

          {/* Connection Feedback */}
          {testResult && (
            <div
              className={`mt-4 rounded-sm border p-3.5 text-xs ${
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
                <span className="leading-relaxed">{testResult.message}</span>
              </div>
              <GeminiDiagnosticPanel diagnostic={testResult.diagnostic} />
            </div>
          )}

          {!testResult && connectionStatus === "error" && lastError && (
            <div className="mt-4 flex items-start gap-2 rounded-sm border border-amber-400/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{lastError}</span>
            </div>
          )}
        </Panel>

        {/* 3. Model Selection */}
        <Panel className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
                {isVi ? "3. Chọn Model Gemini" : "3. Select Gemini Model"}
              </h2>
            </div>
            {hasSavedKey && (
              <button
                type="button"
                disabled={testing}
                onClick={handleTestAndFetchModels}
                className="inline-flex items-center gap-1 text-xs text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)] cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3 w-3 ${testing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {isVi ? "Tải lại danh sách model" : "Refresh model list"}
              </button>
            )}
          </div>

          <p className="mt-2 text-xs text-[var(--arcana-stone)]">
            {isVi
              ? "Tất cả tính năng AI (Luận Giải 3 Lá & Hỏi Đáp Tarot) đều sử dụng duy nhất model bạn chọn dưới đây."
              : "All AI features (Three-Card Reading & Follow-Up Chat) use the single model selected below."}
          </p>

          {availableModels.length > 0 ? (
            <div className="mt-4 space-y-3">
              <label
                htmlFor="settings-model-select"
                className="block text-xs font-medium text-[var(--arcana-ink)]"
              >
                {isVi
                  ? `Model được API Key của bạn hỗ trợ (${availableModels.length})`
                  : `Available Models Supported by Your Key (${availableModels.length})`}
              </label>
              <select
                id="settings-model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex h-11 w-full rounded-sm border border-[rgba(212,180,117,0.28)] bg-[rgba(7,8,13,0.85)] px-3 py-2 font-mono text-xs text-[var(--arcana-ink)] focus:border-[var(--arcana-gold)] focus:outline-none"
              >
                {!availableModels.some((m) => m.id === selectedModel) && (
                  <option value={selectedModel} className="bg-[#0c0e17]">
                    {selectedModel}
                  </option>
                )}
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0c0e17]">
                    {m.id} — {m.displayName}
                  </option>
                ))}
              </select>

              {(() => {
                const activeMeta = availableModels.find(
                  (m) => m.id === selectedModel
                );
                if (!activeMeta?.description) return null;
                return (
                  <p className="rounded-sm border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--arcana-stone)]">
                    <span className="font-medium text-[var(--arcana-ink)]">
                      {activeMeta.displayName}:{" "}
                    </span>
                    {activeMeta.description}
                  </p>
                );
              })()}
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <label
                htmlFor="settings-model-manual"
                className="block text-xs font-medium text-[var(--arcana-ink)]"
              >
                {isVi
                  ? "Model ID hiện tại (bấm Kiểm Tra Kết Nối để tải danh sách model thực tế)"
                  : "Current Model ID (click Test Connection to fetch your key's live model list)"}
              </label>
              <Input
                id="settings-model-manual"
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder={DEFAULT_GEMINI_MODEL}
                className="font-mono text-xs"
              />
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <span className="text-xs text-[var(--arcana-stone)]">
              {isVi
                ? "Cấu hình được lưu cục bộ trên trình duyệt này."
                : "Configuration is saved locally in this browser."}
            </span>
            <Button type="submit" variant="gold">
              {savedFeedback ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {isVi ? "Đã Lưu Cấu Hình" : "Configuration Saved"}
                </>
              ) : isVi ? (
                "Lưu Cấu Hình"
              ) : (
                "Save Configuration"
              )}
            </Button>
          </div>
        </Panel>

        {/* 4. Honest Browser Storage Security Notice */}
        <Panel className="border-[rgba(212,180,117,0.22)] bg-[rgba(212,180,117,0.03)] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--arcana-gold)]"
              aria-hidden="true"
            />
            <div className="space-y-1.5 text-xs leading-relaxed text-[var(--arcana-stone)]">
              <p className="font-medium text-[var(--arcana-ink)]">
                {isVi
                  ? "Lưu ý bảo mật về lưu trữ trình duyệt (localStorage)"
                  : "Browser Storage Security Notice (localStorage)"}
              </p>
              <p>
                {isVi
                  ? "API Key của bạn chỉ được lưu trong trình duyệt này và gửi trực tiếp tới Google Gemini API — không bao giờ gửi về máy chủ của website. Tuy nhiên, lưu trữ trên trình duyệt (localStorage) không an toàn tuyệt đối (có thể bị truy cập bởi tiện ích mở rộng độc hại hoặc người dùng chung máy). Hãy luôn bấm \"Xóa Key\" nếu bạn đang dùng máy tính công cộng hoặc thiết bị dùng chung."
                  : "Your API Key is stored only in this browser and sent directly to Google's Gemini API — never to any website-owned server. However, browser storage (localStorage) is not completely secure (malicious browser extensions or anyone with access to this browser profile could read it). Always click \"Delete Key\" if you are on a shared or public device."}
              </p>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
}
