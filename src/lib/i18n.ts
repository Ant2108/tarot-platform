import type { Locale } from "@/store/locale-store";
import type { TarotTopicId } from "@/types/tarot";

export const UI_TEXT = {
  vi: {
    nav: {
      home: "Không Gian",
      reading: "Trải Bài 3D",
      library: "Thư Viện 78 Lá",
      cta: "Bắt Đầu Xem Bài",
    },
    footer: {
      tagline:
        "Nền tảng Tarot Rider-Waite-Smith 3D thuần Frontend kèm thư viện tra cứu 78 lá bài. Mọi lượt trải bài chạy trực tiếp trên trình duyệt và lưu lịch sử cục bộ.",
      explore: "Khám Phá",
      sanctuary: "Trang Chủ",
      reading: "Trải Bài 3 Lá 3D",
      library: "Thư Viện 78 Lá Bài",
      attributionTitle: "Nguồn Dữ Liệu",
      attributionBody:
        "Hình ảnh dựa trên bộ bài Rider-Waite-Smith 1909 (Public Domain). Kiến thức giải bài tiếng Việt được trích xuất và chuẩn hóa từ 2 tài liệu PDF kèm số trang tham chiếu minh bạch.",
      bottomLeft: "Kiến Trúc Thuần Frontend · Không Backend · Không Theo Dõi",
      bottomRight: "Xây dựng với Next.js, Three.js, React Three Fiber & GSAP",
    },
    landing: {
      badge: "Rider-Waite-Smith 1909 · Phiên Bản 3D",
      heroTitle1: "Lắng Lại Tâm Trí.",
      heroTitle2: "Lắng Nghe Thông Điệp Tarot.",
      heroDesc:
        "Không gian trải bài 3 lá 3D chân thực kết hợp thư viện học thuật đầy đủ 78 lá—luận giải có logic theo đúng hoàn cảnh và câu hỏi của bạn.",
      startReading: "Bắt Đầu Trải Bài",
      exploreLibrary: "Khám Phá Thư Viện 78 Lá",
      sec1Label: "I · Tinh Thần Tarot",
      sec1Title: "Tấm Gương Phản Chiếu, Không Phải Bản Án Định Mệnh",
      sec1P1:
        "Ra đời năm 1909 qua sự kết hợp giữa Pamela Colman Smith và Arthur Edward Waite, bộ bài Rider-Waite-Smith mang đến hình ảnh biểu tượng sống động cho trọn bộ 78 lá Ẩn Chính và Ẩn Phụ.",
      sec1P2:
        "Vespera Tarot kết hợp trải nghiệm rút bài 3D trực quan với phương pháp luận giải theo mạch câu chuyện (Quá khứ → Hiện tại → Định hướng), giúp bạn nhìn rõ vấn đề và bước đi thực tế.",
      sec2Label: "II · Nghi Thức Trải Bài 3 Lá",
      sec2Title: "Quy Trình Giải Bài Tự Nhiên Như Reader Thật",
      steps: [
        {
          step: "01",
          title: "Đặt Câu Hỏi & Chọn Chủ Đề",
          description:
            "Chọn 1 trong 10 chủ đề (Tình yêu, Công việc, Học tập & Thi cử, Tài chính, Sức khỏe, Check năng lượng...) hoặc bốc nhanh ngay theo đúng câu hỏi riêng của bạn.",
        },
        {
          step: "02",
          title: "Xào & Rút 3 Lá 3D / 2D",
          description:
            "Tập trung vào điều đang băn khoăn khi xào bộ bài 78 lá bo góc cổ điển, rút 3 lá theo trực giác với chiều xuôi/ngược tự nhiên và chuyển đổi linh hoạt giữa bàn 3D hoặc 2D.",
        },
        {
          step: "03",
          title: "Luận Giải AI & Hỏi Đáp Sâu",
          description:
            "Nhận bài luận giải 6 phần kết nối trọn vẹn 3 lá bài cùng AI Tarot Reader theo thời gian thực (hoặc chế độ giải cục bộ), kèm khung hỏi đáp ngắn gọn đúng trọng tâm.",
        },
      ],
      sec3Label: "III · Các Lá Ẩn Chính Tiêu Biểu",
      sec3Title: "Lá Bài Nổi Bật",
      viewAll: "Xem Đủ 78 Lá",
      ctaBadge: "Kho Tri Thức · 22 Ẩn Chính · 56 Ẩn Phụ",
      ctaTitle: "Dành Cho Cả Người Mới Lẫn Người Nghiên Cứu Tarot",
      ctaDesc:
        "Tìm kiếm nhanh 78 lá theo tên hoặc từ khóa, lọc theo Bộ Ẩn, Chất bài và Chủ đề, so sánh chiều xuôi/ngược và xoay xem mô hình 3D từng lá khi cần.",
      openLibrary: "Mở Thư Viện",
      drawThree: "Rút 3 Lá Ngay",
    },
    reading: {
      eyebrow: "Không Gian Trải Bài 3D",
      title: "Trải Bài Tarot 3 Lá",
      history: "Lịch Sử",
      newReading: "Trải Bài Mới",
      steps: [
        "1. Chủ Đề",
        "2. Sơ Đồ",
        "3. Xào Bài",
        "4. Chọn 3 Lá",
        "5. Lật Bài",
        "6. Luận Giải",
      ],
      savedHistory: "Lịch Sử Trải Bài Cục Bộ",
      clearHistory: "Xóa Lịch Sử",
      noHistory:
        "Các lượt trải bài hoàn tất sẽ tự động lưu ngay trên trình duyệt để bạn xem lại bất cứ lúc nào.",
      chooseTopicTitle: "Chọn Chủ Đề & Chia Sẻ Hoàn Cảnh",
      chooseTopicDesc:
        "Mỗi chủ đề sẽ thiết lập vị trí 3 lá bài phù hợp. Nhập thêm câu hỏi hoặc bối cảnh cụ thể để phần luận giải bám sát thực tế của bạn nhất.",
      questionLabel: "Câu hỏi hoặc hoàn cảnh hiện tại của bạn (khuyến khích)",
      questionPlaceholder:
        "Ví dụ: Mình đang phân vân có nên chuyển sang công ty mới tháng tới không? Hoặc: Mối quan hệ hiện tại hơi lạnh nhạt, mình nên làm gì?",
      selected: "Đã chọn",
      nextSpread: "Chọn Sơ Đồ 3 Lá",
      chooseSpreadTitle: "Chọn Sơ Đồ Trải 3 Lá",
      backToTopics: "Quay Lại Chủ Đề",
      proceedDeck: "Tới Bàn Xào Bài 3D",
      cardSlot: "Lá",
      shuffleTitle: "Xào Bộ Bài 78 Lá",
      shuffleDescPrefix: "Giữ câu hỏi trong tâm trí cho chủ đề",
      shuffledCount: "Đã xào",
      times: "lần",
      shuffleAgain: "Xào Lại",
      shuffling: "Đang xào...",
      fanDeck: "Dàn Bài & Chọn 3 Lá",
      selectMorePrefix: "Hãy chọn thêm",
      selectMoreSuffix: "lá từ vòng cung 3D",
      selectHint: "Nhấn vào lá bài bạn cảm thấy thu hút nhất. Vị trí tiếp theo:",
      revealTitle: "Lật Mở 3 Lá Bài Của Bạn",
      revealDesc:
        "Nhấn trực tiếp vào từng lá trên bàn 3D để lật mở và xem chiều xuôi/ngược, hoặc nhấn Lật Tất Cả.",
      revealAll: "Lật Tất Cả",
      switchTo3D: "Chuyển sang 3D",
      mode2D: "Chế độ 2D",
    },
    interpretation: {
      readerEyebrow: "Phân Tích Từ Tarot Reader",
      verifiedBadge: "Dựa Trên Tài Liệu PDF Chuẩn Hóa",
      yourQuestion: "Hoàn cảnh / Câu hỏi của bạn",
      storyFlow: "Mạch Câu Chuyện 3 Lá Bài",
      elementalInterplay: "Tương Tác Nguyên Tố & Năng Lượng",
      actionPlan: "3 Gợi Ý Hành Động Thực Tế",
      arcanaBalance: "Cân Bằng Ẩn Chính / Ẩn Phụ",
      orientationFlow: "Chiều Xuôi / Ngược",
      spreadSignals: "Tín Hiệu Cấu Trúc Trải Bài (Tài Liệu 2, pg. 17)",
      combos: "Cặp Lá Kết Hợp Đặc Biệt",
      contextualMeaning: "Ý nghĩa trong hoàn cảnh này",
      topicLens: "Góc nhìn",
      generalRef: "Tài liệu tham chiếu gốc",
      openStudy: "Xem Trang Chi Tiết Lá Bài",
      upright: "Xuôi",
      reversed: "Ngược",
      sourcePrefix: "Nguồn:",
    },
    chat: {
      contextTitle: "Ngữ Cảnh Trải Bài",
      offlineBadge: "Trợ Lý Cục Bộ",
      topicSpread: "Chủ Đề & Sơ Đồ",
      selectedCards: "3 Lá Đã Rút",
      dialogueTitle: "Hỏi Đáp Sâu Về Trải Bài",
      clear: "Xóa",
      emptyTitle: "Đào Sâu Thông Điệp Trải Bài",
      emptyDesc:
        "Hỏi thêm về lý do 2 lá đi cùng nhau, cách áp dụng vào hoàn cảnh thực tế, hoặc lời khuyên cụ thể cho bước tiếp theo.",
      thinking: "Đang phân tích liên kết 3 lá bài...",
      placeholder:
        "Hỏi về lá bài cụ thể, mối liên kết giữa 3 lá, hay bước hành động tiếp theo...",
    },
    library: {
      eyebrow: "Tài Liệu Tra Cứu 78 Lá",
      title: "Thư Viện Tarot",
      desc: "Trọn bộ 78 lá Rider-Waite-Smith gồm 22 Ẩn Chính và 56 Ẩn Phụ (Wands, Cups, Swords, Pentacles). Duyệt nhanh bằng ảnh 2D, hỗ trợ xoay xem 3D ở từng trang chi tiết.",
      upright: "Chiều Xuôi",
      reversed: "Chiều Ngược",
      searchPlaceholder: "Tìm theo tên lá bài hoặc từ khóa...",
      all: "Tất cả (78)",
      major: "Ẩn Chính (22)",
      minor: "Ẩn Phụ (56)",
      showing: "Hiển thị",
      reset: "Đặt lại",
      suitLabel: "Bộ Ẩn Phụ:",
      allSuits: "Tất cả",
      topicLens: "Chủ đề xem nhanh:",
      emptyTitle: "Không tìm thấy lá bài phù hợp.",
      emptyDesc: "Hãy thử xóa từ khóa hoặc đặt lại bộ lọc.",
      resetAll: "Đặt Lại Bộ Lọc",
      backToLibrary: "Quay Lại Thư Viện 78 Lá",
      drawReading: "Trải Bài 3 Lá",
      inspect3D: "Xoay Xem Lá Bài 3D",
      return2D: "Quay Về Ảnh 2D",
      arcana: "Bộ Ẩn",
      number: "Số Thứ Tự",
      suit: "Chất Bài",
      element: "Nguyên Tố",
      astrology: "Chiêm Tinh / Tương Ứng",
      uprightTab: "Ý Nghĩa Chiều Xuôi",
      reversedTab: "Ý Nghĩa Chiều Ngược",
      uprightEssence: "Tổng Quan Chiều Xuôi",
      reversedEssence: "Tổng Quan Chiều Ngược",
      ppfTitle: "Quá Khứ · Hiện Tại · Tương Lai",
      combosTitle: "Kết Hợp Với Các Lá Khác",
      sourcesTitle: "Nguồn Tài Liệu PDF & Số Trang Tham Chiếu",
      sourceNote:
        "Nội dung trích xuất nguyên bản và phần diễn giải chuẩn hóa được tách thành hai lớp JSON riêng biệt.",
    },
  },
  en: {
    nav: {
      home: "Sanctuary",
      reading: "Tarot Reading",
      library: "78-Card Library",
      cta: "Begin Reading",
    },
    footer: {
      tagline:
        "A strictly frontend-only 3D Rider-Waite-Smith Tarot sanctuary and 78-card study archive. All readings run locally in your browser with optional localStorage history.",
      explore: "Explore",
      sanctuary: "Celestial Sanctuary",
      reading: "Three-Card 3D Reading",
      library: "Complete 78-Card Library",
      attributionTitle: "Data & Attribution",
      attributionBody:
        "Artwork based on the 1909 public-domain Rider-Waite-Smith deck by Pamela Colman Smith. Vietnamese interpretations are verified from the imported PDF guides with explicit page citations.",
      bottomLeft: "Static Frontend Architecture · Zero Backend · Zero Tracking",
      bottomRight: "Built with Next.js, Three.js, React Three Fiber & GSAP",
    },
    landing: {
      badge: "1909 Rider-Waite-Smith · 3D Edition",
      heroTitle1: "Quiet the Noise.",
      heroTitle2: "Consult the Arcana.",
      heroDesc:
        "A celestial editorial sanctuary for contextual three-card 3D Tarot readings and deep study of all 78 archetypes—sculpted in Blender and running entirely in your browser.",
      startReading: "Start Your Reading",
      exploreLibrary: "Explore 78-Card Library",
      sec1Label: "I · The Editorial Tradition",
      sec1Title: "A Mirror of Symbols, Not a Script of Fate",
      sec1P1:
        "First published in 1909 through the collaboration of Pamela Colman Smith and Arthur Edward Waite, the Rider-Waite-Smith deck gave every card—including all 56 Minor Arcana—its own narrative scene.",
      sec1P2:
        "Vespera Tarot unites an unhurried 3D reading table with contextual narrative synthesis—connecting your real situation across all three cards rather than dumping textbook snippets.",
      sec2Label: "II · The Three-Card Ritual",
      sec2Title: "How Your Reading Unfolds",
      steps: [
        {
          step: "01",
          title: "Ask & Choose Your Focus",
          description:
            "Pick from 10 tailored topics (Love, Career, Study & Exams, Finance, Wellness, Daily Energy Check...) or draw directly around your own open question.",
        },
        {
          step: "02",
          title: "Shuffle & Draw in 3D or 2D",
          description:
            "Shuffle the classic 78-card deck and intuitively draw three cards with natural upright or reversed orientations, switching seamlessly between crisp 3D and quick 2D views.",
        },
        {
          step: "03",
          title: "AI Tarot Reading & Follow-Up Chat",
          description:
            "Receive a live 6-part synthesis connecting all three cards from your AI Tarot Reader (or offline mode), plus focused follow-up Q&A tailored to your situation.",
        },
      ],
      sec3Label: "III · Major Archetypes",
      sec3Title: "Featured Tarot Cards",
      viewAll: "View All 78 Cards",
      ctaBadge: "Study Archive · 22 Major · 56 Minor",
      ctaTitle: "Built for Both Seekers and Experienced Readers",
      ctaDesc:
        "Search all 78 cards by name or keyword, filter by Arcana, Suit, and Topic, toggle upright and reversed interpretations, and inspect any card in 3D on demand.",
      openLibrary: "Open Library",
      drawThree: "Draw Three Cards",
    },
    reading: {
      eyebrow: "Interactive 3D Sanctuary",
      title: "Three-Card Tarot Reading",
      history: "History",
      newReading: "New Reading",
      steps: [
        "1. Topic",
        "2. Spread",
        "3. Shuffle",
        "4. Select 3",
        "5. Reveal",
        "6. Reading",
      ],
      savedHistory: "Saved Local Reading History",
      clearHistory: "Clear History",
      noHistory:
        "Completed readings are saved locally in your browser. Complete a reading to record it here.",
      chooseTopicTitle: "Select Topic & Share Your Context",
      chooseTopicDesc:
        "Each topic configures tailored three-card positions. Add your specific question or situation so the interpretation reads like a real session.",
      questionLabel: "Your question or current situation (recommended)",
      questionPlaceholder:
        "e.g., I'm deciding whether to switch jobs next month, or: Our relationship feels distant lately—what should I focus on?",
      selected: "Selected",
      nextSpread: "Choose Three-Card Spread",
      chooseSpreadTitle: "Choose a Three-Card Spread",
      backToTopics: "Back to Topics",
      proceedDeck: "Proceed to 3D Deck",
      cardSlot: "Card",
      shuffleTitle: "Shuffle the 78-Card Deck",
      shuffleDescPrefix: "Hold your question in mind for",
      shuffledCount: "Shuffled",
      times: "times",
      shuffleAgain: "Shuffle Again",
      shuffling: "Shuffling...",
      fanDeck: "Fan Deck & Select 3 Cards",
      selectMorePrefix: "Select",
      selectMoreSuffix: "more card(s) from the 3D arc",
      selectHint: "Click any card that draws your attention. Next position:",
      revealTitle: "Turn Your Three Cards",
      revealDesc:
        "Click each 3D card on the table to reveal its archetype and orientation, or reveal all three together.",
      revealAll: "Reveal All",
      switchTo3D: "Switch to 3D",
      mode2D: "2D Mode",
    },
    interpretation: {
      readerEyebrow: "Contextual Reader Interpretation",
      verifiedBadge: "Grounded in Verified PDF Sources",
      yourQuestion: "Your Question / Situation",
      storyFlow: "Connected Three-Card Narrative",
      elementalInterplay: "Elemental & Energetic Interplay",
      actionPlan: "3 Practical Next Steps",
      arcanaBalance: "Arcana Balance",
      orientationFlow: "Orientation Flow",
      spreadSignals: "Spread Structure Signals (PDF 2, pg. 17)",
      combos: "Notable Card Combinations",
      contextualMeaning: "In Your Situation",
      topicLens: "Lens",
      generalRef: "Source Reference",
      openStudy: "Open Card Study Page",
      upright: "Upright",
      reversed: "Reversed",
      sourcePrefix: "Source:",
    },
    chat: {
      contextTitle: "Reading Context",
      offlineBadge: "Local Guide",
      topicSpread: "Topic & Spread",
      selectedCards: "Selected Cards",
      dialogueTitle: "Tarot Reflection Dialogue",
      clear: "Clear",
      emptyTitle: "Explore Your Spread Deeper",
      emptyDesc:
        "Ask how two cards interact, what a reversed card means in your exact situation, or what practical step to take next.",
      thinking: "Synthesizing your three-card spread...",
      placeholder:
        "Ask about a card, how the cards connect, or your next practical step...",
    },
    library: {
      eyebrow: "78-Card Study Reference",
      title: "Tarot Library",
      desc: "Complete Rider-Waite-Smith archive: 22 Major Arcana and 56 Minor Arcana across Wands, Cups, Swords, and Pentacles. Fast 2D browsing with on-demand 3D inspection.",
      upright: "Upright",
      reversed: "Reversed",
      searchPlaceholder: "Search card name or keyword...",
      all: "All (78)",
      major: "Major (22)",
      minor: "Minor (56)",
      showing: "Showing",
      reset: "Reset",
      suitLabel: "Suit:",
      allSuits: "All Suits",
      topicLens: "Topic Lens:",
      emptyTitle: "No cards match your current filters.",
      emptyDesc: "Try clearing your search keyword or resetting filters.",
      resetAll: "Reset All Filters",
      backToLibrary: "Back to 78-Card Library",
      drawReading: "Draw Three-Card Reading",
      inspect3D: "Inspect 3D Card",
      return2D: "Return to 2D Scan",
      arcana: "Arcana",
      number: "Number",
      suit: "Suit",
      element: "Element",
      astrology: "Astrology / Correspondence",
      uprightTab: "Upright Meaning",
      reversedTab: "Reversed Meaning",
      uprightEssence: "Upright Essence",
      reversedEssence: "Reversed Essence",
      ppfTitle: "Past · Present · Future",
      combosTitle: "Card Combinations",
      sourcesTitle: "Original PDF Source & Page References",
      sourceNote:
        "Extracted source excerpts and normalized interpretations are maintained in separate JSON layers.",
    },
  },
} as const;

