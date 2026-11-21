import { getCardLocalized } from "@/lib/tarot-data";
import {
  getLocalizedPositionLabel,
  getLocalizedSpreadName,
  getLocalizedTopicLabel,
} from "@/lib/i18n";
import { generateCombinedSynthesis } from "@/lib/tarot-synthesis";
import type {
  ChatMessage,
  TarotChatContext,
  TarotChatService,
} from "@/types/tarot";

/**
 * Local human-voice Tarot Reader chat service (offline fallback).
 * Speaks warmly and conversationally in Vietnamese or English without textbook quotes
 * or parenthetical PDF/page citations.
 */
export class LocalMockTarotChatService implements TarotChatService {
  readonly providerName = "Vespera Local Tarot Reader";
  readonly isMock = true;

  getSuggestedQuestions(context: TarotChatContext): string[] {
    const { locale, drawnCards, topic, spread } = context;
    const [c1, c2, c3] = drawnCards;
    const topicLabel = getLocalizedTopicLabel(topic.id, locale, topic.label);

    if (locale === "en") {
      const qs = [`How do these 3 cards connect as a story for ${topicLabel}?`];
      if (c1 && c2) {
        qs.push(`Why does ${c1.card.name} lead into ${c2.card.name} right now?`);
      }
      if (c3) {
        qs.push(`What practical step does ${c3.card.name} suggest for me?`);
      }
      qs.push("What do the elements and reversed energy say together?");
      return qs.slice(0, 4);
    }

    const qs = [
      `Ghép cả 3 lá lại thì thông điệp cốt lõi cho ${topicLabel} là gì?`,
    ];
    if (c1 && c2) {
      const p2 = getLocalizedPositionLabel(
        spread.id,
        1,
        "vi",
        c2.position.label
      );
      qs.push(`Vì sao ${c1.card.name} lại dẫn tới ${c2.card.name} ở ${p2}?`);
    }
    if (c3) {
      qs.push(
        `Với lá ${c3.card.name}, mình nên điều chỉnh điều gì trong thời gian tới?`
      );
    }
    qs.push("Năng lượng các nguyên tố và lá ngược trong trải bài này nhắn nhủ gì?");
    return qs.slice(0, 4);
  }

