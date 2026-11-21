import tarotRules from "@/data/tarot-rules.json";
import { getCardLocalized } from "@/lib/tarot-data";
import {
  getLocalizedPositionLabel,
  getLocalizedSpreadName,
  getLocalizedTopicLabel,
} from "@/lib/i18n";
import type { Locale } from "@/store/locale-store";
import type { DrawnCard, SpreadConfig, TopicMeta } from "@/types/tarot";

export interface CardContextualReading {
  cardId: string;
  positionLabel: string;
  contextualReading: string;
  transitionNote: string;
}

export interface ReadingSynthesis {
  headline: string;
  openingFraming: string;
  storyArc: string;
  elementalInterplay: string;
  arcanaBalance: string;
  orientationTone: string;
  cardReadings: CardContextualReading[];
  actionSteps: string[];
  pdfSignals: string[];
  combinationNotes: string[];
  reflectionPrompts: string[];
}

function describeElementalInterplay(
  elements: string[],
  locale: Locale
): string {
  const unique = new Set(elements);
  const hasFire = unique.has("Fire");
  const hasWater = unique.has("Water");
  const hasAir = unique.has("Air");
  const hasEarth = unique.has("Earth");

  if (locale === "en") {
    if (hasFire && hasWater) {
      return "Fire and Water meet in this spread—your drive to act is negotiating with deep emotional currents. Don't let impatience override what your heart actually feels.";
    }
    if (hasFire && hasAir) {
      return "Fire and Air fuel one another—ideas and willpower accelerate quickly here. Momentum is strong, so anchor your sharpest plan before rushing ahead.";
    }
    if (hasWater && hasEarth) {
      return "Water and Earth nourish one another—emotional sincerity blends with practical stability, favoring steady, tangible growth over sudden leaps.";
    }
    if (hasAir && hasEarth) {
      return "Air and Earth create productive friction—your thoughts are sharp, yet real-world execution demands patience and concrete structure.";
    }
    if (unique.size === 1) {
      const only = elements[0];
      return `All three cards share the ${only} element—the energy of this situation is highly concentrated in one dimension, asking you to balance it deliberately.`;
    }
    return "The elements appear balanced across your three cards, showing that thought, feeling, action, and practical reality each play a proportional role.";
  }

  if (hasFire && hasWater) {
    return "Lửa và Nước cùng xuất hiện trong trải bài: mong muốn hành động quyết liệt của bạn đang giằng co với dòng cảm xúc nhạy cảm bên trong. Đừng để sự nóng vội lấn át cảm nhận thật, cũng đừng để cảm xúc làm bạn chần chừ quá lâu.";
  }
  if (hasFire && hasAir) {
    return "Lửa và Khí tương sinh mạnh mẽ: tư duy sắc bén đang tiếp thêm nhiên liệu cho hành động. Nhịp độ tình huống này rất nhanh—hãy chọn đúng một mục tiêu rõ ràng rồi dứt khoát triển khai.";
  }
  if (hasWater && hasEarth) {
    return "Nước và Đất nuôi dưỡng lẫn nhau: cảm xúc chân thành gặp nền tảng thực tế vững vàng. Đây là dòng năng lượng rất tốt để xây dựng điều bền lâu bằng những hành động chăm chút cụ thể thay vì lời hứa suông.";
  }
  if (hasAir && hasEarth) {
    return "Khí và Đất tạo độ ma sát thực tế: bạn có nhiều phân tích và kế hoạch trong đầu, nhưng thực tại đòi hỏi sự kiên nhẫn và kiểm chứng từng bước thay vì chỉ dừng ở suy nghĩ.";
  }
  if (unique.size === 1) {
    const mapVi: Record<string, string> = {
      Fire: "Lửa (hành động, đam mê)",
      Water: "Nước (cảm xúc, mối quan hệ)",
      Air: "Khí (lý trí, giao tiếp, mâu thuẫn)",
      Earth: "Đất (tài chính, công việc, thực tế)",
    };
    return `Cả 3 lá đều thuộc nguyên tố ${mapVi[elements[0]] ?? elements[0]}—năng lượng đang dồn rất mạnh về một phía, cho thấy vấn đề của bạn tập trung hoàn toàn ở khía cạnh này và cần bổ sung thêm sự cân bằng từ các mặt còn lại.`;
  }
  return "Các nguyên tố phân bổ hài hòa giữa cảm xúc, lý trí, hành động và thực tế—cho thấy bạn có đủ điều kiện để xử lý tình huống một cách cân bằng.";
}