export const TOPIC_LABELS_VI: Record<
  TarotTopicId,
  { label: string; shortLabel: string; description: string }
> = {
  love: {
    label: "Tình Yêu & Mối Quan Hệ",
    shortLabel: "Tình Yêu",
    description:
      "Soi chiếu dòng cảm xúc, sự gắn kết và những điều còn ẩn giấu giữa hai người.",
  },
  career: {
    label: "Công Việc & Sự Nghiệp",
    shortLabel: "Công Việc",
    description:
      "Làm rõ định hướng nghề nghiệp, thách thức hiện tại và cơ hội bứt phá phía trước.",
  },
  family: {
    label: "Gia Đình & Tổ Ấm",
    shortLabel: "Gia Đình",
    description:
      "Thấu hiểu hòa khí gia đình, nguyên nhân gốc rễ của căng thẳng và hướng hóa giải.",
  },
  finance: {
    label: "Tài Chính & Tiền Bạc",
    shortLabel: "Tài Chính",
    description:
      "Đánh giá dòng tiền, thói quen chi tiêu, rủi ro tiềm ẩn và chiến lược tích lũy bền vững.",
  },
  personalGrowth: {
    label: "Sức Khỏe & Phát Triển Bản Thân",
    shortLabel: "Bản Thân",
    description:
      "Quay vào nội tâm để nhận diện giới hạn cũ, chăm sóc sức khỏe tinh thần và chuyển hóa.",
  },
  general: {
    label: "Tổng Quan Cuộc Sống",
    shortLabel: "Tổng Quan",
    description:
      "Bức tranh toàn cảnh về giai đoạn hiện tại, điểm nghẽn và thông điệp dẫn lối.",
  },
  customQuestion: {
    label: "Hỏi Tự Do Theo Câu Hỏi",
    shortLabel: "Câu Hỏi Riêng",
    description:
      "Bốc bài tập trung thẳng vào đúng câu hỏi của bạn mà không cần gò bó theo chủ đề cố định.",
  },
  energyCheck: {
    label: "Check Năng Lượng Hôm Nay",
    shortLabel: "Năng Lượng",
    description:
      "Bốc nhanh 3 lá để kiểm tra dòng năng lượng hiện tại, điều đang gây cản trở và thông điệp cân bằng.",
  },
  study: {
    label: "Học Tập & Thi Cử",
    shortLabel: "Học Tập",
    description:
      "Soi chiếu mức độ sẵn sàng trước kỳ thi, điểm cần tập trung ôn luyện và chiến lược đạt kết quả tốt.",
  },
  health: {
    label: "Sức Khỏe & Tinh Thần",
    shortLabel: "Tinh Thần",
    description:
      "Lắng nghe trạng thái thân–tâm, nhận diện nguồn gốc mệt mỏi và cách nghỉ ngơi, chữa lành nhẹ nhàng.",
  },
};

