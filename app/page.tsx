import TopSection from './TopSection';
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
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
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
  { title: string; placeholder: string; packs: { name: string; price: string }[] }
> = {
  pubg: {
    title: "PUBG Mobile UC",
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
    placeholder: "Steam Login (masalan: musa_pro)",
    packs: [
      { name: "$5 USD", price: "70,000 UZS" },
      { name: "$10 USD", price: "140,000 UZS" },
      { name: "$20 USD", price: "275,000 UZS" },
    ],
  },
  premium: {
    title: "Telegram Premium",
    placeholder: "Telegram Username (masalan: @username)",
    packs: [
      { name: "3 Oy (Muddatsiz)", price: "90,000 UZS" },
      { name: "6 Oy (Muddatsiz)", price: "150,000 UZS" },
      { name: "12 Oy (Muddatsiz)", price: "270,000 UZS" },
    ],
  },
};

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
  XCircle: () => (
    <svg width="56" height="56" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <line x1="18" y1="18" x2="34" y2="34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="34" y1="18" x2="18" y2="34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
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
  Close: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  CheckSmall: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clock: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 6 9 12 15 18" />
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Rocket: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  Headphones: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  Megaphone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Bot: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="10" rx="3" />
      <circle cx="8.5" cy="15" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15" r="1.3" fill="currentColor" stroke="none" />
      <path d="M12 10V6" /><circle cx="12" cy="4.5" r="1.5" />
      <path d="M3 14H1M23 14h-2" />
    </svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
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

// Иконки для заголовков модалок (вместо emoji)
const shopIcons: Record<ShopType, () => JSX.Element> = {
  pubg: Icons.Gamepad,
  freefire: Icons.Diamond,
  steam: Icons.Steam,
  premium: Icons.Premium,
};

const eduIcons: Record<EduType, () => JSX.Element> = {
  cefr: Icons.Book,
  prava: Icons.Pravaga,
};

// ===================== КОМПОНЕНТ =====================

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userBalance, setUserBalance] = useState(0);

  // Навигация: home -> одна из категорий -> profile. Каждая — отдельный полноэкранный вид.
  const [activeView, setActiveView] = useState<"home" | "market" | "study" | "jobs" | "profile">("home");
  // Заглушка выбора языка в профиле — реального перевода пока нет, только визуальный выбор.
  const [uiLanguage, setUiLanguage] = useState<"uz" | "ru" | "en">("uz");

  // BITTA AI (Gemini)
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // Покупка в магазине (списание с баланса)
  const [buyError, setBuyError] = useState("");
  const [isBuying, setIsBuying] = useState(false);

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

  // БАК 2: Обучение
  const [isEduOpen, setIsEduOpen] = useState(false);
  const [eduType, setEduType] = useState<EduType | null>(null);

  // БАК 3: Вакансии
  const [isVacancyOpen, setIsVacancyOpen] = useState(false);
  const [vacancyTab, setVacancyTab] = useState<"job" | "worker">("job");
  const [isCreatingVacancy, setIsCreatingVacancy] = useState(false);
  const [vacSubmitted, setVacSubmitted] = useState(false);
  const [vacancies, setVacancies] = useState<{ id: string; title: string; budget: string; description: string; contact: string }[]>([]);
  const [isLoadingVacancies, setIsLoadingVacancies] = useState(false);
  const [vacListError, setVacListError] = useState("");

  const [newVacType, setNewVacType] = useState<"job" | "worker">("job");
  const [newVacTitle, setNewVacTitle] = useState("");
  const [newVacBudget, setNewVacBudget] = useState("");
  const [newVacDesc, setNewVacDesc] = useState("");
  const [newVacContact, setNewVacContact] = useState("");
  const [isSubmittingVacancy, setIsSubmittingVacancy] = useState(false);
  const [vacSubmitError, setVacSubmitError] = useState("");

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

  // Данные для отображения в профиле (имя/юзернейм/аватар) — берём напрямую из Telegram
  // WebApp SDK на клиенте, отдельный запрос на сервер для этого не нужен.
  const getTelegramProfile = () => {
    if (typeof window === "undefined") return null;
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!u) return null;
    return {
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      username: u.username ?? "",
      photoUrl: u.photo_url ?? "",
    };
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTopUpStatus("error");
        setTopUpError(
          data.error === "INVALID_AMOUNT"
            ? `Minimal summa: ${data.minAmount?.toLocaleString("uz-UZ")} so'm`
            : `Xatolik: ${data.error ?? "HTTP " + res.status}${data.reason ? " (" + data.reason + ")" : ""}`
        );
        haptic("medium");
        return;
      }
      setDepositId(data.deposit.id);
      setTopUpStatus("pending");
      haptic("success");
    } catch (e) {
      setTopUpStatus("error");
      setTopUpError(`Tarmoq xatosi: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // BITTA AI — отправка сообщения на бэкенд, который сам ходит в Gemini
  const handleSendAi = async () => {
    const text = aiInput.trim();
    if (!text || isAiLoading) return;

    haptic("light");
    const nextMessages = [...aiMessages, { role: "user" as const, text }];
    setAiMessages(nextMessages);
    setAiInput("");
    setAiError("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: getInitData(),
          message: text,
          // на бэкенд шлём только последние сообщения — так меньше токенов уходит на каждый запрос
          history: nextMessages.slice(-10, -1),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) {
        setAiError(`Xatolik: ${data.error ?? "HTTP " + res.status}${data.reason ? " (" + data.reason + ")" : ""}`);
        return;
      }
      setAiMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (e) {
      setAiError(`Tarmoq xatosi: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // МАГАЗИН
  const handleOpenShop = (type: ShopType) => {
    haptic("light");
    setActiveShopType(type);
    setShopStep(1);
    setSelectedPack(null);
    setUserCredential("");
    setBuyError("");
    setIsBuying(false);
    setIsShopOpen(true);
  };

  const handleSelectPack = (pack: { name: string; price: string }) => {
    haptic("light");
    setSelectedPack(pack);
    setBuyError("");
    setShopStep(2);
  };

  const handleBuy = async () => {
    if (!userCredential.trim()) {
      haptic("medium");
      setBuyError("Iltimos, ID kiriting");
      return;
    }
    if (!activeShopType || !selectedPack) return;

    setIsBuying(true);
    setBuyError("");
    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: getInitData(),
          service: activeShopType,
          productName: selectedPack.name,
          targetId: userCredential.trim(),
          price: parseInt(selectedPack.price.replace(/[^\d]/g, ""), 10),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setBuyError(data.error === "INSUFFICIENT_BALANCE" ? "Balansingiz yetarli emas." : "Xatolik yuz berdi. Qayta urinib ko'ring.");
        haptic("medium");
        return;
      }
      haptic("success");
      setShopStep(4);
      loadBalance();
      setTimeout(() => {
        setIsShopOpen(false);
        setShopStep(1);
        setActiveShopType(null);
        setSelectedPack(null);
        setUserCredential("");
        setBuyError("");
      }, 2200);
    } catch {
      setBuyError("Server bilan bog'lanib bo'lmadi.");
    } finally {
      setIsBuying(false);
    }
  };

  const handleOpenEdu = (type: EduType) => {
    haptic("light");
    setEduType(type);
    setIsEduOpen(true);
  };

  const loadVacancies = async (type: "job" | "worker") => {
    setIsLoadingVacancies(true);
    setVacListError("");
    try {
      const res = await fetch(`/api/vacancies?type=${type}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVacListError(`Xatolik: ${data.error ?? "HTTP " + res.status}`);
        return;
      }
      setVacancies(data.vacancies ?? []);
    } catch {
      setVacListError("Server bilan bog'lanib bo'lmadi (tarmoq xatosi).");
    } finally {
      setIsLoadingVacancies(false);
    }
  };

  // Как только шторка открыта (и мы не в форме создания) — грузим актуальный список под выбранную вкладку.
  useEffect(() => {
    if (isVacancyOpen && !isCreatingVacancy) {
      loadVacancies(vacancyTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVacancyOpen, vacancyTab, isCreatingVacancy]);

  const handleCreateVacancy = async () => {
    if (!newVacTitle.trim() || !newVacBudget.trim() || !newVacDesc.trim() || !newVacContact.trim()) {
      haptic("medium");
      setVacSubmitError("Barcha maydonlarni to'ldiring");
      return;
    }
    setIsSubmittingVacancy(true);
    setVacSubmitError("");
    try {
      const res = await fetch("/api/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: getInitData(),
          type: newVacType,
          title: newVacTitle.trim(),
          budget: newVacBudget.trim(),
          description: newVacDesc.trim(),
          contact: newVacContact.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setVacSubmitError(`Xatolik: ${data.error ?? "HTTP " + res.status}${data.reason ? " (" + data.reason + ")" : ""}`);
        haptic("medium");
        return;
      }
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
    } catch {
      setVacSubmitError("Server bilan bog'lanib bo'lmadi (tarmoq xatosi).");
      haptic("medium");
    } finally {
      setIsSubmittingVacancy(false);
    }
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

  const telegramProfile = activeView === "profile" ? getTelegramProfile() : null;

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

        @keyframes bt-ai-glow {
          0%, 100% { box-shadow: 0 6px 20px rgba(185,139,255,.45); }
          50% { box-shadow: 0 6px 28px rgba(185,139,255,.75); }
        }
        .bt-ai-fab { animation: bt-ai-glow 2.4s ease-in-out infinite; transition: transform .15s ease; }
        .bt-ai-fab:active { transform: scale(0.94); }

        .bt-ai-typing { display: inline-flex; gap: 4px; align-items: center; }
        .bt-ai-typing span {
          width: 6px; height: 6px; border-radius: 50%; background: #A79FC2;
          animation: bt-ai-blink 1.2s infinite ease-in-out both;
        }
        .bt-ai-typing span:nth-child(2) { animation-delay: .15s; }
        .bt-ai-typing span:nth-child(3) { animation-delay: .3s; }
        @keyframes bt-ai-blink {
          0%, 80%, 100% { opacity: .3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
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
          {activeView === "home" ? (
            <button style={styles.iconNavBtn} className="bt-secondary-btn" onClick={() => { haptic("light"); setActiveView("profile"); }}>
              <Icons.User />
            </button>
          ) : (
            <button style={styles.iconNavBtn} className="bt-secondary-btn" onClick={() => { haptic("light"); setActiveView("home"); }}>
              <Icons.ChevronLeft />
            </button>
          )}

          <div style={styles.logoWrap}>
            <span className="bt-blob" style={{ ...styles.logoDot, background: themes.pink.grad }}>
              <Icons.Sparkle />
            </span>
            <span className="bt-display" style={styles.logoText}>
              {activeView === "home" && "bitta"}
              {activeView === "market" && "O'yin & Market"}
              {activeView === "study" && "Ta'lim"}
              {activeView === "jobs" && "Vakansiya"}
              {activeView === "profile" && "Profil"}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <button style={styles.topUpHeaderBtn} className="bt-primary-btn" onClick={handleOpenTopUp}>
            <Icons.Wallet />
            <span>{userBalance.toLocaleString("uz-UZ")} UZS</span>
          </button>

          <button style={styles.burgerButton} className="bt-secondary-btn" onClick={() => { haptic("light"); setIsMenuOpen(true); }}>
            <div style={styles.burgerLine}></div>
            <div style={{ ...styles.burgerLine, width: "16px" }}></div>
          </button>
        </header>

        {/* ===================== ГЛАВНАЯ ===================== */}
        {activeView === "home" && (
          <>
            <div style={styles.searchWrapperFull}>
              <div style={styles.searchIcon}><Icons.Search /></div>
              <input
                type="text"
                placeholder="Nima kerak?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInputFull}
                className="bt-search-input"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn} className="bt-close-btn"><Icons.Close /></button>
              )}
            </div>

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
                        <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.noResults}>Hech narsa topilmadi. Boshqa so'z bilan izlab ko'ring</div>
                )}
              </div>
            ) : (
              <>
                {/* HERO */}
                <section style={styles.hero}>
                  <div style={styles.heroBadge}><Icons.Sparkle /> Bitta ilovada — hammasi</div>
                  <h1 className="bt-display" style={styles.heroTitle}>Nimadan boshlaymiz?</h1>
                  <p style={styles.heroSub}>O'yiningizni to'ldiring, imtihonga tayyorlaning yoki ish toping — barchasi shu yerda</p>
                </section>

                {/* 3 КРУПНЫХ РАЗДЕЛА */}
                <div style={styles.categoryList}>
                  <button style={styles.categoryCard} className="bt-tile" onClick={() => { haptic("light"); setActiveView("market"); }}>
                    <div style={{ ...styles.categoryIconBadge, background: themes.pink.grad, boxShadow: `0 8px 18px ${themes.pink.glow}` }}>
                      <Icons.Gamepad />
                    </div>
                    <div style={styles.categoryTextWrap}>
                      <span style={styles.categoryTitle}>O'yin & Market</span>
                      <span style={styles.categorySub}>PUBG, Free Fire, Steam, TG Premium</span>
                    </div>
                    <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                  </button>

                  <button style={styles.categoryCard} className="bt-tile" onClick={() => { haptic("light"); setActiveView("study"); }}>
                    <div style={{ ...styles.categoryIconBadge, background: themes.teal.grad, boxShadow: `0 8px 18px ${themes.teal.glow}` }}>
                      <Icons.Book />
                    </div>
                    <div style={styles.categoryTextWrap}>
                      <span style={styles.categoryTitle}>O'qish va Imtihonlar</span>
                      <span style={styles.categorySub}>IELTS, CEFR, Pravaga tayyorgarlik</span>
                    </div>
                    <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                  </button>

                  <button style={styles.categoryCard} className="bt-tile" onClick={() => { haptic("light"); setActiveView("jobs"); }}>
                    <div style={{ ...styles.categoryIconBadge, background: themes.violet.grad, boxShadow: `0 8px 18px ${themes.violet.glow}` }}>
                      <Icons.Briefcase />
                    </div>
                    <div style={styles.categoryTextWrap}>
                      <span style={styles.categoryTitle}>Ishga Vakansiya</span>
                      <span style={styles.categorySub}>Ish topish yoki xodim qidirish</span>
                    </div>
                    <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                  </button>
                </div>

                {/* РЕКЛАМА */}
                <section style={{ marginBottom: "20px" }}>
                  <div style={styles.promoCard} className="bt-tile" onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
                    <div style={styles.promoBadge}><Icons.Sparkle /> Reklama xizmati</div>
                    <div style={styles.promoTitle}>Bitta-da o'z brendingizni e'lon qiling!</div>
                    <div style={styles.promoDesc}>Kanal, bot yoki xizmatlarni minglab faol foydalanuvchilarga ko'rsating.</div>
                    <span style={styles.promoLinkBtn}>Murojaat qilish (@bitta_mngr) <Icons.ChevronRight /></span>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {/* ===================== O'YIN & MARKET ===================== */}
        {activeView === "market" && (
          <div style={styles.bigTileList}>
            <button style={styles.bigTile} className="bt-tile" onClick={() => handleOpenShop("pubg")}>
              <div style={{ ...styles.bigTileIconBadge, background: themes.pink.grad, boxShadow: `0 8px 18px ${themes.pink.glow}` }}>
                <Icons.Gamepad />
              </div>
              <div style={styles.categoryTextWrap}>
                <span style={styles.categoryTitle}>PUBG Mobile</span>
                <span style={styles.categorySub}>UC to'ldirish</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>

            <button style={styles.bigTile} className="bt-tile" onClick={() => handleOpenShop("freefire")}>
              <div style={{ ...styles.bigTileIconBadge, background: themes.gold.grad, boxShadow: `0 8px 18px ${themes.gold.glow}` }}>
                <Icons.Diamond />
              </div>
              <div style={styles.categoryTextWrap}>
                <span style={styles.categoryTitle}>Free Fire</span>
                <span style={styles.categorySub}>Almazlar</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>

            <button style={styles.bigTile} className="bt-tile" onClick={() => handleOpenShop("premium")}>
              <div style={{ ...styles.bigTileIconBadge, background: themes.violet.grad, boxShadow: `0 8px 18px ${themes.violet.glow}` }}>
                <Icons.Premium />
              </div>
              <div style={styles.categoryTextWrap}>
                <span style={styles.categoryTitle}>TG Premium</span>
                <span style={styles.categorySub}>Tezkor obuna</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>

            <button style={styles.bigTile} className="bt-tile" onClick={() => handleOpenShop("steam")}>
              <div style={{ ...styles.bigTileIconBadge, background: themes.blue.grad, boxShadow: `0 8px 18px ${themes.blue.glow}` }}>
                <Icons.Steam />
              </div>
              <div style={styles.categoryTextWrap}>
                <span style={styles.categoryTitle}>Steam</span>
                <span style={styles.categorySub}>Hamyon balansi</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>
          </div>
        )}

        {/* ===================== O'QISH VA IMTIHONLAR ===================== */}
        {activeView === "study" && (
          <div style={styles.rowList}>
            <button style={styles.row} className="bt-row" onClick={() => openLinkInside("https://ielts.gg")}>
              <div style={{ ...styles.rowIconBadge, background: themes.teal.grad, boxShadow: `0 6px 14px ${themes.teal.glow}` }}>
                <Icons.Book />
              </div>
              <div style={styles.rowBody}>
                <span style={styles.rowTitle}>IELTS.GG</span>
                <span style={styles.rowSub}>Professional IELTS imtihoniga tayyorgarlik</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>

            <button style={styles.row} className="bt-row" onClick={() => handleOpenEdu("cefr")}>
              <div style={{ ...styles.rowIconBadge, background: themes.violet.grad, boxShadow: `0 6px 14px ${themes.violet.glow}` }}>
                <Icons.Book />
              </div>
              <div style={styles.rowBody}>
                <span style={styles.rowTitle}>CEFR Imtihonlari</span>
                <span style={styles.rowSub}>Milliy sertifikat imtihon materiallari</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>

            <button style={styles.row} className="bt-row" onClick={() => handleOpenEdu("prava")}>
              <div style={{ ...styles.rowIconBadge, background: themes.gold.grad, boxShadow: `0 6px 14px ${themes.gold.glow}` }}>
                <Icons.Pravaga />
              </div>
              <div style={styles.rowBody}>
                <span style={styles.rowTitle}>Pravaga Tayyorgarlik</span>
                <span style={styles.rowSub}>Avtomobil imtihoni (GAI) testlari</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>
          </div>
        )}

        {/* ===================== ISHGA VAKANSIYA ===================== */}
        {activeView === "jobs" && (
          <div style={styles.bigTileList}>
            <button style={styles.bigTile} className="bt-tile" onClick={() => { haptic("light"); setVacancyTab("job"); setIsVacancyOpen(true); }}>
              <div style={{ ...styles.bigTileIconBadge, background: themes.violet.grad, boxShadow: `0 8px 18px ${themes.violet.glow}` }}>
                <Icons.Briefcase />
              </div>
              <div style={styles.categoryTextWrap}>
                <span style={styles.categoryTitle}>Ish topish</span>
                <span style={styles.categorySub}>Bo'sh vakansiyalar</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>

            <button style={styles.bigTile} className="bt-tile" onClick={() => { haptic("light"); setVacancyTab("worker"); setIsVacancyOpen(true); }}>
              <div style={{ ...styles.bigTileIconBadge, background: themes.pink.grad, boxShadow: `0 8px 18px ${themes.pink.glow}` }}>
                <Icons.Briefcase />
              </div>
              <div style={styles.categoryTextWrap}>
                <span style={styles.categoryTitle}>Ishga olish</span>
                <span style={styles.categorySub}>Xodimlar rezyumesi</span>
              </div>
              <span style={styles.arrowRight}><Icons.ChevronRight /></span>
            </button>
          </div>
        )}

        {/* ===================== PROFIL ===================== */}
        {activeView === "profile" && (
          <div style={styles.profileWrap}>
            <div style={styles.profileCard}>
              {telegramProfile?.photoUrl ? (
                <img src={telegramProfile.photoUrl} alt="" style={styles.profileAvatarImg} />
              ) : (
                <div style={styles.profileAvatarFallback}><Icons.User /></div>
              )}
              <div style={styles.profileName}>
                {telegramProfile?.firstName || "Foydalanuvchi"} {telegramProfile?.lastName || ""}
              </div>
              {telegramProfile?.username && <div style={styles.profileUsername}>@{telegramProfile.username}</div>}
            </div>

            <div style={styles.menuBalanceCard}>
              <div style={{ fontSize: "12px", color: "#A79FC2" }}>Hisobingiz:</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#3DDC97", margin: "2px 0 10px 0" }}>
                {userBalance.toLocaleString("uz-UZ")} UZS
              </div>
              <button style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%" }} className="bt-primary-btn" onClick={handleOpenTopUp}>
                <Icons.Wallet /> Balansni to'ldirish
              </button>
            </div>

            <div style={styles.profileSectionLabel}>Til</div>
            <div style={styles.langRow}>
              <button style={{ ...styles.langPill, ...(uiLanguage === "uz" ? styles.langPillActive : {}) }} onClick={() => setUiLanguage("uz")}>O'zbekcha</button>
              <button style={{ ...styles.langPill, ...(uiLanguage === "ru" ? styles.langPillActive : {}) }} onClick={() => setUiLanguage("ru")}>Русский</button>
              <button style={{ ...styles.langPill, ...(uiLanguage === "en" ? styles.langPillActive : {}) }} onClick={() => setUiLanguage("en")}>English</button>
            </div>
            <p style={{ fontSize: "11px", color: "#7E7694", margin: "6px 0 20px 0" }}>Boshqa tillar tez orada qo'shiladi.</p>

            <div style={styles.profileSectionLabel}>Yordam</div>
            <div style={styles.menuList}>
              <button style={styles.menuItem} onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
                <Icons.Headphones /> Qo'llab-quvvatlash (@bitta_mngr)
              </button>
              <button style={styles.menuItem} onClick={() => openTelegramLink("https://t.me/bitta_official")}>
                <Icons.Megaphone /> Rasmiy kanal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== МОДАЛЬНОЕ ОКНО: BALANS TO'LDIRISH ===================== */}
      {isTopUpOpen && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsTopUpOpen(false)} />
          <div style={styles.bottomSheet} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}><Icons.Wallet /> Balans to'ldirish</div>
              {(topUpStatus === "idle" || topUpStatus === "error" || topUpStatus === "approved" || topUpStatus === "rejected") && (
                <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsTopUpOpen(false)}><Icons.Close /></button>
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
                      {topUpCopied ? <><Icons.CheckSmall /> Nusxalandi!</> : "Nusxa olish"}
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
                    <span style={{ fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      {topUpReceiptName ? <><Icons.FileText /> {topUpReceiptName}</> : "Chek rasmini tanlang"}
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
                  {topUpStatus === "submitting" ? "Yuborilmoqda..." : <><Icons.Rocket /> To'lovni tasdiqlash</>}
                </button>
              </div>
            ) : topUpStatus === "pending" ? (
              <div style={styles.successBox}>
                <div style={{ color: "#FFD166", marginBottom: "12px" }}>
                  <Icons.Clock />
                </div>
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
                <div style={styles.successTitle}>Balans to'ldirildi!</div>
                <div style={styles.successSub}>
                  Joriy balansingiz: <strong style={{ color: "#3DDC97" }}>{userBalance.toLocaleString("uz-UZ")} UZS</strong>
                </div>
              </div>
            ) : (
              <div style={styles.successBox}>
                <div style={{ color: "#FF9DAF", marginBottom: "12px" }}>
                  <Icons.XCircle />
                </div>
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
              <div style={styles.modalLogo}>
                {(() => { const ShopIcon = shopIcons[activeShopType]; return <ShopIcon />; })()} {shopProducts[activeShopType].title}
              </div>
              {shopStep !== 4 && (
                <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsShopOpen(false)}><Icons.Close /></button>
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
                {buyError && (
                  <div style={{ color: "#FF9DAF", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span>{buyError}</span>
                    {buyError === "Balansingiz yetarli emas." && (
                      <button
                        style={{ ...styles.btnPrimary, background: "linear-gradient(135deg,#B98BFF,#6E6BFF)" }}
                        className="bt-primary-btn"
                        onClick={() => { setIsShopOpen(false); handleOpenTopUp(); }}
                      >
                        <Icons.Wallet /> Hisobni to'ldirish
                      </button>
                    )}
                  </div>
                )}
                <div style={styles.btnRow}>
                  <button style={styles.btnBack} className="bt-secondary-btn" onClick={() => setShopStep(1)}>Orqaga</button>
                  <button
                    style={{ ...styles.btnPrimary, background: shopTheme[activeShopType].grad, opacity: isBuying ? 0.7 : 1 }}
                    className="bt-primary-btn"
                    onClick={handleBuy}
                    disabled={isBuying}
                  >
                    {isBuying ? "Yuborilmoqda..." : "Sotib olish"}
                  </button>
                </div>
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
                {eduType === "cefr" ? <Icons.Book /> : <Icons.Pravaga />} {eduType === "cefr" ? "CEFR Imtihonlari" : "Pravaga Tayyorgarlik"}
              </div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsEduOpen(false)}><Icons.Close /></button>
            </div>
            <div style={styles.sheetBody}>
              <div style={styles.eduInfoCard}>
                <p style={{ margin: "0 0 8px 0", color: "#E0D7F5", fontSize: "14px", lineHeight: 1.5 }}>
                  {eduType === "cefr"
                    ? "CEFR B1, B2, C1 darajadagi testlar, audio materiallar va mock imtihon topshirish bo'limi."
                    : "Yo'l harakati qoidalari (YHQ), GAI kompyuter imtihoni testlari va bilimlarni onlayn sinash platformasi."}
                </p>
              </div>
              <button
                style={{ ...styles.btnPrimary, background: themes.teal.grad, width: "100%", marginTop: "12px" }}
                className="bt-primary-btn"
                onClick={() => {
                  haptic("light");
                  openLinkInside(eduType === "cefr" ? "https://www.efset.org" : "https://pravaapp.uz");
                }}
              >
                <Icons.Rocket /> {eduType === "cefr" ? "EFSET.org saytiga o'tish" : "PravaApp.uz saytiga o'tish"}
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
              <div style={styles.modalLogo}><Icons.Briefcase /> Vakansiyalar va Ishlar</div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsVacancyOpen(false)}><Icons.Close /></button>
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
                    {isLoadingVacancies ? (
                      <div style={{ textAlign: "center", color: "#A79FC2", fontSize: "12.5px", padding: "20px 0" }}>Yuklanmoqda...</div>
                    ) : vacListError ? (
                      <div style={{ textAlign: "center", color: "#FF9DAF", fontSize: "12.5px", padding: "20px 0" }}>{vacListError}</div>
                    ) : vacancies.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#A79FC2", fontSize: "12.5px", padding: "20px 0" }}>
                        Hozircha e'lonlar yo'q. Birinchi bo'lib joylashtiring!
                      </div>
                    ) : (
                      vacancies.map((vac) => (
                        <div key={vac.id} style={styles.vacCard}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={styles.vacTitle}>{vac.title}</div>
                            <div style={styles.vacBudget}>{vac.budget}</div>
                          </div>
                          <div style={styles.vacDesc}>{vac.description}</div>
                          <button
                            style={styles.vacApplyBtn}
                            className="bt-secondary-btn"
                            onClick={() => openTelegramLink(`https://t.me/${vac.contact.replace('@', '')}`)}
                          >
                            Bog'lanish ({vac.contact})
                          </button>
                        </div>
                      ))
                    )}
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
                  <div style={styles.successSub}>E'loningiz darhol ro'yxatda ko'rinadi.</div>
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

                  {vacSubmitError && (
                    <div style={{ color: "#FF9DAF", fontSize: "12px", marginBottom: "10px" }}>{vacSubmitError}</div>
                  )}

                  <div style={styles.btnRow}>
                    <button style={styles.btnBack} className="bt-secondary-btn" onClick={() => setIsCreatingVacancy(false)}>Bekor qilish</button>
                    <button
                      style={{ ...styles.btnPrimary, background: themes.violet.grad, opacity: isSubmittingVacancy ? 0.7 : 1 }}
                      className="bt-primary-btn"
                      onClick={handleCreateVacancy}
                      disabled={isSubmittingVacancy}
                    >
                      {isSubmittingVacancy ? "Yuborilmoqda..." : "Tasdiqlash"}
                    </button>
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
              <div style={styles.drawerTitle}>Bo'limlar</div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsMenuOpen(false)}><Icons.Close /></button>
            </div>

            <div style={styles.drawerBody}>
              <div style={styles.drawerGroupLabel}>Xizmatlar</div>
              <div style={styles.menuNavList}>
                <button style={styles.menuNavItem} className="bt-row" onClick={() => { haptic("light"); setActiveView("market"); setIsMenuOpen(false); }}>
                  <div style={{ ...styles.menuNavIconBadge, background: themes.pink.grad }}><Icons.Gamepad /></div>
                  <span style={styles.menuNavText}>O'yin & Market</span>
                  <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                </button>
                <button style={styles.menuNavItem} className="bt-row" onClick={() => { haptic("light"); setActiveView("study"); setIsMenuOpen(false); }}>
                  <div style={{ ...styles.menuNavIconBadge, background: themes.teal.grad }}><Icons.Book /></div>
                  <span style={styles.menuNavText}>O'qish va Imtihonlar</span>
                  <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                </button>
                <button style={styles.menuNavItem} className="bt-row" onClick={() => { haptic("light"); setActiveView("jobs"); setIsMenuOpen(false); }}>
                  <div style={{ ...styles.menuNavIconBadge, background: themes.violet.grad }}><Icons.Briefcase /></div>
                  <span style={styles.menuNavText}>Ishga Vakansiya</span>
                  <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                </button>
              </div>

              <div style={styles.drawerGroupLabel}>Hisob</div>
              <div style={styles.menuNavList}>
                <button style={styles.menuNavItem} className="bt-row" onClick={() => { haptic("light"); setActiveView("profile"); setIsMenuOpen(false); }}>
                  <div style={{ ...styles.menuNavIconBadge, background: "linear-gradient(135deg,#7E7694,#5A536E)" }}><Icons.User /></div>
                  <span style={styles.menuNavText}>Profil va sozlamalar</span>
                  <span style={styles.arrowRight}><Icons.ChevronRight /></span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===================== ПЛАВАЮЩАЯ КНОПКА BITTA AI ===================== */}
      {!isAiOpen && (
        <button
          style={styles.aiFab}
          className="bt-ai-fab"
          onClick={() => { haptic("light"); setIsAiOpen(true); }}
        >
          <Icons.Bot />
          <span>BITTA AI</span>
        </button>
      )}

      {/* ===================== ЧАТ BITTA AI ===================== */}
      {isAiOpen && (
        <>
          <div style={styles.backdrop} className="bt-backdrop" onClick={() => setIsAiOpen(false)} />
          <div style={{ ...styles.bottomSheet, height: "78vh", display: "flex", flexDirection: "column" }} className="bt-sheet">
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}><Icons.Bot /> BITTA AI</div>
              <button style={styles.closeModalBtn} className="bt-close-btn" onClick={() => setIsAiOpen(false)}><Icons.Close /></button>
            </div>

            <div style={styles.aiMessagesList}>
              {aiMessages.length === 0 && (
                <div style={styles.aiEmptyState}>
                  <Icons.Bot />
                  <p style={{ margin: "10px 0 0 0" }}>Salom! Men BITTA AI — savolingiz bo'lsa, yozing: donatlar, CEFR, prava yoki ish qidirish bo'yicha yordam beraman.</p>
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} style={m.role === "user" ? styles.aiBubbleUser : styles.aiBubbleAssistant}>
                  {m.text}
                </div>
              ))}
              {isAiLoading && (
                <div style={styles.aiBubbleAssistant}>
                  <span className="bt-ai-typing"><span></span><span></span><span></span></span>
                </div>
              )}
              {aiError && <div style={{ color: "#FF9DAF", fontSize: "12px", textAlign: "center" }}>{aiError}</div>}
            </div>

            <div style={styles.aiInputRow}>
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendAi(); }}
                placeholder="Savolingizni yozing..."
                style={styles.aiInput}
                disabled={isAiLoading}
              />
              <button style={styles.aiSendBtn} className="bt-primary-btn" onClick={handleSendAi} disabled={isAiLoading || !aiInput.trim()}>
                <Icons.Send />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===================== СТИЛИ (JS OBJECT) =====================

