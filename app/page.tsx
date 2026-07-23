"use client";

import { useState, useEffect } from "react";

// Типы Telegram SDK
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        sendData: (data: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
        };
      };
    };
  }
}

type ShopType = "pubg" | "freefire" | "steam" | "premium";
type EduType = "cefr" | "prava";

// ===================== ДАННЫЕ =====================

const adPartners = [
  {
    id: 1,
    title: "Uzum Market Hamkori",
    desc: "Eng tez yetkazib berish va arzon narxlar do'koni!",
    link: "https://uzum.uz",
    category: "market",
    badge: "Offline Market",
  },
];

const shopProducts: Record<ShopType, { title: string; emoji: string; placeholder: string; packs: { name: string; price: string }[] }> = {
  pubg: {
    title: "PUBG Mobile UC",
    emoji: "🔫",
    placeholder: "Player ID (masalan: 5123456789)",
    packs: [
      { name: "60 UC", price: "12,000 UZS" },
      { name: "325 UC", price: "60,000 UZS" },
      { name: "660 UC", price: "115,000 UZS" },
      { name: "1800 UC", price: "310,000 UZS" },
    ],
  },
  freefire: {
    title: "Free Fire Almazlar",
    emoji: "💎",
    placeholder: "Player ID (masalan: 78291044)",
    packs: [
      { name: "100 + 10 Almaz", price: "15,000 UZS" },
      { name: "310 + 31 Almaz", price: "42,000 UZS" },
      { name: "520 + 52 Almaz", price: "68,000 UZS" },
      { name: "1060 + 106 Almaz", price: "135,000 UZS" },
    ],
  },
  steam: {
    title: "Steam Balans",
    emoji: "🕹️",
    placeholder: "Steam Login (masalan: musa_pro)",
    packs: [
      { name: "$5 USD", price: "70,000 UZS" },
      { name: "$10 USD", price: "140,000 UZS" },
      { name: "$20 USD", price: "275,000 UZS" },
    ],
  },
  premium: {
    title: "Telegram Premium",
    emoji: "⭐",
    placeholder: "Telegram Username (masalan: @username)",
    packs: [
      { name: "3 Oy (Muddatsiz)", price: "90,000 UZS" },
      { name: "6 Oy (Muddatsiz)", price: "150,000 UZS" },
      { name: "12 Oy (Muddatsiz)", price: "270,000 UZS" },
    ],
  },
};

const mockVacancies = [
  { id: 1, title: "Next.js va WebApp dasturchi kerak", budget: "500,000 UZS", desc: "Bitta loyihasini rivojlantirish uchun tajribali dasturchi taklif etiladi.", type: "job", contact: "@bitta_mngr" },
  { id: 2, title: "SMM / Grafik Dizayner", budget: "1,200,000 UZS/oy", desc: "Kanal postlari va vizuallari bilan ishlash uchun professional.", type: "job", contact: "@bitta_mngr" },
  { id: 3, title: "UI/UX Dizayn xizmati", budget: "Kelishilgan narxda", desc: "Sizning g'oyalaringizni chiroyli va qulay interfeysga aylantirib beraman.", type: "worker", contact: "@musa_design" },
];

// ===================== ИКОНКИ =====================

const Icons = {
  Gamepad: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="3" />
    </svg>
  ),
  Diamond: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.7 10.3l9.3 9.3 9.3-9.3L12 3 2.7 10.3z" />
    </svg>
  ),
  Premium: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 17 22 7 22 2 8.5 12 2" />
    </svg>
  ),
  Steam: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zM7 16a3 3 0 1 1 3-3v1a2 2 0 1 0 4 0V9a1 1 0 1 1 2 0v5a3 3 0 0 1-6 0z" />
    </svg>
  ),
  Book: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5V4.5z" />
    </svg>
  ),
  Pravaga: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Search: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Sparkle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.9 5.9L20 10l-6.1 2.1L12 18l-1.9-5.9L4 10l6.1-2.1L12 2z" />
    </svg>
  ),
  Check: () => (
    <svg width="56" height="56" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M15 27l7 7 15-16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="bt-check-path" />
    </svg>
  ),
};

// ===================== ЦВЕТОВЫЕ ТЕМЫ =====================

const themes = {
  pink: { grad: "linear-gradient(135deg,#FF5F7E,#FF9D5C)", glow: "rgba(255,95,126,.38)" },
  gold: { grad: "linear-gradient(135deg,#FFD166,#FF9D5C)", glow: "rgba(255,209,102,.35)" },
  blue: { grad: "linear-gradient(135deg,#37CFEA,#6E6BFF)", glow: "rgba(55,207,234,.35)" },
  violet: { grad: "linear-gradient(135deg,#B98BFF,#6E6BFF)", glow: "rgba(185,139,255,.38)" },
  teal: { grad: "linear-gradient(135deg,#37E5C4,#2FA8E8)", glow: "rgba(55,229,196,.35)" },
};

const shopTheme: Record<ShopType, typeof themes.pink> = {
  pubg: themes.pink,
  freefire: themes.gold,
  steam: themes.blue,
  premium: themes.violet,
};

