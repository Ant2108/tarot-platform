import { getCardLocalized } from "@/lib/tarot-data";
import {
  getLocalizedPositionLabel,
  getLocalizedSpreadName,
  getLocalizedTopicLabel,
} from "@/lib/i18n";
import { generateCombinedSynthesis } from "@/lib/tarot-synthesis";
import type { Locale } from "@/store/locale-store";
import type {
  AIReadingResult,
  DrawnCard,
  GroundedCardPayload,
  SpreadConfig,
  TopicMeta,
} from "@/types/tarot";

function getSymbolismCue(card: DrawnCard["card"], locale: Locale): string {
  const elementCueVi: Record<string, string> = {
    Fire: "Ngọn lửa của ý chí, hành động và khát vọng sáng tạo.",
    Water: "Dòng nước của cảm xúc, trực giác và sự gắn kết nội tâm.",
    Air: "Làn khí của tư duy, sự thật, giao tiếp và những quyết định rạch ròi.",
    Earth: "Nền đất của sự bền bỉ, vật chất, sức khỏe và kết quả hữu hình.",
    Spirit: "Biểu tượng của bước ngoặt tinh thần và bài học sâu sắc.",
  };
  const elementCueEn: Record<string, string> = {
    Fire: "Fire imagery points to willpower, initiative, and creative momentum.",
    Water: "Water imagery reflects emotional tides, intuition, and relational depth.",
    Air: "Air imagery highlights clarity of thought, truth, and mental boundaries.",
    Earth: "Earth imagery anchors patience, tangible craft, and material steadiness.",
    Spirit: "Archetypal symbolism pointing toward a deeper turning point.",
  };

  if (locale === "vi") {
    return `${card.astrology ? `${card.astrology} · ` : ""}${elementCueVi[card.element] ?? elementCueVi.Spirit}`;
  }
  return `${card.astrology ? `${card.astrology} · ` : ""}${elementCueEn[card.element] ?? elementCueEn.Spirit}`;
}

/**
 * Extracts ONLY the compact knowledge for the 3 selected cards so we never
 * bloat Gemini requests with all 78 cards or raw PDF dumps.
 */
export function buildCompactGroundingPayload(
  drawnCards: DrawnCard[],
  topic: TopicMeta,
  spread: SpreadConfig,
  locale: Locale
): {
  cards: GroundedCardPayload[];
  spreadSignals: string[];
  combinationNotes: string[];
} {
  const synthesis = generateCombinedSynthesis(topic, spread, drawnCards, locale);

  const cards: GroundedCardPayload[] = drawnCards.map((item, idx) => {
    const loc = getCardLocalized(item.card, locale);
    const posLabel = getLocalizedPositionLabel(
      spread.id,
      idx,
      locale,
      item.position.label
    );

    return {
      cardId: item.card.id,
      name: item.card.name,
      titleVi: item.card.titleVi,
      orientation: item.orientation,
      positionIndex: idx,
      positionLabel: posLabel,
      positionSubtitle: item.position.subtitle,
      arcana: item.card.arcana,
      suit: item.card.suit,
      element: item.card.element,
      astrology: item.card.astrology,
      keywords: loc.keywords[item.orientation],
      generalMeaning: loc.general[item.orientation],
      topicMeaning: loc.topics[topic.id][item.orientation],
      growthMeaning: loc.topics.personalGrowth[item.orientation],
      symbolismHint: getSymbolismCue(item.card, locale),
    };
  });

  return {
    cards,
    spreadSignals: synthesis.pdfSignals,
    combinationNotes: synthesis.combinationNotes,
  };
}

/**
 * Produces a warm, structured A–F reading locally when Gemini is offline
 * or NEXT_PUBLIC_TAROT_AI_ENDPOINT is not configured yet.
 */