const styles: Record<string, React.CSSProperties> = {
  aiFab: {
    position: "fixed",
    bottom: "20px",
    right: "16px",
    zIndex: 500,
    display: "flex",
    alignItems: "center",
    gap: "7px",
    background: "linear-gradient(135deg,#B98BFF,#6E6BFF)",
    color: "#FFF",
    border: "none",
    borderRadius: "999px",
    padding: "12px 18px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  aiMessagesList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "14px 2px",
  },
  aiEmptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    color: "#A79FC2",
    fontSize: "13px",
    lineHeight: 1.5,
    padding: "30px 14px",
  },
  aiBubbleUser: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    background: "linear-gradient(135deg,#B98BFF,#6E6BFF)",
    color: "#FFF",
    borderRadius: "14px 14px 2px 14px",
    padding: "10px 13px",
    fontSize: "13.5px",
    lineHeight: 1.45,
  },
  aiBubbleAssistant: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    background: "rgba(255,255,255,0.06)",
    color: "#E0D7F5",
    borderRadius: "14px 14px 14px 2px",
    padding: "10px 13px",
    fontSize: "13.5px",
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
  },
  aiInputRow: {
    display: "flex",
    gap: "8px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  aiInput: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "11px 14px",
    color: "#FFF",
    fontSize: "13.5px",
    outline: "none",
  },
  aiSendBtn: {
    background: "linear-gradient(135deg,#B98BFF,#6E6BFF)",
    border: "none",
    borderRadius: "12px",
    width: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    cursor: "pointer",
    flex: "0 0 auto",
    boxShadow: "0 4px 14px rgba(185,139,255,0.3)",
  },
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
    top: "50%",
    transform: "translateY(-50%)",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
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
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
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
    display: "flex",
    alignItems: "center",
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
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
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
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
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
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
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
    display: "flex",
    alignItems: "center",
    gap: "8px",
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

  // ===== Навигация (профиль/назад в хедере) =====
  iconNavBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#FFF",
    cursor: "pointer",
    flexShrink: 0,
  },

  // ===== Поиск на главной (вынесен из хедера, во всю ширину) =====
  searchWrapperFull: {
    position: "relative",
    marginBottom: "18px",
  },
  searchInputFull: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
    padding: "13px 40px",
    color: "#FFF",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  // ===== 3 крупные карточки-раздела на главной =====
  categoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "18px",
  },
  categoryCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "14px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  categoryIconBadge: {
    width: "46px",
    height: "46px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    flexShrink: 0,
  },
  categoryTextWrap: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0,
  },
  categoryTitle: {
    fontSize: "14.5px",
    fontWeight: 700,
    color: "#FFF",
  },
  categorySub: {
    fontSize: "11.5px",
    color: "#A79FC2",
    marginTop: "2px",
  },

  // ===== Крупные кнопки внутри раздела (O'yin & Market, Ishga Vakansiya) =====
  bigTileList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  bigTile: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "16px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  bigTileIconBadge: {
    width: "52px",
    height: "52px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    flexShrink: 0,
  },

  // ===== Профиль =====
  profileWrap: {
    display: "flex",
    flexDirection: "column",
    paddingBottom: "20px",
  },
  profileCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "22px 0 18px 0",
  },
  profileAvatarImg: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "10px",
  },
  profileAvatarFallback: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg,#B98BFF,#6E6BFF)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    marginBottom: "10px",
  },
  profileName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#FFF",
  },
  profileUsername: {
    fontSize: "12.5px",
    color: "#A79FC2",
    marginTop: "2px",
  },
  profileSectionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#7E7694",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    margin: "18px 0 8px 2px",
  },
  langRow: {
    display: "flex",
    gap: "8px",
  },
  langPill: {
    flex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "9px",
    color: "#A79FC2",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  langPillActive: {
    background: "linear-gradient(135deg,#B98BFF,#6E6BFF)",
    borderColor: "transparent",
    color: "#FFF",
  },

  // ===== Боковое меню: список разделов (вместо старого меню языка/поддержки) =====
  drawerGroupLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#7E7694",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    margin: "14px 0 8px 2px",
  },
  menuNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  menuNavItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "12px",
    padding: "11px 12px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  menuNavIconBadge: {
    width: "32px",
    height: "32px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFF",
    flexShrink: 0,
  },
  menuNavText: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#FFF",
    flexGrow: 1,
  },
};