// ===================== КОМПОНЕНТ =====================

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // БАК 1: Маркет
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeShopType, setActiveShopType] = useState<ShopType | null>(null);
  const [shopStep, setShopStep] = useState(1); // 1 tanlash, 2 malumot, 3 tolov, 4 tayyor
  const [selectedPack, setSelectedPack] = useState<{ name: string; price: string } | null>(null);
  const [userCredential, setUserCredential] = useState("");
  const [copied, setCopied] = useState(false);

  // БАК 2: Обучение
  const [isEduOpen, setIsEduOpen] = useState(false);
  const [eduType, setEduType] = useState<EduType | null>(null);

  // БАК 3: Вакансии
  const [isVacancyOpen, setIsVacancyOpen] = useState(false);
  const [vacancyTab, setVacancyTab] = useState<"job" | "worker">("job");
  const [isCreatingVacancy, setIsCreatingVacancy] = useState(false);
  const [vacSubmitted, setVacSubmitted] = useState(false);

  const [newVacType, setNewVacType] = useState<"job" | "worker">("job");
  const [newVacTitle, setNewVacTitle] = useState("");
  const [newVacBudget, setNewVacBudget] = useState("");
  const [newVacDesc, setNewVacDesc] = useState("");
  const [newVacContact, setNewVacContact] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = () => {
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    };
    document.body.appendChild(script);
  }, []);

  // Тактильный отклик Telegram — маленькая, но приятная деталь для "живого" интерфейса
  const haptic = (type: "light" | "medium" | "success" = "light") => {
    const hf = typeof window !== "undefined" ? window.Telegram?.WebApp?.HapticFeedback : undefined;
    if (!hf) return;
    if (type === "success") hf.notificationOccurred("success");
    else hf.impactOccurred(type);
  };

  const openLinkInside = (url: string) => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const openTelegramLink = (url: string) => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const sendDataToBot = (data: object) => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.sendData) {
      window.Telegram.WebApp.sendData(JSON.stringify(data));
    } else {
      alert("Telegram Botga yuborildi:\n" + JSON.stringify(data, null, 2));
    }
  };

  const handleOpenShop = (type: ShopType) => {
    haptic("light");
    setActiveShopType(type);
    setShopStep(1);
    setSelectedPack(null);
    setUserCredential("");
    setIsShopOpen(true);
  };

  const handleSelectPack = (pack: { name: string; price: string }) => {
    haptic("light");
    setSelectedPack(pack);
    setShopStep(2);
  };

  const handleConfirmCredentials = () => {
    if (!userCredential.trim()) {
      haptic("medium");
      return;
    }
    setShopStep(3);
  };

  const handleFinishOrder = () => {
    if (!activeShopType || !selectedPack) return;
    const orderJSON = {
      action: "new_order",
      service: activeShopType,
      pack: selectedPack.name,
      price: selectedPack.price,
      credentials: userCredential,
    };
    sendDataToBot(orderJSON);
    haptic("success");
    setShopStep(4); // экран успеха с анимацией
    setTimeout(() => {
      setIsShopOpen(false);
      setShopStep(1);
      setActiveShopType(null);
      setSelectedPack(null);
      setUserCredential("");
    }, 2200);
  };

  const handleOpenEdu = (type: EduType) => {
    haptic("light");
    setEduType(type);
    setIsEduOpen(true);
  };

  const handleCreateVacancy = () => {
    if (!newVacTitle || !newVacBudget || !newVacDesc || !newVacContact) {
      haptic("medium");
      return;
    }
    const vacancyJSON = {
      action: "create_vacancy",
      type: newVacType,
      title: newVacTitle,
      budget: newVacBudget,
      desc: newVacDesc,
      contact: newVacContact,
    };
    sendDataToBot(vacancyJSON);
    haptic("success");
    setVacSubmitted(true);
    setTimeout(() => {
      setIsCreatingVacancy(false);
      setIsVacancyOpen(false);
      setVacSubmitted(false);
      setNewVacTitle("");
      setNewVacBudget("");
      setNewVacDesc("");
      setNewVacContact("");
    }, 1800);
  };

  // ===== Единый умный поиск по всему приложению (не только по рекламе) =====
  const searchCatalog = [
    { id: "g-pubg", group: "O'yin", theme: themes.pink, icon: Icons.Gamepad, title: "PUBG Mobile UC", desc: "UC hisobingizga to'ldiring", keywords: ["pubg", "uc", "oyin", "mobile"], action: () => handleOpenShop("pubg") },
    { id: "g-ff", group: "O'yin", theme: themes.gold, icon: Icons.Diamond, title: "Free Fire Almazlar", desc: "Almaz to'ldirish", keywords: ["free fire", "ff", "almaz", "diamond"], action: () => handleOpenShop("freefire") },
    { id: "g-steam", group: "O'yin", theme: themes.blue, icon: Icons.Steam, title: "Steam Balans", desc: "Hamyoningizga pul qo'shing", keywords: ["steam", "balans", "wallet"], action: () => handleOpenShop("steam") },
    { id: "g-prem", group: "Xizmat", theme: themes.violet, icon: Icons.Premium, title: "Telegram Premium", desc: "Tezkor obuna", keywords: ["premium", "telegram", "tg"], action: () => handleOpenShop("premium") },
    { id: "e-ielts", group: "Ta'lim", theme: themes.teal, icon: Icons.Book, title: "IELTS.GG", desc: "IELTS imtihoniga tayyorgarlik", keywords: ["ielts", "ingliz", "til"], action: () => openLinkInside("https://ielts.gg") },
    { id: "e-cefr", group: "Ta'lim", theme: themes.teal, icon: Icons.Book, title: "CEFR Imtihonlari", desc: "Milliy sertifikat materiallari", keywords: ["cefr", "sertifikat"], action: () => handleOpenEdu("cefr") },
    { id: "e-prava", group: "Ta'lim", theme: themes.gold, icon: Icons.Pravaga, title: "Pravaga Tayyorgarlik", desc: "YHQ va GAI testlari", keywords: ["prava", "gai", "yhq", "avtomobil"], action: () => handleOpenEdu("prava") },
    { id: "v-job", group: "Ish", theme: themes.violet, icon: Icons.Briefcase, title: "Ish topish", desc: "Bo'sh vakansiyalar", keywords: ["ish", "vakansiya", "job"], action: () => { haptic("light"); setVacancyTab("job"); setIsVacancyOpen(true); } },
    { id: "v-worker", group: "Ish", theme: themes.violet, icon: Icons.Briefcase, title: "Ishga olish", desc: "Xodimlar rezyumesi", keywords: ["xodim", "rezyume", "ishchi"], action: () => { haptic("light"); setVacancyTab("worker"); setIsVacancyOpen(true); } },
    ...adPartners.map((ad) => ({ id: `ad-${ad.id}`, group: ad.badge, theme: themes.gold, icon: Icons.Sparkle, title: ad.title, desc: ad.desc, keywords: [ad.category, ad.title.toLowerCase()], action: () => openLinkInside(ad.link) })),
  ];

  const q = searchQuery.trim().toLowerCase();
  const filteredResults = q
    ? searchCatalog.filter((item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q)))
    : [];

  const runResult = (action: () => void) => {
    action();
    setSearchQuery("");
  };

  return (
    <div style={styles.container}>
      {/* ГЛОБАЛЬНЫЕ СТИЛИ: шрифты, keyframes, hover/active-анимации */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; }
        .bt-display { font-family: 'Fredoka', 'Plus Jakarta Sans', sans-serif; }

        @keyframes bt-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes bt-pop {
          0% { opacity: 0; transform: translateY(16px) scale(0.92); }
          60% { opacity: 1; }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bt-sheetUp {
          0% { transform: translateY(100%); }
          70% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
        @keyframes bt-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bt-shine {
          0% { transform: translateX(-130%) skewX(-15deg); }
          100% { transform: translateX(230%) skewX(-15deg); }
        }
        @keyframes bt-check { to { stroke-dashoffset: 0; } }
        @keyframes bt-circlePop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes bt-wiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.05); }
          75% { transform: rotate(8deg) scale(1.05); }
        }
        @keyframes bt-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .bt-check-path { stroke-dasharray: 46; stroke-dashoffset: 46; animation: bt-check .5s .15s cubic-bezier(.65,0,.35,1) forwards; }

        .bt-blob { animation: bt-float 8s ease-in-out infinite; }

        .bt-tile, .bt-row, .bt-primary-btn, .bt-pack-card, .bt-close-btn, .bt-copy-btn, .bt-nav-item, .bt-result-card, .bt-secondary-btn, .bt-tab-btn {
          transition: transform .16s cubic-bezier(.34,1.56,.64,1), box-shadow .16s ease, border-color .16s ease, background .16s ease, opacity .16s ease;
        }
        .bt-tile:active, .bt-pack-card:active, .bt-primary-btn:active, .bt-secondary-btn:active, .bt-copy-btn:active, .bt-result-card:active, .bt-tab-btn:active { transform: scale(0.94); }
        .bt-row:active { transform: scale(0.97); }
        .bt-close-btn:active { transform: scale(0.8) rotate(90deg); }

        .bt-tile:hover { transform: translateY(-4px) rotate(-1deg); }
        .bt-tile:hover .bt-icon-badge { animation: bt-wiggle .5s ease; }
        .bt-row:hover { transform: translateX(3px); }
        .bt-row:hover .bt-arrow { transform: translateX(4px); }
        .bt-pack-card:hover { transform: translateY(-3px); }
        .bt-result-card:hover { transform: translateX(3px); }

        .bt-primary-btn { position: relative; overflow: hidden; }
        .bt-primary-btn::after {
          content: ''; position: absolute; top: 0; left: 0; width: 45%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,.4), transparent);
          transform: translateX(-130%) skewX(-15deg);
        }
        .bt-primary-btn:hover::after { animation: bt-shine 1s ease; }

        .bt-search-input:focus { box-shadow: 0 0 0 3px rgba(184,139,255,.28); }

        .bt-arrow { display: inline-flex; transition: transform .16s ease; }

        @media (prefers-reduced-motion: reduce) {
          .bt-blob, .bt-tile, .bt-row, .bt-primary-btn::after, .bt-check-path, .bt-card-in, .bt-sheet {
            animation: none !important; transition: none !important;
          }
        }
      `}</style>

      {/* ФОНОВЫЕ РАЗМЫТЫЕ ПЯТНА — задают "живое" настроение всей страницы */}
      <div style={styles.bgLayer} aria-hidden="true">
        <div className="bt-blob" style={{ ...styles.blob, width: 260, height: 260, top: -80, left: -60, background: themes.pink.grad }} />
        <div className="bt-blob" style={{ ...styles.blob, width: 220, height: 220, top: 140, right: -90, background: themes.violet.grad, animationDelay: "1.5s" }} />
        <div className="bt-blob" style={{ ...styles.blob, width: 200, height: 200, bottom: 40, left: -70, background: themes.teal.grad, animationDelay: "3s" }} />
      </div>

      <div style={styles.content}>
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.logoWrap}>
            <span className="bt-blob" style={{ ...styles.logoDot, background: themes.pink.grad, animationDuration: "5s" }}>
              <Icons.Sparkle />
            </span>
            <span className="bt-display" style={styles.logoText}>bitta</span>
          </div>

          <div style={styles.searchWrapper}>
            <div style={styles.searchIcon}><Icons.Search /></div>
            <input
              type="text"
              placeholder="Nima kerak? 🔍"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              className="bt-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn} className="bt-close-btn">✕</button>
            )}
          </div>

          <button style={styles.burgerButton} className="bt-secondary-btn" onClick={() => { haptic("light"); setIsMenuOpen(true); }}>
            <div style={styles.burgerLine}></div>
            <div style={{ ...styles.burgerLine, width: "16px" }}></div>
          </button>
        </header>

        {/* РЕЗУЛЬТАТЫ ПОИСКА */}
        {q !== "" ? (
          <div style={styles.resultsSection} className="bt-card-in">
            <div style={styles.resultsHeader}>Qidiruv natijalari</div>
            {filteredResults.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredResults.map((item) => (
                  <div key={item.id} style={styles.resultCard} className="bt-result-card" onClick={() => runResult(item.action)}>
                    <div style={{ ...styles.resultIconBadge, background: item.theme.grad, boxShadow: `0 6px 16px ${item.theme.glow}` }}>
                      <item.icon />
                    </div>
                    <div style={styles.resultBody}>
                      <div style={styles.resultGroup}>{item.group}</div>
                      <div style={styles.resultTitle}>{item.title}</div>
                      <div style={styles.resultDesc}>{item.desc}</div>
                    </div>
                    <span className="bt-arrow" style={styles.arrowRight}>→</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noResults}>Hech narsa topilmadi. Boshqa so'z bilan izlab ko'ring 🤔</div>
            )}
          </div>
        ) : (
          <>
            {/* HERO — характерная сцена приложения */}
            <section style={styles.hero} className="bt-card-in">
              <div style={styles.heroBadge}><Icons.Sparkle /> Bitta ilovada — hammasi</div>
              <h1 className="bt-display" style={styles.heroTitle}>Nimadan boshlaymiz?</h1>
              <p style={styles.heroSub}>O'yiningizni to'ldiring, imtihonga tayyorlaning yoki ish toping — barchasi shu yerda, bir necha bosishda 🎉</p>
            </section>

            {/* БАК №1: МАРКЕТ И ДОНАТ */}
            <section style={styles.sectionBlock} className="bt-card-in">
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, background: "rgba(255,95,126,.14)", color: "#FF9DAF" }}>🎮 O'yin & Donat</span>
              </div>
              <div style={styles.tileGrid}>
                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("pubg")}>
                  <div className="bt-icon-badge" style={{ ...styles.tileIconBadge, background: themes.pink.grad, boxShadow: `0 8px 18px ${themes.pink.glow}` }}>
                    <Icons.Gamepad />
                  </div>
                  <span style={styles.tileTitle}>PUBG Mobile</span>
                  <span style={styles.tileSub}>UC to'ldirish</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("freefire")}>
                  <div className="bt-icon-badge" style={{ ...styles.tileIconBadge, background: themes.gold.grad, boxShadow: `0 8px 18px ${themes.gold.glow}` }}>
                    <Icons.Diamond />
                  </div>
                  <span style={styles.tileTitle}>Free Fire</span>
                  <span style={styles.tileSub}>Almazlar</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("premium")}>
                  <div className="bt-icon-badge" style={{ ...styles.tileIconBadge, background: themes.violet.grad, boxShadow: `0 8px 18px ${themes.violet.glow}` }}>
                    <Icons.Premium />
                  </div>
                  <span style={styles.tileTitle}>TG Premium</span>
                  <span style={styles.tileSub}>Tezkor obuna</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("steam")}>
                  <div className="bt-icon-badge" style={{ ...styles.tileIconBadge, background: themes.blue.grad, boxShadow: `0 8px 18px ${themes.blue.glow}` }}>
                    <Icons.Steam />
                  </div>
                  <span style={styles.tileTitle}>Steam</span>
                  <span style={styles.tileSub}>Hamyon balansi</span>
                </button>
              </div>
            </section>

            {/* БАК №2: ОБУЧЕНИЕ */}
            <section style={styles.sectionBlock} className="bt-card-in">
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, background: "rgba(55,229,196,.14)", color: "#7FF0D9" }}>📚 Ta'lim & Imtihon</span>
              </div>
              <div style={styles.rowList}>
                <button style={styles.row} className="bt-row" onClick={() => openLinkInside("https://ielts.gg")}>
                  <div className="bt-icon-badge" style={{ ...styles.rowIconBadge, background: themes.teal.grad, boxShadow: `0 6px 14px ${themes.teal.glow}` }}>
                    <Icons.Book />
                  </div>
                  <div style={styles.rowBody}>
                    <span style={styles.rowTitle}>IELTS.GG</span>
                    <span style={styles.rowSub}>Professional IELTS imtihoniga tayyorgarlik</span>
                  </div>
                  <span className="bt-arrow" style={styles.arrowRight}>→</span>
                </button>

                <button style={styles.row} className="bt-row" onClick={() => handleOpenEdu("cefr")}>
                  <div className="bt-icon-badge" style={{ ...styles.rowIconBadge, background: themes.violet.grad, boxShadow: `0 6px 14px ${themes.violet.glow}` }}>
                    <Icons.Book />
                  </div>
                  <div style={styles.rowBody}>
                    <span style={styles.rowTitle}>CEFR Imtihonlari</span>
                    <span style={styles.rowSub}>Milliy sertifikat imtihon materiallari</span>
                  </div>
                  <span className="bt-arrow" style={styles.arrowRight}>→</span>
                </button>

                <button style={styles.row} className="bt-row" onClick={() => handleOpenEdu("prava")}>
                  <div className="bt-icon-badge" style={{ ...styles.rowIconBadge, background: themes.gold.grad, boxShadow: `0 6px 14px ${themes.gold.glow}` }}>
                    <Icons.Pravaga />
                  </div>
                  <div style={styles.rowBody}>
                    <span style={styles.rowTitle}>Pravaga Tayyorgarlik</span>
                    <span style={styles.rowSub}>Avtomobil imtihoni (GAI) testlari</span>
                  </div>
                  <span className="bt-arrow" style={styles.arrowRight}>→</span>
                </button>
              </div>
            </section>

            {/* БАК №3: ВАКАНСИИ */}
            <section style={styles.sectionBlock} className="bt-card-in">
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, background: "rgba(185,139,255,.14)", color: "#D5BCFF" }}>💼 Ishga Vakansiya</span>
              </div>
              <div style={styles.vacancyGrid}>
                <button style={styles.tile} className="bt-tile" onClick={() => { haptic("light"); setVacancyTab("job"); setIsVacancyOpen(true); }}>
                  <div className="bt-icon-badge" style={{ ...styles.tileIconBadge, background: themes.violet.grad, boxShadow: `0 8px 18px ${themes.violet.glow}` }}>
                    <Icons.Briefcase />
                  </div>
                  <span style={styles.tileTitle}>Ish topish</span>
                  <span style={styles.tileSub}>Bo'sh vakansiyalar</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => { haptic("light"); setVacancyTab("worker"); setIsVacancyOpen(true); }}>
                  <div className="bt-icon-badge" style={{ ...styles.tileIconBadge, background: themes.pink.grad, boxShadow: `0 8px 18px ${themes.pink.glow}` }}>
                    <Icons.Briefcase />
                  </div>
                  <span style={styles.tileTitle}>Ishga olish</span>
                  <span style={styles.tileSub}>Xodimlar rezyumesi</span>
                </button>
              </div>
            </section>

            {/* БАК №4: РЕКЛАМА */}
            <section style={{ marginBottom: "8px" }} className="bt-card-in">
              <div style={styles.promoCard} className="bt-tile" onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
                <div style={styles.promoBadge}><Icons.Sparkle /> Reklama xizmati</div>
                <div style={styles.promoTitle}>Bitta-da o'z brendingizni e'lon qiling!</div>
                <div style={styles.promoDesc}>Kanal, bot yoki xizmatlarni minglab faol foydalanuvchilarga ko'rsating.</div>
                <span style={styles.promoLinkBtn}>Murojaat qilish (@bitta_mngr) →</span>
              </div>
            </section>
          </>
        )}
      </div>

      {/* ШТОРКА МАГАЗИНА */}
      {isShopOpen && activeShopType && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsShopOpen(false)} />
          <div style={styles.bottomSheet} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>{shopProducts[activeShopType].emoji} {shopProducts[activeShopType].title}</div>
              {shopStep !== 4 && (
                <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsShopOpen(false)}>✕</button>
              )}
            </div>

            {/* Шаг 1: выбор пака */}
            {shopStep === 1 && (
              <div style={styles.sheetBody}>
                <p style={styles.subLabel}>Tarifni tanlang</p>
                <div style={styles.packGrid}>
                  {shopProducts[activeShopType].packs.map((pack, idx) => (
                    <button key={idx} style={styles.packCard} className="bt-pack-card" onClick={() => handleSelectPack(pack)}>
                      <div style={styles.packName}>{pack.name}</div>
                      <div style={{ ...styles.packPrice, color: shopTheme[activeShopType].grad ? "#3DDC97" : "#3DDC97" }}>{pack.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 2: ввод данных */}
            {shopStep === 2 && selectedPack && (
              <div style={styles.sheetBody}>
                <div style={styles.orderSummary}>
                  Siz tanladingiz: <span style={{ color: "#fff", fontWeight: 700 }}>{selectedPack.name}</span> ({selectedPack.price})
                </div>
                <input
                  type="text"
                  placeholder={shopProducts[activeShopType].placeholder}
                  value={userCredential}
                  onChange={(e) => setUserCredential(e.target.value)}
                  style={styles.input}
                  className="bt-search-input"
                />
                <div style={styles.btnRow}>
                  <button style={styles.btnBack} className="bt-secondary-btn" onClick={() => setShopStep(1)}>Orqaga</button>
                  <button style={{ ...styles.btnPrimary, background: shopTheme[activeShopType].grad }} className="bt-primary-btn" onClick={handleConfirmCredentials}>Davom etish</button>
                </div>
              </div>
            )}

            {/* Шаг 3: оплата */}
            {shopStep === 3 && selectedPack && (
              <div style={styles.sheetBody}>
                <div style={styles.paymentCard}>
                  <p style={styles.paymentText}>
                    Ushbu kartaga roppa-rosa <strong style={{ color: "#3DDC97" }}>{selectedPack.price}</strong> o'tkazing:
                  </p>
                  <div style={styles.cardBox}>
                    <span style={styles.cardNumber}>8600 4910 2345 6789</span>
                    <button
                      style={styles.copyBtn}
                      className="bt-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText("8600491023456789");
                        haptic("light");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? "Nusxalandi! ✅" : "Nusxa olish"}
                    </button>
                  </div>
                  <div style={styles.cardHolder}>Karta egasi: MUSA A.</div>
                  <p style={styles.warningText}>To'lovdan so'ng chekni rasmga oling va "To'lov qildim" tugmasini bosing.</p>
                </div>
                <button style={{ ...styles.btnPrimary, background: shopTheme[activeShopType].grad, width: "100%" }} className="bt-primary-btn" onClick={handleFinishOrder}>
                  To'lov qildim ✅
                </button>
              </div>
            )}

            {/* Шаг 4: успех */}
            {shopStep === 4 && (
              <div style={styles.successWrap}>
                <div style={{ ...styles.successIconWrap, background: shopTheme[activeShopType].grad, boxShadow: `0 10px 30px ${shopTheme[activeShopType].glow}` }}>
                  <Icons.Check />
                </div>
                <div className="bt-display" style={styles.successTitle}>Ajoyib! 🎉</div>
                <p style={styles.successSub}>Buyurtmangiz qabul qilindi. Operator tez orada siz bilan bog'lanadi.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ШТОРКА ОБУЧЕНИЯ */}
      {isEduOpen && eduType && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsEduOpen(false)} />
          <div style={styles.bottomSheet} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>{eduType === "cefr" ? "📘 CEFR Imtihonlari" : "🚗 Pravaga Tayyorgarlik"}</div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsEduOpen(false)}>✕</button>
            </div>
            <div style={styles.sheetBody}>
              <p style={styles.eduText}>
                {eduType === "cefr"
                  ? "Milliy CEFR imtihonlariga tayyorgarlik ko'rish uchun eng so'nggi testlar, audio materiallar va o'quv qo'llanmalari. Quyidagi tugma orqali bepul resurslar kanalimizga o'ting."
                  : "Yo'l harakati qoidalari (YHQ) va imtihon savollarining to'liq to'plami. Nazariy imtihonni 100% topshirish uchun eng yangi va interaktiv test tizimi."}
              </p>
              <button
                style={{ ...styles.btnPrimary, width: "100%", background: eduType === "cefr" ? themes.teal.grad : themes.gold.grad }}
                className="bt-primary-btn"
                onClick={() => { openTelegramLink("https://t.me/bitta_mngr"); setIsEduOpen(false); }}
              >
                Kanalga o'tish (Bepul) 🚀
              </button>
            </div>
          </div>
        </>
      )}

      {/* ШТОРКА ВАКАНСИЙ */}
      {isVacancyOpen && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsVacancyOpen(false)} />
          <div style={{ ...styles.bottomSheet, maxHeight: "85vh" }} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>💼 Bitta Work</div>
              {!vacSubmitted && (
                <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsVacancyOpen(false)}>✕</button>
              )}
            </div>

            {vacSubmitted ? (
              <div style={styles.successWrap}>
                <div style={{ ...styles.successIconWrap, background: themes.violet.grad, boxShadow: `0 10px 30px ${themes.violet.glow}` }}>
                  <Icons.Check />
                </div>
                <div className="bt-display" style={styles.successTitle}>E'lon joylandi! 🎉</div>
                <p style={styles.successSub}>Tez orada qiziqqan odamlar siz bilan bog'lanishadi.</p>
              </div>
            ) : !isCreatingVacancy ? (
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
                <div style={styles.tabRow}>
                  <button style={{ ...styles.tab, ...(vacancyTab === "job" ? styles.tabActive : {}) }} className="bt-tab-btn" onClick={() => setVacancyTab("job")}>
                    Vakansiyalar
                  </button>
                  <button style={{ ...styles.tab, ...(vacancyTab === "worker" ? styles.tabActive : {}) }} className="bt-tab-btn" onClick={() => setVacancyTab("worker")}>
                    Rezyumelar
                  </button>
                </div>

                <div style={styles.vacList}>
                  {mockVacancies.filter((v) => v.type === vacancyTab).map((v) => (
                    <div key={v.id} style={styles.vacCard} className="bt-row">
                      <div style={styles.vacRow}>
                        <span style={styles.vacTitle}>{v.title}</span>
                        <span style={styles.vacBudget}>{v.budget}</span>
                      </div>
                      <p style={styles.vacDesc}>{v.desc}</p>
                      <button style={styles.vacApplyBtn} className="bt-secondary-btn" onClick={() => openTelegramLink(`https://t.me/${v.contact.replace("@", "")}`)}>
                        Bog'lanish ({v.contact})
                      </button>
                    </div>
                  ))}
                </div>

                <button style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%" }} className="bt-primary-btn" onClick={() => setIsCreatingVacancy(true)}>
                  E'lon joylashtirish
                </button>
              </div>
            ) : (
              <div style={styles.sheetBody}>
                <div style={styles.tabRow}>
                  <button style={{ ...styles.tab, ...(newVacType === "job" ? styles.tabActive : {}) }} className="bt-tab-btn" onClick={() => setNewVacType("job")}>
                    Vakansiya
                  </button>
                  <button style={{ ...styles.tab, ...(newVacType === "worker" ? styles.tabActive : {}) }} className="bt-tab-btn" onClick={() => setNewVacType("worker")}>
                    Rezyume
                  </button>
                </div>

                <input type="text" placeholder="Sarlavha (masalan: Designer kerak)" value={newVacTitle} onChange={(e) => setNewVacTitle(e.target.value)} style={styles.input} className="bt-search-input" />
                <input type="text" placeholder="Narxi / Maosh" value={newVacBudget} onChange={(e) => setNewVacBudget(e.target.value)} style={styles.input} className="bt-search-input" />
                <textarea placeholder="Batafsil tavsif va talablar..." value={newVacDesc} onChange={(e) => setNewVacDesc(e.target.value)} style={{ ...styles.input, height: "70px", resize: "none" }} className="bt-search-input" />
                <input type="text" placeholder="Telegram Username (masalan: @musa)" value={newVacContact} onChange={(e) => setNewVacContact(e.target.value)} style={styles.input} className="bt-search-input" />

                <div style={styles.btnRow}>
                  <button style={styles.btnBack} className="bt-secondary-btn" onClick={() => setIsCreatingVacancy(false)}>Bekor qilish</button>
                  <button style={{ ...styles.btnPrimary, background: themes.violet.grad }} className="bt-primary-btn" onClick={handleCreateVacancy}>Joylashtirish</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* МЕНЮ */}
      {isMenuOpen && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsMenuOpen(false)} />
          <div style={styles.drawer} className="bt-sheet">
            <div style={styles.drawerHeader}>
              <span className="bt-display" style={styles.drawerTitle}>Menyu</span>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>
            <nav style={styles.drawerNav}>
              <button style={styles.navItem} className="bt-nav-item bt-row" onClick={() => alert("O'zbek tili faollashtirildi")}>
                <span style={{ ...styles.navIconBadge, background: themes.blue.grad }}>🌐</span> O'zbekcha
              </button>
              <button style={styles.navItem} className="bt-nav-item bt-row" onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
                <span style={{ ...styles.navIconBadge, background: themes.pink.grad }}>💬</span> Bog'lanish
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