  async sendMessage(
    context: TarotChatContext,
    _history: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 260));

    const { topic, spread, drawnCards, userQuestion, locale } = context;
    const query = userMessage.toLowerCase();
    const synthesis = generateCombinedSynthesis(
      topic,
      spread,
      drawnCards,
      locale,
      userQuestion
    );
    const topicLabel = getLocalizedTopicLabel(topic.id, locale, topic.label);
    const spreadName = getLocalizedSpreadName(spread.id, locale, spread.name);
    const [c1, c2, c3] = drawnCards;

    // 1. Asking specifically about a single card
    const mentionedIdx = drawnCards.findIndex((d, i) => {
      const posLabel = getLocalizedPositionLabel(
        spread.id,
        i,
        locale,
        d.position.label
      ).toLowerCase();
      return (
        query.includes(d.card.name.toLowerCase()) ||
        (d.card.titleVi && query.includes(d.card.titleVi.toLowerCase())) ||
        query.includes(posLabel)
      );
    });

    if (
      mentionedIdx !== -1 &&
      !query.includes("vì sao") &&
      !query.includes("why does") &&
      !query.includes("ghép cả 3")
    ) {
      const d = drawnCards[mentionedIdx];
      const reading = synthesis.cardReadings[mentionedIdx];
      const loc = getCardLocalized(d.card, locale);
      const orientText =
        locale === "en"
          ? d.orientation === "upright"
            ? "upright"
            : "reversed"
          : d.orientation === "upright"
          ? "xuôi"
          : "ngược";

      if (locale === "en") {
        return [
          `Looking closely at ${d.card.name} appearing ${orientText} in ${reading.positionLabel}, this card speaks directly to the heart of your ${topicLabel.toLowerCase()} question. ${reading.contextualReading}`,
          `${reading.transitionNote} On a deeper personal level, it also invites you to reflect on how ${loc.topics.personalGrowth[d.orientation].toLowerCase()}`,
        ].join("\n\n");
      }

      return [
        `Khi dừng lại cảm nhận kỹ lá ${d.card.name} ở chiều ${orientText} tại vị trí ${reading.positionLabel}, năng lượng của lá bài này chạm khá sát vào điều bạn đang trải qua trong chuyện ${topicLabel.toLowerCase()}. ${reading.contextualReading}`,
        `${reading.transitionNote} Nếu nhìn sâu vào nội tâm một chút, lá bài cũng nhắc nhẹ rằng ${loc.topics.personalGrowth[d.orientation].charAt(0).toLowerCase()}${loc.topics.personalGrowth[d.orientation].slice(1)}`,
      ].join("\n\n");
    }

    // 2. Action / Advice / Next Step
    if (
      query.includes("hành động") ||
      query.includes("lời khuyên") ||
      query.includes("nên làm") ||
      query.includes("điều chỉnh") ||
      query.includes("action") ||
      query.includes("advice") ||
      query.includes("should i") ||
      query.includes("practical step")
    ) {
      if (locale === "en") {
        return [
          `If we translate your three cards into calm, practical steps for ${topicLabel.toLowerCase()}, the main invitation is to move gently rather than forcing an immediate outcome. ${synthesis.actionSteps[0] ?? ""}`,
          `${synthesis.actionSteps.slice(1).join(" ")} Keep in mind the overall rhythm here: ${synthesis.elementalInterplay}`,
        ].join("\n\n");
      }

      return [
        `Nếu chuyển thông điệp từ cả ba lá bài thành hướng đi thực tế cho chuyện ${topicLabel.toLowerCase()} của bạn lúc này, điều quan trọng nhất là đi từng bước tỉnh táo thay vì vội vàng ép mọi thứ phải rõ ràng ngay lập tức. ${synthesis.actionSteps[0] ?? ""}`,
        `${synthesis.actionSteps.slice(1).join(" ")} Bên cạnh đó, hãy để ý nhịp năng lượng chung của trải bài: ${synthesis.elementalInterplay}`,
      ].join("\n\n");
    }

    // 3. Elements, Reversed, or Card Interactions
    if (
      query.includes("nguyên tố") ||
      query.includes("chiêm tinh") ||
      query.includes("ngược") ||
      query.includes("kết hợp") ||
      query.includes("vì sao") ||
      query.includes("element") ||
      query.includes("revers") ||
      query.includes("why does")
    ) {
      const extraCombo = synthesis.combinationNotes[0]
        ? ` ${synthesis.combinationNotes[0]}`
        : "";

      if (locale === "en") {
        return [
          `${synthesis.elementalInterplay} ${synthesis.orientationTone}`,
          c1 && c2
            ? `Notice how ${c1.card.name} naturally sets the emotional backdrop for ${c2.card.name}: what you carried in is now meeting a real turning point, while ${c3?.card.name ?? "the final card"} shows the posture that will help you stay grounded.${extraCombo}`
            : synthesis.storyArc,
        ].join("\n\n");
      }

      return [
        `${synthesis.elementalInterplay} ${synthesis.orientationTone}`,
        c1 && c2
          ? `Điểm thú vị là ${c1.card.name} đã âm thầm tạo tiền đề cảm xúc để dẫn bạn tới đúng trạng thái của ${c2.card.name} lúc này, còn ${c3?.card.name ?? "lá cuối cùng"} mở ra cách ứng xử giúp bạn giữ được sự vững vàng mà không đánh mất chính mình.${extraCombo}`
          : synthesis.storyArc,
      ].join("\n\n");
    }

    // 4. Default holistic human Tarot Reader synthesis (e.g. "Ghép cả 3 lá lại...")
    if (locale === "en") {
      return [
        `Looking at all three cards together in your ${spreadName} spread for ${topicLabel.toLowerCase()}, they tell one continuous story rather than three separate predictions. ${synthesis.storyArc}`,
        `${synthesis.elementalInterplay} ${synthesis.actionSteps[0] ?? ""} Take this as a gentle mirror—you always hold the choice in how you step forward next.`,
      ].join("\n\n");
    }

    return [
      `Khi ghép cả ba lá bài trong trải bài ${spreadName} lại với nhau cho chuyện ${topicLabel.toLowerCase()}, bức tranh hiện lên rất liền mạch chứ không hề rời rạc. ${synthesis.storyArc}`,
      `${synthesis.elementalInterplay} Điều hữu ích nhất bạn có thể làm lúc này là: ${synthesis.actionSteps[0] ?? ""} Hãy xem trải bài như một tấm gương soi lại dòng cảm xúc đang diễn ra, để bạn tự tin chọn bước đi nhẹ nhàng và đúng với lòng mình nhất.`,
    ].join("\n\n");
  }
}

export const tarotChatService: TarotChatService =
  new LocalMockTarotChatService();