export const SPREAD_LABELS_VI: Record<
  string,
  { name: string; description: string; positions: [string, string, string] }
> = {
  "love-timeline": {
    name: "Mạch Chảy Tình Cảm",
    description:
      "Nhìn rõ dấu ấn quá khứ, trạng thái hiện tại và xu hướng sắp tới của mối quan hệ.",
    positions: ["Quá Khứ", "Hiện Tại", "Tương Lai"],
  },
  "love-mirror": {
    name: "Tấm Gương Hai Trái Tim",
    description:
      "Đối chiếu năng lượng của bạn, năng lượng của đối phương và hướng vun đắp chung.",
    positions: ["Năng Lượng Của Bạn", "Năng Lượng Đối Phương", "Hướng Đi Chung"],
  },
  "career-compass": {
    name: "La Bàn Sự Nghiệp",
    description:
      "Đánh giá tình hình công việc hiện tại, thách thức lớn nhất và cơ hội đang mở ra.",
    positions: ["Tình Hình Hiện Tại", "Thách Thức", "Cơ Hội"],
  },
  "career-craft": {
    name: "Thế Mạnh & Bước Đi Tiếp Theo",
    description:
      "Xác định lợi thế cốt lõi, điểm mù cần tránh và hành động chiến lược tiếp theo.",
    positions: ["Thế Mạnh Cốt Lõi", "Điểm Mù", "Hành Động Gợi Ý"],
  },
  "family-roots": {
    name: "Cội Nguồn & Hóa Giải",
    description:
      "Nhận diện vấn đề bề nổi, nguyên nhân sâu xa và lời khuyên giữ gìn hòa khí gia đình.",
    positions: ["Vấn Đề Hiện Tại", "Nguyên Nhân Gốc", "Lời Khuyên"],
  },
  "family-sanctuary": {
    name: "Cân Bằng Tổ Ấm",
    description:
      "Điểm tựa gắn kết gia đình, điều cần được lắng nghe và không khí thời gian tới.",
    positions: ["Điểm Tựa Chung", "Điều Cần Chăm Sóc", "Giai Đoạn Tới"],
  },
  "finance-flow": {
    name: "Dòng Chảy Tài Chính",
    description:
      "Nhìn rõ nguồn lực hiện có, điểm rò rỉ tài chính và hướng quản lý sinh lời an toàn.",
    positions: ["Nguồn Lực Hiện Tại", "Điểm Nghẽn Tiền Bạc", "Hướng Thịnh Vượng"],
  },
  "finance-harvest": {
    name: "Gieo Hạt & Thu Hoạch",
    description:
      "Phân biệt khoản cần bảo toàn, nơi nên đầu tư công sức/vốn và thành quả dài hạn.",
    positions: ["Cần Bảo Toàn", "Nên Đầu Tư", "Thành Quả Dài Hạn"],
  },
  "growth-alchemy": {
    name: "Chuyển Hóa Nội Tâm",
    description:
      "Nhận diện khuôn mẫu cũ đang kìm hãm, chất xúc tác thay đổi và phiên bản mới của bạn.",
    positions: ["Bóng Tối / Giới Hạn", "Chất Xúc Tác", "Sự Chuyển Hóa"],
  },
  "growth-clarity": {
    name: "Tâm Trí · Trái Tim · Hành Động",
    description:
      "Đồng bộ hóa suy nghĩ, cảm xúc trực giác và bước thực hành cụ thể mỗi ngày.",
    positions: ["Tâm Trí", "Trái Tim", "Bước Thực Hành"],
  },
  "general-triad": {
    name: "Bộ Ba Thiên Thể",
    description:
      "Trải bài 3 lá kinh điển soi sáng ảnh hưởng vừa qua, trọng tâm hiện tại và điều sắp đến.",
    positions: ["Dư Âm Quá Khứ", "Trọng Tâm Hiện Tại", "Chân Trời Sắp Tới"],
  },
  "general-synthesis": {
    name: "Tình Huống · Thử Thách · Lời Khuyên",
    description:
      "Trải bài chẩn đoán trực diện cho bất kỳ câu hỏi mở nào bạn đang quan tâm.",
    positions: ["Tình Huống", "Thử Thách", "Lời Khuyên"],
  },
  "question-focus": {
    name: "Trọng Tâm Câu Hỏi",
    description:
      "Giải trực tiếp đúng câu hỏi của bạn: bối cảnh hiện tại, yếu tố then chốt và kết quả / lời khuyên.",
    positions: ["Bối Cảnh Hiện Tại", "Điều Cần Lưu Ý", "Kết Quả & Lời Khuyên"],
  },
  "question-decision": {
    name: "Lựa Chọn & Quyết Định",
    description:
      "So sánh hai hướng đi đang phân vân và tìm ra góc nhìn sáng suốt nhất trước khi chọn.",
    positions: ["Hướng Đi A", "Hướng Đi B", "Gợi Ý Sáng Suốt"],
  },
  "energy-pulse": {
    name: "Check Năng Lượng Hiện Tại",
    description:
      "Bắt nhịp nhanh năng lượng chủ đạo hôm nay, điều làm bạn hao sức và thông điệp cân bằng.",
    positions: ["Năng Lượng Chủ Đạo", "Điều Đang Cản Trở", "Thông Điệp Cân Bằng"],
  },
  "energy-week": {
    name: "Nhịp Năng Lượng Tuần Tới",
    description:
      "Nhìn trước làn sóng mở đầu, điểm nhấn giữa tuần và tâm thế vững vàng nên giữ.",
    positions: ["Khởi Đầu Tuần", "Điểm Nhấn", "Điều Cần Giữ Vững"],
  },
  "study-exam": {
    name: "Ôn Tập & Thi Cử",
    description:
      "Đánh giá nền tảng ôn luyện hiện tại, rủi ro tâm lý cần tránh và chiến lược làm bài tốt.",
    positions: ["Nền Tảng Hiện Tại", "Thử Thách Cần Tránh", "Kết Quả & Chiến Lược"],
  },
  "study-path": {
    name: "Định Hướng Học Tập",
    description:
      "Nhận diện thế mạnh tiếp thu, lỗ hổng cần bổ sung và bước tiến tiếp theo.",
    positions: ["Thế Mạnh", "Lỗ Hổng Cần Bù", "Bước Đi Tiếp Theo"],
  },
  "health-balance": {
    name: "Cân Bằng Thân – Tâm",
    description:
      "Kiểm tra trạng thái sinh lực, nguyên nhân mệt mỏi ẩn sâu và cách hồi phục phù hợp.",
    positions: ["Trạng Thái Năng Lượng", "Nguồn Gốc Mệt Mỏi", "Cách Chữa Lành"],
  },
  "health-reset": {
    name: "Nghỉ Ngơi & Tái Tạo",
    description:
      "Nhận ra áp lực nên buông xuống, điều cần nuôi dưỡng và nhịp sống lành mạnh hơn.",
    positions: ["Điều Cần Buông", "Điều Cần Nuôi Dưỡng", "Nhịp Sống Mới"],
  },
};

