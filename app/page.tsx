"use client";

import { useState, useEffect, ChangeEvent } from "react";

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

const shopProducts: Record<
  ShopType,
  { title: string; emoji: string; placeholder: string; packs: { name: string; price: string }[] }
> = {
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
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M16 12h.01" />
      <path d="M18 8H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2z" />
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
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
  const [userBalance, setUserBalance] = useState(0);

  // ПОПОЛНЕНИЕ БАЛАНСА
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpReceiptName, setTopUpReceiptName] = useState("");
  const [topUpReceiptFile, setTopUpReceiptFile] = useState<File | null>(null);
  const [topUpCopied, setTopUpCopied] = useState(false);
  // idle -> submitting -> pending (ждём решения админа в Telegram) -> approved | rejected | error
  const [topUpStatus, setTopUpStatus] = useState<"idle" | "submitting" | "pending" | "approved" | "rejected" | "error">("idle");
  const [topUpError, setTopUpError] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);

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
      loadBalance();
    };
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitData = (): string => {
    if (typeof window === "undefined") return "";
    return window.Telegram?.WebApp ? (window.Telegram.WebApp as any).initData ?? "" : "";
  };

  const loadBalance = async () => {
    const initData = getInitData();
    if (!initData) return;
    try {
      const res = await fetch(`/api/deposit?initData=${encodeURIComponent(initData)}`);
      const data = await res.json();
      if (res.ok && typeof data.balance === "number") setUserBalance(data.balance);
    } catch {
      // тихо игнорируем — попробуем при следующем действии
    }
  };

  // Пока заявка на пополнение "на рассмотрении" — спрашиваем сервер, не решил ли админ.
  useEffect(() => {
    if (topUpStatus !== "pending" || !depositId) return;
    const interval = setInterval(async () => {
      const initData = getInitData();
      try {
        const res = await fetch(`/api/deposit?initData=${encodeURIComponent(initData)}&id=${depositId}`);
        const data = await res.json();
        if (res.ok && data.deposit?.status && data.deposit.status !== "pending") {
          setTopUpStatus(data.deposit.status); // "approved" | "rejected"
          if (data.deposit.status === "approved") {
            haptic("success");
            loadBalance();
          }
        }
      } catch {
        // попробуем на следующем тике
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topUpStatus, depositId]);

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

  // ПОПОЛНЕНИЕ БАЛАНСА
  const handleOpenTopUp = () => {
    haptic("light");
    setIsTopUpOpen(true);
    setTopUpStatus("idle");
    setTopUpError("");
    setDepositId(null);
  };

  const handleReceiptUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTopUpReceiptName(e.target.files[0].name);
      setTopUpReceiptFile(e.target.files[0]);
      haptic("light");
    }
  };

  const handleFinishTopUp = async () => {
    const amount = parseInt(topUpAmount.replace(/[^\d]/g, ""), 10);
    if (!amount || amount <= 0) {
      haptic("medium");
      alert("Iltimos, to'lov summasini kiriting!");
      return;
    }
    const initData = getInitData();
    setTopUpStatus("submitting");
    setTopUpError("");
    try {
      const form = new FormData();
      form.append("initData", initData);
      form.append("amount", String(amount));
      if (topUpReceiptFile) form.append("receipt", topUpReceiptFile);

      const res = await fetch("/api/deposit", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setTopUpStatus("error");
        setTopUpError(data.error === "INVALID_AMOUNT" ? `Minimal summa: ${data.minAmount.toLocaleString("uz-UZ")} so'm` : "Xatolik yuz berdi");
        haptic("medium");
        return;
      }
      setDepositId(data.deposit.id);
      setTopUpStatus("pending");
      haptic("success");
    } catch {
      setTopUpStatus("error");
      setTopUpError("Server bilan bog'lanib bo'lmadi");
    }
  };

  // МАГАЗИН
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
    setShopStep(4);
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

  // Поиск по всему приложению
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
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; background-color: #120A21; }
        .bt-display { font-family: 'Fredoka', 'Plus Jakarta Sans', sans-serif; }

        @keyframes bt-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes bt-pop {
          0% { opacity: 0; transform: translateY(16px) scale(0.92); }
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

        .bt-check-path { stroke-dasharray: 46; stroke-dashoffset: 46; animation: bt-check .5s .15s cubic-bezier(.65,0,.35,1) forwards; }
        .bt-blob { animation: bt-float 8s ease-in-out infinite; }

        .bt-tile, .bt-row, .bt-primary-btn, .bt-pack-card, .bt-close-btn, .bt-copy-btn, .bt-secondary-btn, .bt-tab-btn, .bt-quick-btn {
          transition: transform .16s cubic-bezier(.34,1.56,.64,1), box-shadow .16s ease, border-color .16s ease, background .16s ease;
        }
        .bt-tile:active, .bt-pack-card:active, .bt-primary-btn:active, .bt-secondary-btn:active, .bt-copy-btn:active, .bt-tab-btn:active, .bt-quick-btn:active { transform: scale(0.94); }
        .bt-row:active { transform: scale(0.97); }
        .bt-close-btn:active { transform: scale(0.8) rotate(90deg); }

        .bt-tile:hover { transform: translateY(-4px) rotate(-1deg); }
        .bt-row:hover { transform: translateX(3px); }
        .bt-primary-btn { position: relative; overflow: hidden; }
        .bt-primary-btn::after {
          content: ''; position: absolute; top: 0; left: 0; width: 45%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,.4), transparent);
          transform: translateX(-130%) skewX(-15deg);
        }
        .bt-primary-btn:hover::after { animation: bt-shine 1s ease; }
        .bt-search-input:focus { box-shadow: 0 0 0 3px rgba(184,139,255,.28); }
        .bt-sheet { animation: bt-sheetUp .32s cubic-bezier(0, 0, 0.2, 1) forwards; }
        .bt-backdrop { animation: bt-fadeIn .2s ease forwards; }
      ` }} />

      {/* ФОНОВЫЕ ПЯТНА */}
      <div style={styles.bgLayer} aria-hidden="true">
        <div className="bt-blob" style={{ ...styles.blob, width: 260, height: 260, top: -80, left: -60, background: themes.pink.grad }} />
        <div className="bt-blob" style={{ ...styles.blob, width: 220, height: 220, top: 140, right: -90, background: themes.violet.grad, animationDelay: "1.5s" }} />
        <div className="bt-blob" style={{ ...styles.blob, width: 200, height: 200, bottom: 40, left: -70, background: themes.teal.grad, animationDelay: "3s" }} />
      </div>

      <div style={styles.content}>
        {/* ХЕДЕР */}
        <header style={styles.header}>
          <div style={styles.logoWrap}>
            <span className="bt-blob" style={{ ...styles.logoDot, background: themes.pink.grad }}>
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

          {/* КНОПКА ПОПОЛНЕНИЯ БАЛАНСА В ХЕДЕРЕ */}
          <button style={styles.topUpHeaderBtn} className="bt-primary-btn" onClick={handleOpenTopUp}>
            <Icons.Wallet />
            <span>{userBalance.toLocaleString("uz-UZ")} UZS</span>
          </button>

          <button style={styles.burgerButton} className="bt-secondary-btn" onClick={() => { haptic("light"); setIsMenuOpen(true); }}>
            <div style={styles.burgerLine}></div>
            <div style={{ ...styles.burgerLine, width: "16px" }}></div>
          </button>
        </header>

        {/* РЕЗУЛЬТАТЫ ПОИСКА */}
        {q !== "" ? (
          <div style={styles.resultsSection}>
            <div style={styles.resultsHeader}>Qidiruv natijalari</div>
            {filteredResults.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredResults.map((item) => (
                  <div key={item.id} style={styles.resultCard} className="bt-row" onClick={() => runResult(item.action)}>
                    <div style={{ ...styles.resultIconBadge, background: item.theme.grad, boxShadow: `0 6px 16px ${item.theme.glow}` }}>
                      <item.icon />
                    </div>
                    <div style={styles.resultBody}>
                      <div style={styles.resultGroup}>{item.group}</div>
                      <div style={styles.resultTitle}>{item.title}</div>
                      <div style={styles.resultDesc}>{item.desc}</div>
                    </div>
                    <span style={styles.arrowRight}>→</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noResults}>Hech narsa topilmadi. Boshqa so'z bilan izlab ko'ring 🤔</div>
            )}
          </div>
        ) : (
          <>
            {/* HERO */}
            <section style={styles.hero}>
              <div style={styles.heroBadge}><Icons.Sparkle /> Bitta ilovada — hammasi</div>
              <h1 className="bt-display" style={styles.heroTitle}>Nimadan boshlaymiz?</h1>
              <p style={styles.heroSub}>O'yiningizni to'ldiring, imtihonga tayyorlaning yoki ish toping — barchasi shu yerda 🎉</p>
            </section>

            {/* ДOНАT */}
            <section style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, background: "rgba(255,95,126,.14)", color: "#FF9DAF" }}>🎮 O'yin & Donat</span>
              </div>
              <div style={styles.tileGrid}>
                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("pubg")}>
                  <div style={{ ...styles.tileIconBadge, background: themes.pink.grad, boxShadow: `0 8px 18px ${themes.pink.glow}` }}>
                    <Icons.Gamepad />
                  </div>
                  <span style={styles.tileTitle}>PUBG Mobile</span>
                  <span style={styles.tileSub}>UC to'ldirish</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("freefire")}>
                  <div style={{ ...styles.tileIconBadge, background: themes.gold.grad, boxShadow: `0 8px 18px ${themes.gold.glow}` }}>
                    <Icons.Diamond />
                  </div>
                  <span style={styles.tileTitle}>Free Fire</span>
                  <span style={styles.tileSub}>Almazlar</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("premium")}>
                  <div style={{ ...styles.tileIconBadge, background: themes.violet.grad, boxShadow: `0 8px 18px ${themes.violet.glow}` }}>
                    <Icons.Premium />
                  </div>
                  <span style={styles.tileTitle}>TG Premium</span>
                  <span style={styles.tileSub}>Tezkor obuna</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => handleOpenShop("steam")}>
                  <div style={{ ...styles.tileIconBadge, background: themes.blue.grad, boxShadow: `0 8px 18px ${themes.blue.glow}` }}>
                    <Icons.Steam />
                  </div>
                  <span style={styles.tileTitle}>Steam</span>
                  <span style={styles.tileSub}>Hamyon balansi</span>
                </button>
              </div>
            </section>

            {/* ОБУЧЕНИЕ */}
            <section style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, background: "rgba(55,229,196,.14)", color: "#7FF0D9" }}>📚 Ta'lim & Imtihon</span>
              </div>
              <div style={styles.rowList}>
                <button style={styles.row} className="bt-row" onClick={() => openLinkInside("https://ielts.gg")}>
                  <div style={{ ...styles.rowIconBadge, background: themes.teal.grad, boxShadow: `0 6px 14px ${themes.teal.glow}` }}>
                    <Icons.Book />
                  </div>
                  <div style={styles.rowBody}>
                    <span style={styles.rowTitle}>IELTS.GG</span>
                    <span style={styles.rowSub}>Professional IELTS imtihoniga tayyorgarlik</span>
                  </div>
                  <span style={styles.arrowRight}>→</span>
                </button>

                <button style={styles.row} className="bt-row" onClick={() => handleOpenEdu("cefr")}>
                  <div style={{ ...styles.rowIconBadge, background: themes.violet.grad, boxShadow: `0 6px 14px ${themes.violet.glow}` }}>
                    <Icons.Book />
                  </div>
                  <div style={styles.rowBody}>
                    <span style={styles.rowTitle}>CEFR Imtihonlari</span>
                    <span style={styles.rowSub}>Milliy sertifikat imtihon materiallari</span>
                  </div>
                  <span style={styles.arrowRight}>→</span>
                </button>

                <button style={styles.row} className="bt-row" onClick={() => handleOpenEdu("prava")}>
                  <div style={{ ...styles.rowIconBadge, background: themes.gold.grad, boxShadow: `0 6px 14px ${themes.gold.glow}` }}>
                    <Icons.Pravaga />
                  </div>
                  <div style={styles.rowBody}>
                    <span style={styles.rowTitle}>Pravaga Tayyorgarlik</span>
                    <span style={styles.rowSub}>Avtomobil imtihoni (GAI) testlari</span>
                  </div>
                  <span style={styles.arrowRight}>→</span>
                </button>
              </div>
            </section>

            {/* ВАКАНСИИ */}
            <section style={styles.sectionBlock}>
              <div style={styles.sectionHeader}>
                <span style={{ ...styles.sectionLabel, background: "rgba(185,139,255,.14)", color: "#D5BCFF" }}>💼 Ishga Vakansiya</span>
              </div>
              <div style={styles.vacancyGrid}>
                <button style={styles.tile} className="bt-tile" onClick={() => { haptic("light"); setVacancyTab("job"); setIsVacancyOpen(true); }}>
                  <div style={{ ...styles.tileIconBadge, background: themes.violet.grad, boxShadow: `0 8px 18px ${themes.violet.glow}` }}>
                    <Icons.Briefcase />
                  </div>
                  <span style={styles.tileTitle}>Ish topish</span>
                  <span style={styles.tileSub}>Bo'sh vakansiyalar</span>
                </button>

                <button style={styles.tile} className="bt-tile" onClick={() => { haptic("light"); setVacancyTab("worker"); setIsVacancyOpen(true); }}>
                  <div style={{ ...styles.tileIconBadge, background: themes.pink.grad, boxShadow: `0 8px 18px ${themes.pink.glow}` }}>
                    <Icons.Briefcase />
                  </div>
                  <span style={styles.tileTitle}>Ishga olish</span>
                  <span style={styles.tileSub}>Xodimlar rezyumesi</span>
                </button>
              </div>
            </section>

            {/* РЕКЛАМА */}
            <section style={{ marginBottom: "20px" }}>
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

      {/* ===================== МОДАЛЬНОЕ ОКНО: BALANS TO'LDIRISH ===================== */}
      {isTopUpOpen && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsTopUpOpen(false)} />
          <div style={styles.bottomSheet} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>💳 Balans to'ldirish</div>
              {(topUpStatus === "idle" || topUpStatus === "error" || topUpStatus === "approved" || topUpStatus === "rejected") && (
                <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsTopUpOpen(false)}>✕</button>
              )}
            </div>

            {(topUpStatus === "idle" || topUpStatus === "submitting" || topUpStatus === "error") ? (
              <div style={styles.sheetBody}>
                {/* КАРТОЧКА ДЛЯ ОПЛАТЫ */}
                <div style={styles.paymentCard}>
                  <p style={styles.paymentText}>
                    Plastik kartamizga to'lovni amalga oshiring:
                  </p>
                  <div style={styles.cardBox}>
                    <span style={styles.cardNumber}>8600 4910 2345 6789</span>
                    <button
                      style={styles.copyBtn}
                      className="bt-copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText("8600491023456789");
                        haptic("light");
                        setTopUpCopied(true);
                        setTimeout(() => setTopUpCopied(false), 1500);
                      }}
                    >
                      {topUpCopied ? "Nusxalandi! ✅" : "Nusxa olish"}
                    </button>
                  </div>
                  <div style={styles.cardHolder}>Karta egasi: MUSA A.</div>
                </div>

                {/* ВВОД СУММЫ */}
                <div style={{ marginTop: "16px" }}>
                  <label style={styles.inputLabel}>To'lov summasi (UZS):</label>
                  <input
                    type="number"
                    placeholder="Masalan: 50000"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    style={styles.input}
                    className="bt-search-input"
                  />
                  {/* КНОПКИ БЫСТРОГО ВЫБОРА СУММЫ */}
                  <div style={styles.quickAmountRow}>
                    {["10000", "25000", "50000", "100000"].map((amt) => (
                      <button
                        key={amt}
                        style={styles.quickAmountBtn}
                        className="bt-quick-btn"
                        onClick={() => {
                          setTopUpAmount(amt);
                          haptic("light");
                        }}
                      >
                        +{parseInt(amt).toLocaleString("uz-UZ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ЗАГРУЗКА ЧЕКА */}
                <div style={{ marginTop: "16px" }}>
                  <label style={styles.inputLabel}>To'lov chekini yuklang (rasm):</label>
                  <label style={styles.fileUploadBox} className="bt-tile">
                    <Icons.Upload />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>
                      {topUpReceiptName ? `📄 ${topUpReceiptName}` : "Chek rasmini tanlang"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                {topUpStatus === "error" && (
                  <p style={{ color: "#FF9DAF", fontSize: "12px", marginTop: "10px" }}>{topUpError}</p>
                )}

                {/* КНОПКА ПОДТВЕРЖДЕНИЯ */}
                <button
                  style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%", marginTop: "20px", opacity: topUpStatus === "submitting" ? 0.7 : 1 }}
                  className="bt-primary-btn"
                  onClick={handleFinishTopUp}
                  disabled={topUpStatus === "submitting"}
                >
                  {topUpStatus === "submitting" ? "Yuborilmoqda..." : "To'lovni tasdiqlash 🚀"}
                </button>
              </div>
            ) : topUpStatus === "pending" ? (
              <div style={styles.successBox}>
                <div style={{ color: "#FFD166", marginBottom: "12px", fontSize: "40px" }}>⏳</div>
                <div style={styles.successTitle}>Tekshirilmoqda...</div>
                <div style={styles.successSub}>
                  To'lov so'rovingiz adminga yuborildi. Tasdiqlangach bu oyna avtomatik yangilanadi — hech narsa qilish shart emas.
                </div>
              </div>
            ) : topUpStatus === "approved" ? (
              <div style={styles.successBox}>
                <div style={{ color: "#3DDC97", marginBottom: "12px" }}>
                  <Icons.Check />
                </div>
                <div style={styles.successTitle}>Balans to'ldirildi! ✅</div>
                <div style={styles.successSub}>
                  Joriy balansingiz: <strong style={{ color: "#3DDC97" }}>{userBalance.toLocaleString("uz-UZ")} UZS</strong>
                </div>
              </div>
            ) : (
              <div style={styles.successBox}>
                <div style={{ color: "#FF9DAF", marginBottom: "12px", fontSize: "40px" }}>❌</div>
                <div style={styles.successTitle}>So'rov rad etildi</div>
                <div style={styles.successSub}>
                  To'lov tasdiqlanmadi. Agar bu xato bo'lsa, @bitta_mngr ga yozing yoki qaytadan urinib ko'ring.
                </div>
                <button
                  style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%", marginTop: "16px" }}
                  className="bt-primary-btn"
                  onClick={handleOpenTopUp}
                >
                  Qayta urinish
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== МОДАЛЬНОЕ ОКНО: МАГАЗИН ===================== */}
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

            {shopStep === 1 && (
              <div style={styles.sheetBody}>
                <p style={styles.subLabel}>Tarifni tanlang</p>
                <div style={styles.packGrid}>
                  {shopProducts[activeShopType].packs.map((pack, idx) => (
                    <button key={idx} style={styles.packCard} className="bt-pack-card" onClick={() => handleSelectPack(pack)}>
                      <div style={styles.packName}>{pack.name}</div>
                      <div style={styles.packPrice}>{pack.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {shopStep === 3 && selectedPack && (
              <div style={styles.sheetBody}>
                <div style={styles.paymentCard}>
                  <p style={styles.paymentText}>
                    Ushbu kartaga roppa-rosa <strong style={{ color: "#3DDC97" }}>{selectedPack.price}</strong> o'tkazing:
                  </p>
                  <div style={styles.cardBox}>
                    <span style={styles.cardNumber}>8600 4910 2345 6789</span>
                    <button style={styles.copyBtn} className="bt-copy-btn" onClick={() => {
                      navigator.clipboard.writeText("8600491023456789");
                      haptic("light");
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}>
                      {copied ? "Nusxalandi! ✅" : "Nusxa olish"}
                    </button>
                  </div>
                  <div style={styles.cardHolder}>Karta egasi: MUSA A.</div>
                </div>

                <button style={{ ...styles.btnPrimary, background: shopTheme[activeShopType].grad, width: "100%", marginTop: "16px" }} className="bt-primary-btn" onClick={handleFinishOrder}>
                  To'lovni tasdiqlash
                </button>
              </div>
            )}

            {shopStep === 4 && (
              <div style={styles.successBox}>
                <div style={{ color: "#3DDC97", marginBottom: "12px" }}>
                  <Icons.Check />
                </div>
                <div style={styles.successTitle}>Buyurtma qabul qilindi!</div>
                <div style={styles.successSub}>Tez orada buyurtmangiz bajariladi va sizga xabar beriladi.</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== МОДАЛЬНОЕ ОКНО: ОБУЧЕНИЕ ===================== */}
      {isEduOpen && eduType && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsEduOpen(false)} />
          <div style={styles.bottomSheet} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>
                {eduType === "cefr" ? "📚 CEFR Imtihonlari" : "🚗 Pravaga Tayyorgarlik"}
              </div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsEduOpen(false)}>✕</button>
            </div>
            <div style={styles.sheetBody}>
              <div style={styles.eduInfoCard}>
                <p style={{ margin: "0 0 8px 0", color: "#E0D7F5", fontSize: "14px", lineHeight: 1.5 }}>
                  {eduType === "cefr"
                    ? "CEFR B1, B2, C1 darajadagi testlar, audio materiallar va mock imtihon topshirish bo'limi."
                    : "Yo'l harakati qoidalari (YHQ), GAI kompyuter imtihoni testlari va bilimlarni sinash boti."}
                </p>
              </div>
              <button
                style={{ ...styles.btnPrimary, background: themes.teal.grad, width: "100%", marginTop: "12px" }}
                className="bt-primary-btn"
                onClick={() => {
                  haptic("light");
                  openTelegramLink(eduType === "cefr" ? "https://t.me/bitta_cefr_bot" : "https://t.me/bitta_prava_bot");
                }}
              >
                Botda Mashq Qilish 🚀
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===================== МОДАЛЬНОЕ ОКНО: ВАКАНСИИ ===================== */}
      {isVacancyOpen && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsVacancyOpen(false)} />
          <div style={styles.bottomSheet} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>💼 Vakansiyalar va Ishlar</div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsVacancyOpen(false)}>✕</button>
            </div>

            <div style={styles.sheetBody}>
              {!isCreatingVacancy ? (
                <>
                  <div style={styles.tabRow}>
                    <button
                      style={{ ...styles.tabBtn, ...(vacancyTab === "job" ? styles.tabBtnActive : {}) }}
                      className="bt-tab-btn"
                      onClick={() => { haptic("light"); setVacancyTab("job"); }}
                    >
                      Bo'sh ish o'rinlari
                    </button>
                    <button
                      style={{ ...styles.tabBtn, ...(vacancyTab === "worker" ? styles.tabBtnActive : {}) }}
                      className="bt-tab-btn"
                      onClick={() => { haptic("light"); setVacancyTab("worker"); }}
                    >
                      Xodimlar (Rezyume)
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px", overflowY: "auto", margin: "14px 0" }}>
                    {mockVacancies.filter(v => v.type === vacancyTab).map(vac => (
                      <div key={vac.id} style={styles.vacCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={styles.vacTitle}>{vac.title}</div>
                          <div style={styles.vacBudget}>{vac.budget}</div>
                        </div>
                        <div style={styles.vacDesc}>{vac.desc}</div>
                        <button
                          style={styles.vacApplyBtn}
                          className="bt-secondary-btn"
                          onClick={() => openTelegramLink(`https://t.me/${vac.contact.replace('@', '')}`)}
                        >
                          Bog'lanish ({vac.contact})
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%" }}
                    className="bt-primary-btn"
                    onClick={() => { haptic("light"); setIsCreatingVacancy(true); }}
                  >
                    + Yangi e'lon joylash
                  </button>
                </>
              ) : vacSubmitted ? (
                <div style={styles.successBox}>
                  <div style={{ color: "#3DDC97", marginBottom: "12px" }}>
                    <Icons.Check />
                  </div>
                  <div style={styles.successTitle}>E'loningiz yuborildi!</div>
                  <div style={styles.successSub}>Moderatorlar ko'rib chiqqach e'lon kanalda va ilovada paydo bo'ladi.</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "12px" }}>E'lon berish</div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <button
                      style={{ ...styles.tabBtn, flex: 1, ...(newVacType === "job" ? styles.tabBtnActive : {}) }}
                      onClick={() => setNewVacType("job")}
                    >
                      Ish taklif etaman
                    </button>
                    <button
                      style={{ ...styles.tabBtn, flex: 1, ...(newVacType === "worker" ? styles.tabBtnActive : {}) }}
                      onClick={() => setNewVacType("worker")}
                    >
                      Ish qidiryapman
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Sarlavha (masalan: Dizayner kerak)"
                    value={newVacTitle}
                    onChange={e => setNewVacTitle(e.target.value)}
                    style={{ ...styles.input, marginBottom: "8px" }}
                  />
                  <input
                    type="text"
                    placeholder="Maosh / Byudjet (masalan: 1,000,000 UZS)"
                    value={newVacBudget}
                    onChange={e => setNewVacBudget(e.target.value)}
                    style={{ ...styles.input, marginBottom: "8px" }}
                  />
                  <textarea
                    placeholder="Batafsil ma'lumot..."
                    value={newVacDesc}
                    onChange={e => setNewVacDesc(e.target.value)}
                    style={{ ...styles.input, height: "60px", marginBottom: "8px", resize: "none" }}
                  />
                  <input
                    type="text"
                    placeholder="Aloqa uchun Telegram (masalan: @username)"
                    value={newVacContact}
                    onChange={e => setNewVacContact(e.target.value)}
                    style={{ ...styles.input, marginBottom: "14px" }}
                  />

                  <div style={styles.btnRow}>
                    <button style={styles.btnBack} className="bt-secondary-btn" onClick={() => setIsCreatingVacancy(false)}>Bekor qilish</button>
                    <button style={{ ...styles.btnPrimary, background: themes.violet.grad }} className="bt-primary-btn" onClick={handleCreateVacancy}>Tasdiqlash</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===================== БОКОВОЕ МЕНЮ ===================== */}
      {isMenuOpen && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsMenuOpen(false)} />
          <div style={styles.drawer}>
            <div style={styles.drawerHeader}>
              <div style={styles.drawerTitle}>Menyu</div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>

            <div style={styles.drawerBody}>
              {/* БАЛАНС В МЕНЮ */}
              <div style={styles.menuBalanceCard}>
                <div style={{ fontSize: "12px", color: "#A79FC2" }}>Hisobingiz:</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#3DDC97", margin: "2px 0 8px 0" }}>
                  {userBalance.toLocaleString("uz-UZ")} UZS
                </div>
                <button
                  style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%", padding: "8px", fontSize: "12px" }}
                  className="bt-primary-btn"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleOpenTopUp();
                  }}
                >
                  💳 Balansni to'ldirish
                </button>
              </div>

              <div style={styles.menuList}>
                <button style={styles.menuItem} onClick={() => { setIsMenuOpen(false); openTelegramLink("https://t.me/bitta_mngr"); }}>
                  🎧 Qo'llab-quvvatlash (@bitta_mngr)
                </button>
                <button style={styles.menuItem} onClick={() => { setIsMenuOpen(false); openTelegramLink("https://t.me/bitta_official"); }}>
                  📢 Rasmiy kanal
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===================== СТИЛИ (JS OBJECT) =====================

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#120A21",
    color: "#FFFFFF",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: "relative",
    overflowX: "hidden",
    paddingBottom: "40px",
  },
  bgLayer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 0,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(65px)",
    opacity: 0.35,
  },
  content: {
    position: "relative",
    zIndex: 1,
    maxWidth: "480px",
    margin: "0 auto",
    padding: "16px 16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  logoDot: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #FFFFFF, #B98BFF)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  searchWrapper: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    color: "#7E7694",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "8px 30px 8px 30px",
    color: "#FFFFFF",
    fontSize: "13px",
    outline: "none",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "8px",
    background: "none",
    border: "none",
    color: "#A79FC2",
    cursor: "pointer",
    fontSize: "12px",
  },
  topUpHeaderBtn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "rgba(61, 220, 151, 0.12)",
    border: "1px solid rgba(61, 220, 151, 0.3)",
    color: "#3DDC97",
    padding: "6px 10px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  burgerButton: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
  },
  burgerLine: {
    width: "18px",
    height: "2px",
    backgroundColor: "#FFFFFF",
    borderRadius: "2px",
  },
  hero: {
    padding: "16px 0",
    marginBottom: "8px",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#B98BFF",
    backgroundColor: "rgba(185, 139, 255, 0.12)",
    padding: "4px 10px",
    borderRadius: "20px",
    marginBottom: "8px",
  },
  heroTitle: {
    fontSize: "24px",
    margin: "0 0 6px 0",
    fontWeight: 700,
  },
  heroSub: {
    fontSize: "13px",
    color: "#A79FC2",
    margin: 0,
    lineHeight: 1.4,
  },
  sectionBlock: {
    marginBottom: "18px",
  },
  sectionHeader: {
    marginBottom: "10px",
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "8px",
  },
  tileGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  tile: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    cursor: "pointer",
  },
  tileIconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    marginBottom: "10px",
  },
  tileTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#FFFFFF",
  },
  tileSub: {
    fontSize: "11px",
    color: "#A79FC2",
    marginTop: "2px",
  },
  rowList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  row: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "14px",
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    textAlign: "left",
  },
  rowIconBadge: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#FFFFFF",
    display: "block",
  },
  rowSub: {
    fontSize: "11px",
    color: "#A79FC2",
  },
  arrowRight: {
    fontSize: "14px",
    color: "#7E7694",
  },
  vacancyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  promoCard: {
    background: "linear-gradient(135deg, rgba(185,139,255,0.12), rgba(110,107,255,0.06))",
    border: "1px solid rgba(185, 139, 255, 0.25)",
    borderRadius: "16px",
    padding: "16px",
    cursor: "pointer",
  },
  promoBadge: {
    fontSize: "11px",
    color: "#FFD166",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginBottom: "6px",
  },
  promoTitle: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#FFF",
    marginBottom: "4px",
  },
  promoDesc: {
    fontSize: "12px",
    color: "#A79FC2",
    lineHeight: 1.4,
    marginBottom: "10px",
  },
  promoLinkBtn: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#B98BFF",
  },
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)",
    zIndex: 999,
  },
  bottomSheet: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1A102F",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    borderTop: "1px solid rgba(255,255,255,0.12)",
    padding: "12px 20px 28px 20px",
    zIndex: 1000,
    maxWidth: "500px",
    margin: "0 auto",
  },
  sheetIndicator: {
    width: "36px",
    height: "4px",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "2px",
    margin: "0 auto 12px auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  modalLogo: {
    fontSize: "17px",
    fontWeight: 700,
    color: "#FFF",
  },
  closeModalBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    color: "#A79FC2",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: {
    display: "flex",
    flexDirection: "column",
  },
  subLabel: {
    fontSize: "12px",
    color: "#A79FC2",
    margin: "0 0 10px 0",
  },
  packGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  packCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "left",
    cursor: "pointer",
  },
  packName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#FFF",
  },
  packPrice: {
    fontSize: "12px",
    color: "#3DDC97",
    fontWeight: 600,
    marginTop: "4px",
  },
  inputLabel: {
    fontSize: "12px",
    color: "#A79FC2",
    marginBottom: "6px",
    display: "block",
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    padding: "10px 12px",
    color: "#FFF",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  quickAmountRow: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
  },
  quickAmountBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#B98BFF",
    fontSize: "11px",
    fontWeight: 600,
    padding: "6px 0",
    cursor: "pointer",
  },
  fileUploadBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px dashed rgba(185, 139, 255, 0.4)",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    color: "#B98BFF",
  },
  paymentCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px",
  },
  paymentText: {
    fontSize: "13px",
    color: "#E0D7F5",
    margin: "0 0 10px 0",
  },
  cardBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: "10px 12px",
    borderRadius: "10px",
    marginBottom: "6px",
  },
  cardNumber: {
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "1px",
    color: "#FFF",
  },
  copyBtn: {
    backgroundColor: "rgba(185, 139, 255, 0.15)",
    border: "none",
    color: "#B98BFF",
    fontSize: "11px",
    fontWeight: 700,
    padding: "5px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  cardHolder: {
    fontSize: "11px",
    color: "#A79FC2",
  },
  btnRow: {
    display: "flex",
    gap: "8px",
    marginTop: "14px",
  },
  btnBack: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "none",
    color: "#FFF",
    borderRadius: "10px",
    padding: "10px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnPrimary: {
    flex: 1,
    border: "none",
    color: "#FFF",
    borderRadius: "10px",
    padding: "10px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(185,139,255,0.3)",
  },
  orderSummary: {
    fontSize: "13px",
    color: "#A79FC2",
    marginBottom: "12px",
  },
  successBox: {
    textAlign: "center",
    padding: "20px 10px",
  },
  successTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#FFF",
    marginBottom: "6px",
  },
  successSub: {
    fontSize: "13px",
    color: "#A79FC2",
    lineHeight: 1.4,
  },
  eduInfoCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: "14px",
    borderRadius: "12px",
  },
  tabRow: {
    display: "flex",
    gap: "6px",
    marginBottom: "10px",
  },
  tabBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#A79FC2",
    padding: "8px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
  },
  tabBtnActive: {
    backgroundColor: "rgba(185, 139, 255, 0.2)",
    borderColor: "#B98BFF",
    color: "#FFF",
  },
  vacCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "10px 12px",
  },
  vacTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#FFF",
  },
  vacBudget: {
    fontSize: "11px",
    color: "#3DDC97",
    fontWeight: 700,
  },
  vacDesc: {
    fontSize: "11px",
    color: "#A79FC2",
    margin: "4px 0 8px 0",
  },
  vacApplyBtn: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    border: "none",
    color: "#FFF",
    padding: "6px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "270px",
    backgroundColor: "#1A102F",
    borderLeft: "1px solid rgba(255,255,255,0.1)",
    padding: "20px",
    zIndex: 1001,
    display: "flex",
    flexDirection: "column",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  drawerTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#FFF",
  },
  drawerBody: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  menuBalanceCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "14px",
  },
  menuList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  menuItem: {
    backgroundColor: "transparent",
    border: "none",
    color: "#E0D7F5",
    fontSize: "13px",
    textAlign: "left",
    padding: "8px 0",
    cursor: "pointer",
  },
  resultsSection: {
    marginTop: "8px",
  },
  resultsHeader: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#A79FC2",
    marginBottom: "8px",
  },
  resultCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  resultIconBadge: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
  },
  resultBody: {
    flex: 1,
  },
  resultGroup: {
    fontSize: "10px",
    color: "#B98BFF",
    fontWeight: 700,
  },
  resultTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#FFF",
  },
  resultDesc: {
    fontSize: "11px",
    color: "#A79FC2",
  },
  noResults: {
    textAlign: "center",
    color: "#A79FC2",
    fontSize: "13px",
    padding: "20px",
  },
};