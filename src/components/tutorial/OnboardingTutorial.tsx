"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  KeyRound,
  Layers,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocaleStore } from "@/store/locale-store";
import { useTutorialStore } from "@/store/tutorial-store";

interface TutorialStep {
  icon: typeof Sparkles;
  badgeVi: string;
  badgeEn: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  tipVi: string;
  tipEn: string;
  ctaHref?: string;
  ctaVi?: string;
  ctaEn?: string;
}

const STEPS: TutorialStep[] = [
  {
    icon: Sparkles,
    badgeVi: "Bước 1 / 5 · Giới Thiệu",
    badgeEn: "Step 1 / 5 · Welcome",
    titleVi: "Chào mừng đến với Vespera Tarot",
    titleEn: "Welcome to Vespera Tarot",
    descVi:
      "Không gian trải bài Tarot Rider-Waite-Smith 3D chuẩn tài liệu chuyên sâu, kết hợp AI Tarot Reader và Thư viện tra cứu đủ 78 lá bài.",
    descEn:
      "An immersive 3D Rider-Waite-Smith Tarot sanctuary with an AI Tarot Reader and a complete 78-card knowledge library.",
    tipVi:
      "Bạn có thể đổi ngôn ngữ VI / EN bất kỳ lúc nào ở thanh menu phía trên.",
    tipEn:
      "You can switch between VI / EN anytime from the top navigation bar.",
  },
  {
    icon: KeyRound,
    badgeVi: "Bước 2 / 5 · Kết Nối AI (Tùy Chọn)",
    badgeEn: "Step 2 / 5 · Connect AI (Optional)",
    titleVi: "Kết nối Gemini AI miễn phí trong 1 phút",
    titleEn: "Connect Free Gemini AI in 1 Minute",
    descVi:
      "Mở mục Cài Đặt AI (biểu tượng chìa khóa trên thanh menu), làm theo 4 bước ngắn để lấy Gemini API Key miễn phí từ Google AI Studio rồi bấm Kiểm Tra & Lưu.",
    descEn:
      "Open AI Settings (the key icon in the header), follow the 4-step guide to grab a free Gemini API Key from Google AI Studio, and click Test & Save.",
    tipVi:
      "Chưa muốn tạo API Key? Bạn vẫn có thể bỏ qua và dùng chế độ Giải Cục Bộ (Offline) miễn phí ngay lập tức.",
    tipEn:
      "Not ready for an API key? You can skip this and use the built-in Offline Reading mode right away.",
    ctaHref: "/settings",
    ctaVi: "Mở Cài Đặt AI",
    ctaEn: "Open AI Settings",
  },
  {
    icon: Compass,
    badgeVi: "Bước 3 / 5 · Đặt Câu Hỏi",
    badgeEn: "Step 3 / 5 · Set Intention",
    titleVi: "Chọn Chủ Đề & Sơ Đồ Trải Bài",
    titleEn: "Choose Topic & Spread",
    descVi:
      "Vào mục Trải Bài 3D, chọn chủ đề bạn quan tâm (Tình Yêu, Sự Nghiệp, Gia Đình, Tài Chính...) và nhập câu hỏi cụ thể để Tarot Reader luận giải sát hoàn cảnh nhất.",
    descEn:
      "Head to 3D Reading, pick your topic (Love, Career, Family, Finance...) and type your real question for a tailored interpretation.",
    tipVi:
      "Câu hỏi càng rõ ràng (ví dụ: \"Mình nên làm gì để cải thiện mối quan hệ hiện tại?\"), lời khuyên càng thực tế.",
    tipEn:
      "Clear, open-ended questions yield the most grounded, actionable guidance.",
  },
  {
    icon: Layers,
    badgeVi: "Bước 4 / 5 · Rút 3 Lá Bài",
    badgeEn: "Step 4 / 5 · Draw 3 Cards",
    titleVi: "Xào Bài, Chọn 3 Lá & Lật Bài 3D",
    titleEn: "Shuffle, Draw 3 Cards & Reveal",
    descVi:
      "Bấm xào bộ bài, tập trung vào câu hỏi rồi chạm chọn 3 lá theo trực giác. Sau đó chạm từng lá (hoặc bấm Lật Tất Cả) để mở bài.",
    descEn:
      "Shuffle the deck, focus on your question, pick 3 cards intuitively, then tap each card (or Reveal All) to flip them.",
    tipVi:
      "Trên điện thoại, bạn có thể bấm nút \"Chế độ 2D\" ở góc khung bài nếu muốn chọn lá thật nhanh và gọn.",
    tipEn:
      "On mobile, you can toggle \"2D Mode\" in the corner of the table anytime for quick tapping.",
  },
  {
    icon: MessageSquare,
    badgeVi: "Bước 5 / 5 · Luận Giải & Hỏi Đáp",
    badgeEn: "Step 5 / 5 · Read & Ask Follow-Ups",
    titleVi: "Đọc Luận Giải & Hỏi Sâu Thêm",
    titleEn: "Explore Reading & Ask Follow-Ups",
    descVi:
      "Xem trọn vẹn 6 phần luận giải kết nối cả 3 lá bài. Nếu còn băn khoăn chi tiết nào, hãy kéo xuống khung Hỏi Đáp Sâu Về Trải Bài để hỏi trực tiếp Tarot Reader.",
    descEn:
      "Read the 6-part synthesis connecting all three cards, then scroll down to the Tarot Chat panel to ask focused follow-up questions.",
    tipVi:
      "Bạn luôn có thể mở lại hướng dẫn này bất kỳ lúc nào qua nút \"?\" trên thanh menu.",
    tipEn:
      "You can reopen this guide anytime via the \"?\" button in the navigation bar.",
    ctaHref: "/reading",
    ctaVi: "Bắt Đầu Trải Bài Ngay",
    ctaEn: "Start Reading Now",
  },
];