export function getLocalizedTopicLabel(topicId: TarotTopicId, locale: Locale, fallback: string) {
  return locale === "vi" ? TOPIC_LABELS_VI[topicId].label : fallback;
}

export function getLocalizedTopicShort(topicId: TarotTopicId, locale: Locale, fallback: string) {
  return locale === "vi" ? TOPIC_LABELS_VI[topicId].shortLabel : fallback;
}

export function getLocalizedTopicDesc(topicId: TarotTopicId, locale: Locale, fallback: string) {
  return locale === "vi" ? TOPIC_LABELS_VI[topicId].description : fallback;
}

export function getLocalizedSpreadName(spreadId: string, locale: Locale, fallback: string) {
  return locale === "vi" ? (SPREAD_LABELS_VI[spreadId]?.name ?? fallback) : fallback;
}

export function getLocalizedSpreadDesc(spreadId: string, locale: Locale, fallback: string) {
  return locale === "vi" ? (SPREAD_LABELS_VI[spreadId]?.description ?? fallback) : fallback;
}

export function getLocalizedPositionLabel(
  spreadId: string,
  index: number,
  locale: Locale,
  fallback: string
) {
  return locale === "vi"
    ? (SPREAD_LABELS_VI[spreadId]?.positions[index] ?? fallback)
    : fallback;
}