export function buildLocalAIReadingFallback(
  topic: TopicMeta,
  spread: SpreadConfig,
  drawnCards: DrawnCard[],
  locale: Locale,
  userQuestion = ""
): AIReadingResult {
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

  const cardInterpretations = drawnCards.map((item, idx) => {
    const r = synthesis.cardReadings[idx];
    return {
      cardId: item.card.id,
      cardName: item.card.name,
      positionLabel: r.positionLabel,
      orientation: item.orientation,
      symbolismHighlight: getSymbolismCue(item.card, locale),
      interpretation: r.contextualReading,
    };
  });

  const connectionParts = [
    synthesis.storyArc,
    synthesis.elementalInterplay,
    ...synthesis.combinationNotes,
  ].filter(Boolean);

  const trimmedQ = userQuestion.trim();

  if (locale === "en") {
    return {
      overallEnergy: `${synthesis.openingFraming} ${synthesis.arcanaBalance} ${synthesis.orientationTone}`,
      cardInterpretations,
      cardConnections: connectionParts.join("\n\n"),
      deepInterpretation:
        c1 && c2 && c3
          ? `Stepping back from the individual cards, your ${spreadName} spread reads like a quiet turning point in ${topicLabel.toLowerCase()}. What began with ${c1.card.name} (${c1.orientation}) is no longer just background history—it is actively meeting ${c2.card.name} (${c2.orientation}) in how you respond today.\n\nRather than pushing for an immediate black-and-white answer${trimmedQ ? ` to "${trimmedQ}"` : ""}, notice how ${c3.card.name} (${c3.orientation}) invites a steadier posture. ${synthesis.pdfSignals[0] ?? "Trust the pace of small, honest choices rather than forcing certainty overnight."}`
          : synthesis.storyArc,
      adviceAndReflection: {
        payAttentionTo:
          c2
            ? `Pay closest attention to the living pivot of ${c2.card.name} (${c2.orientation})—specifically where "${getCardLocalized(c2.card, "en").keywords[c2.orientation][0]}" is asking for your honest presence.`
            : "Notice the recurring emotional tone across all three cards.",
        possiblyOverlooking:
          c1
            ? `You may be underestimating how strongly ${c1.card.name} (${c1.orientation}) is still coloring your expectations today.`
            : "Notice any subtle habit you are repeating on autopilot.",
        possibleActions: synthesis.actionSteps,
        reflectionQuestion:
          synthesis.reflectionPrompts[1] ??
          "If you released the pressure to know every outcome today, what honest next step would feel most aligned?",
      },
      closingMessage:
        "Tarot does not lock your future in stone—it illuminates the currents already moving around you so you can step forward with clarity, gentleness, and choice.",
      suggestedFollowUps: [
        `How do ${c1?.card.name ?? "Card 1"} and ${c2?.card.name ?? "Card 2"} tension or support each other?`,
        `What practical shift does ${c3?.card.name ?? "Card 3"} suggest this week?`,
        "What do the elements and orientations highlight together?",
      ],
    };
  }

  return {
    overallEnergy: `${synthesis.openingFraming} ${synthesis.arcanaBalance} ${synthesis.orientationTone}`,
    cardInterpretations,
    cardConnections: connectionParts.join("\n\n"),
    deepInterpretation:
      c1 && c2 && c3
        ? `Khi lùi lại nhìn trọn cả ba lá bài trong sơ đồ ${spreadName}, câu chuyện về ${topicLabel.toLowerCase()} của bạn hiện lên rất rõ mạch. Năng lượng khởi nguồn từ ${c1.card.name} (${c1.orientation === "upright" ? "xuôi" : "ngược"}) vẫn đang tác động trực tiếp vào cách bạn phản ứng với ${c2.card.name} (${c2.orientation === "upright" ? "xuôi" : "ngược"}) ở hiện tại.\n\nThay vì ép bản thân phải có ngay câu trả lời tuyệt đối${trimmedQ ? ` cho câu hỏi "${trimmedQ}"` : ""}, hãy nhìn vào cách ${c3.card.name} (${c3.orientation === "upright" ? "xuôi" : "ngược"}) mở ra một lối đi mềm mại và tỉnh táo hơn. ${synthesis.pdfSignals[0] ?? "Điều quan trọng nhất lúc này là bước đi vừa sức nhưng chân thật với cảm nhận của chính bạn."}`
        : synthesis.storyArc,
    adviceAndReflection: {
      payAttentionTo: c2
        ? `Điều đáng chú ý nhất ngay lúc này nằm ở điểm xoay ${c2.card.name} (${c2.orientation === "upright" ? "xuôi" : "ngược"})—cụ thể là cách yếu tố "${getCardLocalized(c2.card, "vi").keywords[c2.orientation][0]}" đang diễn ra trong thực tế của bạn.`
        : "Chú ý tới mạch cảm xúc lặp lại xuyên suốt ba lá bài.",
      possiblyOverlooking: c1
        ? `Rất có thể bạn đang bỏ qua dư âm từ ${c1.card.name} (${c1.orientation === "upright" ? "xuôi" : "ngược"})—những kỳ vọng hoặc thói quen cũ vẫn âm thầm ảnh hưởng tới quyết định hiện tại.`
        : "Quan sát những phản xạ quen thuộc mà bạn đang lặp lại trong vô thức.",
      possibleActions: synthesis.actionSteps,
      reflectionQuestion:
        synthesis.reflectionPrompts[1] ??
        "Nếu tạm gác áp lực phải kiểm soát mọi kết quả, bước đi nhỏ nhưng trung thực nhất với lòng mình lúc này là gì?",
    },
    closingMessage:
      "Tarot không đóng khung tương lai của bạn—ba lá bài này chỉ soi sáng dòng năng lượng đang hiện hữu để bạn có thêm sự điềm tĩnh và chủ động trong lựa chọn sắp tới.",
    suggestedFollowUps: [
      `Lá ${c1?.card.name ?? "1"} và ${c2?.card.name ?? "2"} đang bổ trợ hay giằng co nhau thế nào?`,
      `Với lá ${c3?.card.name ?? "3"}, mình nên thay đổi góc nhìn hay hành động gì trong tuần này?`,
      "Tương tác nguyên tố và các lá ngược trong trải bài này nhắn nhủ điều gì?",
    ],
  };
}