// ===================== СТИЛИ =====================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    minHeight: "100vh",
    backgroundColor: "#120B1F",
    color: "#F4F1FA",
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: "hidden",
  },
  bgLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(70px)",
    opacity: 0.35,
  },
  content: {
    position: "relative",
    zIndex: 1,
    padding: "20px 16px 40px 16px",
  },

  // HEADER
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoDot: {
    width: "26px",
    height: "26px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#120B1F",
  },
  logoText: {
    fontSize: "21px",
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  searchWrapper: {
    position: "relative",
    flexGrow: 1,
    maxWidth: "170px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#8B84A6",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "9px 12px 9px 34px",
    color: "#ffffff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  burgerButton: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: "5px",
    padding: "10px 12px",
  },
  burgerLine: {
    width: "20px",
    height: "2px",
    backgroundColor: "#ffffff",
    borderRadius: "2px",
  },

  // ПОИСК — РЕЗУЛЬТАТЫ
  resultsSection: {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "16px",
    marginBottom: "16px",
  },
  resultsHeader: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
    fontWeight: 700,
    color: "#8B84A6",
    marginBottom: "12px",
  },
  resultCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: "14px",
    padding: "10px 12px",
    cursor: "pointer",
  },
  resultIconBadge: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#120B1F",
    flexShrink: 0,
  },
  resultBody: { display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 },
  resultGroup: { fontSize: "10px", fontWeight: 700, color: "#B98BFF", textTransform: "uppercase", letterSpacing: "0.4px" },
  resultTitle: { fontSize: "14px", fontWeight: 700, color: "#ffffff" },
  resultDesc: { fontSize: "11.5px", color: "#A79FC2" },
  noResults: { fontSize: "13px", color: "#A79FC2", textAlign: "center", padding: "12px 0" },

  // HERO
  hero: {
    background: "linear-gradient(160deg, rgba(255,95,126,0.16), rgba(110,107,255,0.12))",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "22px 18px",
    marginBottom: "16px",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#FFD166",
    background: "rgba(255,209,102,0.14)",
    padding: "5px 10px",
    borderRadius: "20px",
    marginBottom: "12px",
  },
  heroTitle: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#ffffff",
    margin: "0 0 8px 0",
    letterSpacing: "-0.3px",
  },
  heroSub: {
    fontSize: "13px",
    color: "#C9C2E0",
    lineHeight: 1.5,
    margin: 0,
  },

  // SECTIONS
  sectionBlock: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "20px",
    padding: "16px",
    marginBottom: "16px",
  },
  sectionHeader: { marginBottom: "14px" },
  sectionLabel: {
    fontSize: "11.5px",
    fontWeight: 800,
    letterSpacing: "0.3px",
    padding: "6px 12px",
    borderRadius: "20px",
  },

  // TILE GRID (игры / вакансии)
  tileGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  vacancyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  tile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "14px",
    cursor: "pointer",
    textAlign: "left",
  },
  tileIconBadge: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    marginBottom: "12px",
  },
  tileTitle: { fontSize: "13.5px", fontWeight: 700, color: "#ffffff" },
  tileSub: { fontSize: "11px", color: "#A79FC2", marginTop: "2px" },

  // ROW LIST (обучение)
  rowList: { display: "flex", flexDirection: "column", gap: "8px" },
  row: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  rowIconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    marginRight: "12px",
    flexShrink: 0,
  },
  rowBody: { display: "flex", flexDirection: "column", flexGrow: 1 },
  rowTitle: { fontSize: "13.5px", fontWeight: 700, color: "#ffffff" },
  rowSub: { fontSize: "11px", color: "#A79FC2", marginTop: "2px" },
  arrowRight: { fontSize: "15px", color: "#A79FC2", marginLeft: "8px" },

  // PROMO
  promoCard: {
    background: "linear-gradient(135deg, rgba(255,209,102,0.14), rgba(255,95,126,0.12))",
    border: "1px dashed rgba(255,209,102,0.4)",
    borderRadius: "18px",
    padding: "18px 16px",
    cursor: "pointer",
    textAlign: "left",
  },
  promoBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "10px",
    fontWeight: 800,
    color: "#120B1F",
    backgroundColor: "#FFD166",
    padding: "4px 9px",
    borderRadius: "20px",
    marginBottom: "10px",
    letterSpacing: "0.3px",
  },
  promoTitle: { fontSize: "15px", fontWeight: 700, color: "#ffffff" },
  promoDesc: { fontSize: "12px", color: "#C9C2E0", marginTop: "4px", lineHeight: 1.4 },
  promoLinkBtn: { display: "inline-block", fontSize: "12.5px", fontWeight: 700, color: "#FFD166", marginTop: "12px" },

  // МОДАЛКИ / ШТОРКИ
  backdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(8, 4, 16, 0.72)",
    backdropFilter: "blur(6px)",
    zIndex: 1000,
  },
  bottomSheet: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1C1330",
    borderTopLeftRadius: "26px",
    borderTopRightRadius: "26px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 20px 30px 20px",
    zIndex: 1001,
    maxHeight: "82vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -20px 50px -10px rgba(0,0,0,0.55)",
  },
  sheetIndicator: {
    width: "40px",
    height: "4px",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: "3px",
    alignSelf: "center",
    marginBottom: "14px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  modalLogo: { fontSize: "17px", fontWeight: 700, color: "#ffffff" },
  closeModalBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: "50%",
    width: "28px",
    height: "28px",
    color: "#ffffff",
    fontSize: "13px",
    cursor: "pointer",
  },
  sheetBody: {
    display: "flex",
    flexDirection: "column",
    paddingTop: "16px",
    gap: "14px",
    overflowY: "auto",
  },
  subLabel: {
    fontSize: "11.5px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#A79FC2",
    fontWeight: 700,
    margin: 0,
  },
  packGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },
  packCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "14px",
    padding: "18px 12px",
    cursor: "pointer",
    textAlign: "center",
  },
  packName: { fontSize: "13.5px", fontWeight: 700, color: "#ffffff", marginBottom: "4px" },
  packPrice: { fontSize: "12px", fontWeight: 700 },
  orderSummary: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "14px",
    borderRadius: "12px",
    fontSize: "13px",
    color: "#C9C2E0",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "13px",
    padding: "14px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  btnRow: { display: "flex", gap: "10px" },
  btnBack: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#C9C2E0",
    padding: "14px",
    borderRadius: "13px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnPrimary: {
    flex: 1,
    border: "none",
    color: "#120B1F",
    padding: "14px",
    borderRadius: "13px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  paymentCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "18px",
    padding: "16px",
  },
  paymentText: { fontSize: "13px", color: "#C9C2E0", margin: "0 0 14px 0" },
  cardBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "10px",
  },
  cardNumber: { fontSize: "15px", fontWeight: 700, fontFamily: "monospace", color: "#ffffff" },
  copyBtn: {
    backgroundColor: "#ffffff",
    border: "none",
    color: "#120B1F",
    fontSize: "11px",
    fontWeight: 800,
    padding: "7px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  cardHolder: { fontSize: "10px", color: "#8B84A6", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px" },
  warningText: { fontSize: "11.5px", color: "#FF9DAF", margin: 0, lineHeight: 1.4 },

  // УСПЕХ
  successWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "28px 10px 16px 10px",
  },
  successIconWrap: {
    width: "82px",
    height: "82px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    marginBottom: "18px",
    animation: "bt-circlePop .5s cubic-bezier(.34,1.56,.64,1)",
  },
  successTitle: { fontSize: "20px", fontWeight: 600, color: "#ffffff", marginBottom: "6px" },
  successSub: { fontSize: "13px", color: "#C9C2E0", lineHeight: 1.5, maxWidth: "260px" },

  eduText: { fontSize: "14px", color: "#C9C2E0", lineHeight: 1.55, margin: 0 },

  // ТАБЫ / ВАКАНСИИ
  tabRow: {
    display: "flex",
    gap: "6px",
    margin: "12px 0 16px 0",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "4px",
    borderRadius: "12px",
  },
  tab: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "9px",
    color: "#A79FC2",
    padding: "9px",
    fontSize: "12.5px",
    fontWeight: 700,
    cursor: "pointer",
  },
  tabActive: { backgroundColor: "rgba(255,255,255,0.12)", color: "#ffffff" },
  vacList: { flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  vacCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "14px",
    padding: "14px",
  },
  vacRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" },
  vacTitle: { fontSize: "14px", fontWeight: 700, color: "#ffffff" },
  vacBudget: { fontSize: "12px", color: "#3DDC97", fontWeight: 700, whiteSpace: "nowrap" },
  vacDesc: { fontSize: "12px", color: "#A79FC2", margin: "0 0 12px 0", lineHeight: 1.45 },
  vacApplyBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "9px 12px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  },

  // МЕНЮ
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "270px",
    backgroundColor: "#1C1330",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    padding: "26px 20px",
    zIndex: 1001,
    display: "flex",
    flexDirection: "column",
  },
  drawerHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  drawerTitle: { fontSize: "19px", fontWeight: 600, color: "#ffffff" },
  drawerNav: { display: "flex", flexDirection: "column", gap: "10px" },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "13px",
    color: "#ffffff",
    padding: "13px 14px",
    textAlign: "left",
    fontSize: "13.5px",
    fontWeight: 700,
    cursor: "pointer",
  },
  navIconBadge: {
    width: "30px",
    height: "30px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
  },
};