function describeTransition(
  prev: DrawnCard,
  curr: DrawnCard,
  locale: Locale
): string {
  if (locale === "en") {
    if (prev.orientation === "upright" && curr.orientation === "reversed") {
      return `Because ${prev.card.name} moved openly before, ${curr.card.name} reversed now shows where that momentum hits internal resistance or asks for a pause.`;
    }
    if (prev.orientation === "reversed" && curr.orientation === "upright") {
      return `The inward block shown by ${prev.card.name} reversed begins to clear as ${curr.card.name} upright restores forward motion.`;
    }
    if (prev.orientation === "reversed" && curr.orientation === "reversed") {
      return `Two reversed cards in sequence suggest an unresolved pattern carrying forward—address the root gently before pushing for outer results.`;
    }
    return `${prev.card.name} flows directly into ${curr.card.name}, building a clear cause-and-effect bridge in your situation.`;
  }

  if (prev.orientation === "upright" && curr.orientation === "reversed") {
    return `Từ dòng chảy đang mở của ${prev.card.name} (xuôi) chuyển sang ${curr.card.name} (ngược), có thể thấy đà tiến của bạn đang gặp một điểm khựng nội tâm hoặc chi tiết bị bỏ sót cần dừng lại điều chỉnh.`;
  }
  if (prev.orientation === "reversed" && curr.orientation === "upright") {
    return `Nút thắt hoặc sự chần chừ ở ${prev.card.name} (ngược) đang dần được tháo gỡ khi bước sang năng lượng thông suốt của ${curr.card.name} (xuôi).`;
  }
  if (prev.orientation === "reversed" && curr.orientation === "reversed") {
    return `Hai lá ngược nối tiếp nhau cho thấy một thói quen hoặc vướng mắc cũ vẫn chưa được giải quyết dứt điểm—cần xử lý tận gốc trước khi mong kết quả bên ngoài thay đổi.`;
  }
  return `Năng lượng từ ${prev.card.name} chuyển tiếp rất tự nhiên sang ${curr.card.name}, tạo thành mạch nhân – quả rõ ràng trong hoàn cảnh của bạn.`;
}

