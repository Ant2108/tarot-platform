"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  PlugZap,
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
import { maskApiKey, useAISettingsStore } from "@/store/ai-settings-store";
import { useLocaleStore } from "@/store/locale-store";

export function AIConfigurationClient() {
  const { locale } = useLocaleStore();
  const isVi = locale === "vi";

  const {
    apiKey,
    connectionStatus,
    lastTestedAt,
    lastError,
    setApiKey,
    setConnectionResult,
    clearApiKey,
  } = useAISettingsStore();

  const hasSavedKey = Boolean(apiKey.trim());
  const [isEditingKey, setIsEditingKey] = useState(!hasSavedKey);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [testResult, setTestResult] =
    useState<GeminiConnectionTestResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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

  const handleTestAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (testing || !effectiveKeyForAction) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testGeminiConnection(locale, controller.signal, {
        apiKey: effectiveKeyForAction,
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
        setConnectionResult({
          status: "connected",
          error: null,
        });
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2200);
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
              : "Chưa kết nối"
            : hasSavedKey
            ? "Saved (Untested)"
            : "Not Connected",
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

  const guideSteps = isVi
    ? [
        {
          title: "Mở Google AI Studio & đăng nhập Gmail",
          desc: "Bấm nút \"Mở Google AI Studio\" bên dưới và đăng nhập bằng tài khoản Google (Gmail) bình thường của bạn. Không cần thẻ ngân hàng.",
        },
        {
          title: "Bấm nút \"Create API key\" (Tạo khóa API)",
          desc: "Ở góc trên bên phải trang Google AI Studio, bấm \"Create API key\" → chọn dự án mặc định (hoặc tạo dự án mới theo gợi ý sẵn).",
        },
        {
          title: "Sao chép (Copy) mã API Key vừa tạo",
          desc: "Một chuỗi ký tự sẽ hiện ra (thường bắt đầu bằng AIza... hoặc AQ...). Hãy bấm nút Copy để sao chép nguyên vẹn.",
        },
        {
          title: "Dán vào ô bên trên & bấm \"Kiểm Tra & Lưu\"",
          desc: "Quay lại trang này, dán mã vào ô Gemini API Key rồi bấm \"Kiểm Tra & Lưu\". Hệ thống tự chọn sẵn model nhanh và miễn phí nhất cho bạn!",
        },
      ]
    : [
        {
          title: "Open Google AI Studio & sign in with Gmail",
          desc: "Click \"Open Google AI Studio\" below and sign in with your regular Google account. No credit card is required.",
        },
        {
          title: "Click \"Create API key\"",
          desc: "In the top-right corner of Google AI Studio, click \"Create API key\" and pick the default project (or create a new one).",
        },
        {
          title: "Copy your new API key",
          desc: "Copy the generated string (usually starts with AIza... or AQ...).",
        },
        {
          title: "Paste above & click \"Test & Save\"",
          desc: "Return here, paste your key into the box above, and click \"Test & Save\". The fastest free-tier model is pre-configured automatically!",
        },
      ];

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
              Google Gemini · {DEFAULT_GEMINI_MODEL}
            </span>
          </div>
          <h1 className="mt-2 font-editorial text-4xl font-semibold text-[var(--arcana-ink)] sm:text-5xl">
            {isVi ? "Kết Nối AI Tarot Reader" : "Connect AI Tarot Reader"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--arcana-stone)]">
            {isVi
              ? "Chỉ cần dán Gemini API Key miễn phí của bạn một lần duy nhất. Website tự động dùng sẵn model nhanh và ổn định nhất (Gemini 3.5 Flash-Lite), không cần chỉnh thông số kỹ thuật."
              : "Just paste your free Google Gemini API Key once. The app automatically uses our fastest free-tier model (Gemini 3.5 Flash-Lite) — no technical setup needed."}
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

      <div className="space-y-6">
        {/* 1. API Key Input & 1-Click Test + Save */}
        <form onSubmit={handleTestAndSave}>
          <Panel className="p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {isVi ? "Gemini API Key Của Bạn" : "Your Gemini API Key"}
                </h2>
              </div>
              <Badge tone="muted">
                {isVi
                  ? "Model mặc định: Gemini 3.5 Flash-Lite"
                  : "Auto Model: Gemini 3.5 Flash-Lite"}
              </Badge>
            </div>

            {hasSavedKey && !isEditingKey ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[rgba(212,180,117,0.28)] bg-[rgba(212,180,117,0.06)] px-4 py-3.5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[var(--arcana-stone)]">
                    {isVi
                      ? "API Key đang lưu (đã che bảo mật)"
                      : "Saved API Key (Masked)"}
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
                    placeholder={
                      isVi
                        ? "Dán Gemini API Key của bạn vào đây (AIza...)"
                        : "Paste your Gemini API Key here (AIza...)"
                    }
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
                    {isVi
                      ? "Hủy đổi key (giữ key hiện tại)"
                      : "Cancel update (keep saved key)"}
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="gold"
                disabled={testing || !effectiveKeyForAction}
              >
                {testing ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : savedFeedback ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <PlugZap className="h-4 w-4" aria-hidden="true" />
                )}
                {testing
                  ? isVi
                    ? "Đang kiểm tra kết nối..."
                    : "Testing connection..."
                  : savedFeedback
                  ? isVi
                    ? "Đã Kết Nối & Lưu!"
                    : "Connected & Saved!"
                  : isVi
                  ? "Kiểm Tra & Lưu API Key"
                  : "Test & Save API Key"}
              </Button>

              {hasSavedKey && connectionStatus === "connected" && (
                <Button asChild variant="outline">
                  <Link href="/reading">
                    {isVi ? "Bắt Đầu Trải Bài Ngay" : "Start Reading Now"}
                  </Link>
                </Button>
              )}
            </div>

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
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{lastError}</span>
              </div>
            )}
          </Panel>
        </form>

        {/* 2. Beginner-Friendly 4-Step Guide to Get a Free Gemini API Key */}
        <Panel className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--arcana-gold)]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em]">
                {isVi
                  ? "Hướng Dẫn Lấy Gemini API Key Miễn Phí (Chỉ Mất 1 Phút)"
                  : "How to Get Your Free Gemini API Key (Takes 1 Minute)"}
              </h2>
            </div>
            <Button asChild size="sm" variant="gold">
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                {isVi ? "Mở Google AI Studio" : "Open Google AI Studio"}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {guideSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-sm border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(212,180,117,0.5)] bg-[rgba(212,180,117,0.12)] font-mono text-xs font-semibold text-[var(--arcana-gold-light)]">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-medium text-[var(--arcana-ink)]">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-2 pl-8 text-xs leading-relaxed text-[var(--arcana-stone)]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-[var(--arcana-stone)]">
            {isVi
              ? "Mẹo nhỏ: Nếu bạn chưa muốn tạo API Key, bạn vẫn có thể trải bài Tarot bình thường bằng chế độ Giải Cục Bộ (Offline) miễn phí ngay trên web."
              : "Tip: Don't want to create an API key right now? You can still enjoy full Tarot readings immediately using the built-in Offline Reading mode."}
          </p>
        </Panel>

        {/* 3. Honest Browser Storage Security Notice */}
        <Panel className="border-[rgba(212,180,117,0.22)] bg-[rgba(212,180,117,0.03)] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--arcana-gold)]"
              aria-hidden="true"
            />
            <div className="space-y-1.5 text-xs leading-relaxed text-[var(--arcana-stone)]">
              <p className="font-medium text-[var(--arcana-ink)]">
                {isVi
                  ? "Lưu ý bảo mật về API Key trên trình duyệt"
                  : "Browser Storage Security Notice"}
              </p>
              <p>
                {isVi
                  ? "API Key của bạn chỉ được lưu ngay trên trình duyệt này và gửi thẳng tới Google Gemini — không qua máy chủ trung gian. Nếu bạn đang dùng máy tính công cộng hoặc thiết bị dùng chung, hãy bấm \"Xóa Key\" sau khi xem bài xong."
                  : "Your API Key is saved only in this browser and sent directly to Google Gemini — never to any third-party server. Always click \"Delete Key\" when using a shared or public device."}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