export function OnboardingTutorial() {
  const { locale } = useLocaleStore();
  const { isOpen, initTutorial, skipOnce, dismissForever } = useTutorialStore();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    initTutorial();
  }, [initTutorial]);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipOnce();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, skipOnce]);

  if (!isOpen) return null;

  const isVi = locale === "vi";
  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-tutorial-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(4,5,10,0.84)] px-4 py-6 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) skipOnce();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-md border border-[rgba(212,180,117,0.32)] bg-[#0c0e17] p-6 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={skipOnce}
          aria-label={isVi ? "Đóng hướng dẫn" : "Close tutorial"}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-sm text-[var(--arcana-stone)] hover:bg-[rgba(212,180,117,0.1)] hover:text-[var(--arcana-ink)] cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Progress bars */}
        <div className="mb-5 flex items-center gap-1.5 pr-8">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStepIndex(i)}
              aria-label={`Step ${i + 1}`}
              className={`h-1.5 flex-1 rounded-full transition-colors cursor-pointer ${
                i <= stepIndex
                  ? "bg-[var(--arcana-gold)]"
                  : "bg-white/12 hover:bg-white/25"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2.5 text-[var(--arcana-gold)]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(212,180,117,0.4)] bg-[rgba(212,180,117,0.1)]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">
            {isVi ? step.badgeVi : step.badgeEn}
          </span>
        </div>

        <h2
          id="onboarding-tutorial-title"
          className="mt-4 font-editorial text-2xl font-semibold text-[var(--arcana-ink)] sm:text-3xl"
        >
          {isVi ? step.titleVi : step.titleEn}
        </h2>

        <p className="mt-2.5 text-sm leading-relaxed text-[var(--arcana-stone)]">
          {isVi ? step.descVi : step.descEn}
        </p>

        <div className="mt-4 rounded-sm border border-[rgba(212,180,117,0.18)] bg-[rgba(212,180,117,0.05)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--arcana-gold-light)]/90">
          {isVi ? step.tipVi : step.tipEn}
        </div>

        {step.ctaHref && (
          <div className="mt-4">
            <Button
              asChild
              size="sm"
              variant="outline"
              onClick={skipOnce}
            >
              <Link href={step.ctaHref}>
                {isVi ? step.ctaVi : step.ctaEn}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}

        {/* Navigation Row */}
        <div className="mt-6 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isFirst}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {isVi ? "Trước" : "Back"}
          </Button>

          {isLast ? (
            <Button
              type="button"
              size="sm"
              variant="gold"
              onClick={dismissForever}
            >
              {isVi ? "Hoàn Tất & Bắt Đầu" : "Finish & Start"}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="gold"
              onClick={() =>
                setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
              }
            >
              {isVi ? "Tiếp Theo" : "Next"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>

        {/* Skip Once vs Don't Show Again */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--arcana-stone)]">
          <button
            type="button"
            onClick={skipOnce}
            className="hover:text-[var(--arcana-ink)] cursor-pointer"
          >
            {isVi ? "Bỏ qua lần này" : "Skip for now"}
          </button>
          <button
            type="button"
            onClick={dismissForever}
            className="hover:text-[var(--arcana-gold-light)] cursor-pointer"
          >
            {isVi ? "Không nhắc lại nữa" : "Don't show again"}
          </button>
        </div>
      </div>
    </div>
  );
}