export function generateCombinedSynthesis(
  topic: TopicMeta,
  spread: SpreadConfig,
  drawnCards: DrawnCard[],
  locale: Locale = "vi",
  userQuestion = ""
): ReadingSynthesis {
  const topicLabel = getLocalizedTopicLabel(topic.id, locale, topic.label);
  const spreadName = getLocalizedSpreadName(spread.id, locale, spread.name);
  const trimmedQ = userQuestion.trim();

  const majorCount = drawnCards.filter(
    (d) => d.card.arcana === "Major Arcana"
  ).length;
  const reversedCount = drawnCards.filter(
    (d) => d.orientation === "reversed"
  ).length;
  const elements = drawnCards.map((d) => d.card.element);
  const elementalInterplay = describeElementalInterplay(elements, locale);

  const arcanaBalance =
    locale === "en"
      ? majorCount >= 2
        ? `${majorCount} of 3 cards are Major Arcana—this situation touches deeper life lessons and turning points rather than minor passing details.`
        : majorCount === 1
        ? "1 Major Arcana card anchors 2 Minor Arcana cards—a core life theme is expressing itself through everyday practical choices."
        : "All 3 cards are Minor Arcana—the outcome rests heavily on your day-to-day actions, communication, and choices right now."
      : majorCount >= 2
      ? `Có tới ${majorCount}/3 lá thuộc Bộ Ẩn Chính—cho thấy câu chuyện bạn hỏi không chỉ là chuyện thoáng qua mà là bước ngoặt hoặc bài học quan trọng (Tài liệu 2, pg. 11–12).`
      : majorCount === 1
      ? "1 lá Ẩn Chính đứng cùng 2 lá Ẩn Phụ—một bài học cốt lõi đang hiện hình ngay trong những lựa chọn thực tế hàng ngày của bạn."
      : "Cả 3 lá đều thuộc Bộ Ẩn Phụ—tình huống này nằm rất rõ trong tầm kiểm soát chủ động của bạn thông qua cách ứng xử và hành động hàng ngày.";

  const orientationTone =
    locale === "en"
      ? reversedCount === 0
        ? "All 3 cards are upright—energy is direct, visible, and ready for constructive action."
        : reversedCount === 3
        ? "All 3 cards are reversed—this is an inward recalibration phase; pause and untangle hidden resistance before making big moves."
        : `${reversedCount} of 3 cards appear reversed—external momentum meets an internal lesson asking for honest adjustment.`
      : reversedCount === 0
      ? "Cả 3 lá đều xuôi—tình huống đang vận động khá rõ ràng, ít bị che khuất và thuận lợi để bạn chủ động hành động."
      : reversedCount === 3
      ? "Cả 3 lá đều ngược—năng lượng đang quay vào trong hoặc bị trì trệ; trước khi quyết định lớn, bạn cần chậm lại gỡ từng nút thắt tâm lý."
      : `Có ${reversedCount}/3 lá ngược—bên cạnh những yếu tố thuận lợi vẫn tồn tại điểm nghẽn ngầm cần bạn nhìn thẳng để điều chỉnh.`;

  // Spread Overview Signals (spoken naturally like a human Tarot Reader, no book citations)
  const cleanReaderText = (text: string) =>
    text
      .replace(/\s*\((?:PDF|Tài liệu|Trang|pg\.?)[^)]*\)/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

  const pdfSignals: string[] = [];
  const names = drawnCards.map((d) => d.card.name);

  const courtCount = drawnCards.filter((d) =>
    /^(Page|Knight|Queen|King)\s/.test(d.card.name)
  ).length;
  if (courtCount >= 2) {
    pdfSignals.push(
      cleanReaderText(
        locale === "en"
          ? "Multiple Court cards appear—several people or strong personalities are actively influencing this situation."
          : tarotRules.courtRule
      )
    );
  }

  const hasSpeedCard = drawnCards.some(
    (d) => d.card.name.startsWith("Knight ") || d.card.name === "Eight of Wands"
  );
  if (hasSpeedCard) {
    pdfSignals.push(
      cleanReaderText(
        locale === "en"
          ? "A Knight or Eight of Wands appears—events are moving quickly and invite nimble awareness."
          : tarotRules.speedRule
      )
    );
  }

  const minorNums = drawnCards
    .filter((d) => d.card.arcana === "Minor Arcana")
    .map((d) => Number(d.card.number))
    .filter((n) => n >= 1 && n <= 10);

  if (minorNums.some((n) => n >= 1 && n <= 3)) {
    pdfSignals.push(
      cleanReaderText(
        locale === "en"
          ? "Early numbered cards suggest you are still in the opening chapter of this cycle."
          : tarotRules.numberStages.early
      )
    );
  }
  if (minorNums.some((n) => n >= 4 && n <= 6)) {
    pdfSignals.push(
      cleanReaderText(
        locale === "en"
          ? "Mid-numbered cards indicate you are in the middle of the journey—building stability, working through friction, or finding balance."
          : tarotRules.numberStages.middle
      )
    );
  }
  if (minorNums.some((n) => n >= 7 && n <= 9)) {
    pdfSignals.push(
      cleanReaderText(
        locale === "en"
          ? "Higher numbered cards show you are nearing resolution after sustained effort."
          : tarotRules.numberStages.late
      )
    );
  }
  if (minorNums.includes(10)) {
    pdfSignals.push(
      cleanReaderText(
        locale === "en"
          ? "A Ten marks the natural culmination or completion of an important cycle."
          : tarotRules.numberStages.completion
      )
    );
  }

  if (topic.id === "love") {
    const swordsCount = drawnCards.filter((d) => d.card.suit === "Swords").length;
    const cupsCount = drawnCards.filter((d) => d.card.suit === "Cups").length;
    if (swordsCount >= 2 && cupsCount === 0) {
      pdfSignals.push(
        cleanReaderText(
          locale === "en"
            ? "Multiple Swords without Cups in a love spread point to overthinking, guardedness, or tension between the head and the heart."
            : tarotRules.loveSwordsWarning
        )
      );
    }
    const loveStars = names.filter((n) => tarotRules.topLoveCards.includes(n));
    if (loveStars.length > 0) {
      pdfSignals.push(
        locale === "en"
          ? `${loveStars.join(", ")} brings a deeply resonant romantic signature to this spread.`
          : `${loveStars.join(", ")} mang đến dấu ấn tình cảm rất mạnh mẽ và giàu chiều sâu cho trải bài lần này.`
      );
    }
  }

  // Pair combination notes (natural Tarot Reader phrasing)
  const combinationNotes: string[] = [];
  for (const combo of tarotRules.pairCombinations) {
    if (combo.cards.every((c) => names.includes(c))) {
      combinationNotes.push(cleanReaderText(combo.note));
    }
  }
  if (names.includes("The High Priestess")) {
    if (drawnCards.some((d) => d.card.suit === "Pentacles")) {
      combinationNotes.push(
        locale === "en"
          ? "The High Priestess alongside Pentacles shows your quiet intuition is pointing toward a grounded practical opportunity."
          : "Khi The High Priestess đi cùng nhóm Tiền, trực giác của bạn đang báo hiệu một hướng đi thực tế và vững vàng về tài chính—hãy tin vào cảm nhận đó để bắt đầu."
      );
    }
    if (drawnCards.some((d) => d.card.suit === "Cups")) {
      combinationNotes.push(
        locale === "en"
          ? "The High Priestess alongside Cups deepens emotional sensitivity—your gut feeling about this connection is remarkably accurate."
          : "Sự kết hợp giữa The High Priestess và nhóm Cốc cho thấy cảm xúc đang lắng sâu và linh cảm của bạn về mối quan hệ này rất tinh nhạy."
      );
    }
    if (drawnCards.some((d) => d.card.suit === "Wands")) {
      combinationNotes.push(
        locale === "en"
          ? "The High Priestess alongside Wands sparks creative flow when you follow inner inspiration over rigid rules."
          : "The High Priestess gặp nhóm Gậy mở ra nguồn cảm hứng sáng tạo mạnh mẽ nhất khi bạn lắng nghe con tim thay vì gò bó theo khuôn mẫu."
      );
    }
    if (drawnCards.some((d) => d.card.suit === "Swords")) {
      combinationNotes.push(
        locale === "en"
          ? "The High Priestess alongside Swords suggests that quiet stillness and composure will resolve tension far better than arguing."
          : "Khi The High Priestess đứng cạnh nhóm Kiếm, sự điềm tĩnh và giữ khoảng lặng nội tâm sẽ giúp bạn hóa giải căng thẳng hiệu quả hơn mọi cuộc tranh luận."
      );
    }
  }

  // Build contextual card-by-card reader narrative (NOT raw textbook dump)
  const cardReadings: CardContextualReading[] = drawnCards.map((item, idx) => {
    const posLabel = getLocalizedPositionLabel(
      spread.id,
      idx,
      locale,
      item.position.label
    );
    const localized = getCardLocalized(item.card, locale);
    const topicMeaning = localized.topics[topic.id][item.orientation];
    const kws = localized.keywords[item.orientation].slice(0, 3).join(", ");
    const dirText =
      locale === "en"
        ? item.orientation
        : item.orientation === "upright"
        ? "chiều xuôi"
        : "chiều ngược";

    const transitionNote =
      idx === 0
        ? locale === "en"
          ? `Opens the reading as the root influence for "${posLabel}".`
          : `Đóng vai trò nền tảng mở đầu cho mạch trải bài ở vị trí "${posLabel}".`
        : describeTransition(drawnCards[idx - 1], item, locale);

    let contextualReading = "";
    if (locale === "en") {
      if (idx === 0) {
        contextualReading = `In "${posLabel}", ${item.card.name} (${dirText}) explains what set the stage: ${topicMeaning} Its core pulse (${kws}) is the backdrop shaping how you feel about this ${topicLabel.toLowerCase()} situation.`;
      } else if (idx === 1) {
        contextualReading = `At the heart of "${posLabel}", ${item.card.name} (${dirText}) pinpoints what is actively unfolding right now: ${topicMeaning} Pay close attention to "${localized.keywords[item.orientation][0]}"—this is the pivot point you can actually influence today.`;
      } else {
        contextualReading = `Looking toward "${posLabel}", ${item.card.name} (${dirText}) shows where this trajectory naturally leads—and what stance serves you best: ${topicMeaning}`;
      }
    } else {
      if (idx === 0) {
        contextualReading = `Ở vị trí "${posLabel}", sự xuất hiện của ${item.card.name} (${dirText}) cho thấy gốc rễ tạo nên hoàn cảnh hiện tại: ${topicMeaning} Những từ khóa cốt lõi (${kws}) chính là nền năng lượng đã dẫn dắt câu chuyện ${topicLabel.toLowerCase()} của bạn đến ngày hôm nay.`;
      } else if (idx === 1) {
        contextualReading = `Bước vào trọng tâm "${posLabel}", ${item.card.name} (${dirText}) phản ánh đúng điều đang diễn ra lúc này: ${topicMeaning} Điểm mấu chốt bạn cần nắm lấy ngay hôm nay xoay quanh "${localized.keywords[item.orientation][0]}".`;
      } else {
        contextualReading = `Khép lại ở vị trí "${posLabel}", ${item.card.name} (${dirText}) mở ra hướng đi và lời khuyên sát nhất cho bước kế tiếp: ${topicMeaning}`;
      }
    }

    return {
      cardId: item.card.id,
      positionLabel: posLabel,
      contextualReading,
      transitionNote,
    };
  });

  const [first, second, third] = drawnCards;
  const p1Label = first
    ? getLocalizedPositionLabel(spread.id, 0, locale, first.position.label)
    : "";
  const p2Label = second
    ? getLocalizedPositionLabel(spread.id, 1, locale, second.position.label)
    : "";
  const p3Label = third
    ? getLocalizedPositionLabel(spread.id, 2, locale, third.position.label)
    : "";

  const openingFraming =
    locale === "en"
      ? trimmedQ
        ? `Reading for your question: "${trimmedQ}" — using the ${spreadName} spread under ${topicLabel}.`
        : `Reading under ${topicLabel} using the ${spreadName} spread.`
      : trimmedQ
      ? `Luận giải dành riêng cho băn khoăn của bạn: "${trimmedQ}" — qua sơ đồ ${spreadName} (${topicLabel}).`
      : `Luận giải tổng thể cho chủ đề ${topicLabel} theo sơ đồ ${spreadName}.`;

  const storyArc =
    first && second && third
      ? locale === "en"
        ? `Here is how your three cards speak as one connected story: your situation begins at "${p1Label}" with ${first.card.name} (${first.orientation}), which carried you straight into the present crossroads of "${p2Label}" (${second.card.name}, ${second.orientation}). ${describeTransition(first, second, "en")} From here, "${p3Label}" responds with ${third.card.name} (${third.orientation})—showing that the healthiest outcome unfolds when you honor "${getCardLocalized(third.card, "en").keywords[third.orientation][0]}" rather than repeating old momentum.`
        : `Nếu ghép cả 3 lá thành một mạch chuyện liền mạch: mọi việc bắt nguồn từ "${p1Label}" với năng lượng của ${first.card.name} (${first.orientation === "upright" ? "xuôi" : "ngược"}), dẫn trực tiếp tới nút trọng tâm tại "${p2Label}" là ${second.card.name} (${second.orientation === "upright" ? "xuôi" : "ngược"}). ${describeTransition(first, second, "vi")} Từ nền này, vị trí "${p3Label}" trả lời bằng ${third.card.name} (${third.orientation === "upright" ? "xuôi" : "ngược"})—nhắn nhủ rằng hướng đi sáng nhất cho bạn lúc này là chủ động nuôi dưỡng tinh thần "${getCardLocalized(third.card, "vi").keywords[third.orientation][0]}" thay vì để quán tính cũ chi phối.`
      : "";

  const actionSteps =
    first && second && third
      ? locale === "en"
        ? [
            `Acknowledge the root (${p1Label} · ${first.card.name}): recognize how "${getCardLocalized(first.card, "en").keywords[first.orientation][0]}" already shaped your current mindset.`,
            `Adjust the pivot (${p2Label} · ${second.card.name}): ${
              second.orientation === "reversed"
                ? `slow down and clear the block around "${getCardLocalized(second.card, "en").keywords.reversed[0]}" before forcing an answer.`
                : `lean directly into "${getCardLocalized(second.card, "en").keywords.upright[0]}" with one concrete conversation or decision this week.`
            }`,
            `Step toward the outcome (${p3Label} · ${third.card.name}): let "${getCardLocalized(third.card, "en").keywords[third.orientation][0]}" guide your next practical choice in ${topicLabel.toLowerCase()}.`,
          ]
        : [
            `Nhìn rõ gốc rễ (${p1Label} · ${first.card.name}): thừa nhận cách yếu tố "${getCardLocalized(first.card, "vi").keywords[first.orientation][0]}" đã ảnh hưởng tới tâm lý và lựa chọn của bạn thời gian qua.`,
            `Xử lý đúng điểm nút (${p2Label} · ${second.card.name}): ${
              second.orientation === "reversed"
                ? `đừng vội ép kết quả—hãy dành thời gian gỡ bỏ sự trì trệ/vướng mắc quanh "${getCardLocalized(second.card, "vi").keywords.reversed[0]}" trước.`
                : `tận dụng ngay nguồn lực "${getCardLocalized(second.card, "vi").keywords.upright[0]}" bằng một hành động hoặc cuộc trao đổi thẳng thắn trong tuần này.`
            }`,
            `Chốt hướng đi thực tế (${p3Label} · ${third.card.name}): lấy tinh thần "${getCardLocalized(third.card, "vi").keywords[third.orientation][0]}" làm kim chỉ nam cho quyết định tiếp theo về ${topicLabel.toLowerCase()}.`,
          ]
      : [];

  const headline =
    first && third
      ? locale === "en"
        ? `From ${first.card.name} toward ${third.card.name}`
        : `Hành trình từ ${first.card.name} đến ${third.card.name}`
      : spreadName;

  const reflectionPrompts = drawnCards.map((d, idx) => {
    const pos = getLocalizedPositionLabel(spread.id, idx, locale, d.position.label);
    const kw = getCardLocalized(d.card, locale).keywords[d.orientation][0];
    return locale === "en"
      ? `How is "${kw}" (${d.card.name}) showing up in your ${pos.toLowerCase()} right now?`
      : `Từ khóa "${kw}" của ${d.card.name} đang phản ánh điều gì trong "${pos}" của bạn lúc này?`;
  });

  return {
    headline,
    openingFraming,
    storyArc,
    elementalInterplay,
    arcanaBalance,
    orientationTone,
    cardReadings,
    actionSteps,
    pdfSignals,
    combinationNotes,
    reflectionPrompts,
  };
}
