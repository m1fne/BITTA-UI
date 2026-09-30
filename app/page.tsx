"use client";
import WalletView from "./components/wallet";
import HistoryView from "./components/history";


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

type ShopType = "pubg" | "freefire" | "premium" | "mlbb";


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
  { 
    title: string; 
    placeholder: string; 
    packs: { name: string; price: string; icon?: string; scale?: number }[] 
  }
> = {
pubg: {
    title: "PUBG Mobile UC",
    placeholder: "Player ID (masalan: 5123456789)",
    packs: [
      { name: "60 UC", price: "13,000 UZS", icon: "/pubgmobileuc.png" },
      { name: "325 UC", price: "58,000 UZS", icon: "/325uc.png", scale: 1.4 },
      { name: "660 UC", price: "115,000 UZS", icon: "/660uc.png", scale: 2.5 }, // <--- ЗУМ 2.8x
      { name: "1800 UC", price: "285,000 UZS", icon: "/1800uc.png", scale: 1.2 },
      { name: "3850 UC", price: "560,000 UZS", icon: "/3850uc.png", scale: 1.3 },
      { name: "8100 UC", price: "1,130,000 UZS", icon: "/8100uc.png", scale: 1.5 },
    ],
  },
  freefire: {
    title: "Free Fire Almazlar",
    placeholder: "Player ID (masalan: 78291044)",
    packs: [
      { name: "110 Almaz", price: "12,000 UZS" },
      { name: "341 Almaz", price: "32,000 UZS" },
      { name: "572 Almaz", price: "53,000 UZS" },
      { name: "1166 Almaz", price: "101,000 UZS" },
      { name: "2398 Almaz", price: "199,000 UZS" },
      { name: "6160 Almaz", price: "495,000 UZS" },
    ],
  },
mlbb: {
    title: "Mobile Legends",
    placeholder: "User ID va Zone ID kiriting (masalan: 12345678 1234)",
    packs: [
      { name: "14 Diamonds", price: "5 000 so'm" },
      { name: "42 Diamonds", price: "11 000 so'm" },
      { name: "170 Diamonds", price: "38 000 so'm" },
      { name: "284 Diamonds", price: "62 000 so'm"},
      { name: "706 Diamonds", price: "115 000 so'm" },
      { name: "1084 diamonds", price: "220 000 so'm" },
      { name: "3688 diamonds", price: "590 000 so'm" },
    ],
  },
  premium: {
    title: "Telegram Premium",
    placeholder: "Telegram Username (masalan: @username)",
    packs: [
      { name: "3 Oy ", price: "160,000 UZS", icon: "/tg_prem_icon.png" },
      { name: "6 Oy ", price: "220,000 UZS", icon: "/tg_prem_icon.png" },
      { name: "12 Oy ", price: "390,000 UZS", icon: "/tg_prem_icon.png" },
    ],
  },
};

const gameLogos: Record<string, string> = {
  pubg: "/pubg_mobile.jpg",
  freefire: "/ff_diamonds.jpg",
  premium: "/telegram_premium.jpg",
  mlbb: "/mobile_legends.jpg",
};

const shopImages: Record<string, string> = {
  pubg: "/pubgmobileuc.png",
  freefire: "/ffdiamonds.png",
  telegram: "/tg_prem_icon.png.png",
  mlbb: "/mlbbdiamonds.png",
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
  premium: themes.violet,
  mlbb: themes.teal, // Добавили тему для Mobile Legends
};

// Иконки для заголовков модалок (вместо emoji)
const shopIcons: Record<ShopType, () => JSX.Element> = {
  pubg: Icons.Gamepad,
  freefire: Icons.Diamond,
  premium: Icons.Premium,
  mlbb: () => (
    <img 
      src="/mobile_legends.jpg" 
      alt="MLBB" 
      style={{ width: "20px", height: "20px", borderRadius: "4px", objectFit: "cover" }} 
    />
  ),
};



// ===================== КОМПОНЕНТ =====================

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  // ✅ Безопасное получение пользователя Telegram (не ломает Next.js на сервере)
  const u = typeof window !== "undefined" 
    ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user 
    : null;

  // Навигация: home -> market -> wallet -> history -> profile
  const [activeView, setActiveView] = useState<"home" | "market" | "wallet" | "history" | "profile">("home");
  
  // Выбор языка в профиле
  const [uiLanguage, setUiLanguage] = useState<"uz" | "ru" | "en">("uz");

  // Покупка в магазине (списание с баланса)
  const [buyError, setBuyError] = useState("");
  const [isBuying, setIsBuying] = useState(false);

  // ПОПОЛНЕНИЕ БАЛАНСА
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpReceiptName, setTopUpReceiptName] = useState("");
  const [topUpReceiptFile, setTopUpReceiptFile] = useState<File | null>(null);
  const [topUpCopied, setTopUpCopied] = useState(false);
  const [topUpStatus, setTopUpStatus] = useState<"idle" | "submitting" | "pending" | "approved" | "rejected" | "error">("idle");
  const [topUpError, setTopUpError] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);

  // МАРКЕТ / МАГАЗИН
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeShopType, setActiveShopType] = useState<ShopType | null>(null);
  const [shopStep, setShopStep] = useState(1); // 1 tanlash, 2 malumot, 3 tolov, 4 tayyor
  const [selectedPack, setSelectedPack] = useState<{ name: string; price: string } | null>(null);
  const [userCredential, setUserCredential] = useState("");

  // МОДАЛКИ FAQ И ОФЕРТЫ
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleOpenFaq = () => setIsFaqOpen(true);
  const handleOpenTerms = () => setIsTermsOpen(true);



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
      
      if (res.ok && typeof data.balance === "number") {
        setUserBalance(data.balance);
      } else {
        // Показывает точную причину прямо в приложении
        console.log("ОБРАБОТКА БАЛАНСА:", res.status, data);
      }
    } catch (err) {
      console.error("Ошибка сети баланса:", err);
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
      const initData = getInitData() || (window.Telegram?.WebApp?.initData ?? "");

      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: initData,
          service: activeShopType,
          productName: selectedPack.name,
          targetId: userCredential.trim(),
          price: parseInt(selectedPack.price.replace(/[^\d]/g, ""), 10),
        }),
      });

      const data: any = await res.json();

      if (!res.ok || !data.success) {
        const details = data.details ? JSON.stringify(data.details) : "";
        const errorMessage = `${data.error || "XATOLIK"}${details ? " - " + details : ""}`;
        
        setBuyError(errorMessage);
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
      {activeView === "wallet" && "Hamyon"}
      {activeView === "history" && "Tarix"}
      {activeView === "profile" && "Profil"}
    </span>
  </div>

  <div style={{ flex: 1 }} />

  {/* КЛИК НА БАЛАНС ОТКРЫВАЕТ МОДАЛКУ ПОПОЛНЕНИЯ */}
  <button style={styles.topUpHeaderBtn} className="bt-primary-btn" onClick={handleOpenTopUp}>
    <Icons.Wallet />
    <span>{userBalance.toLocaleString("uz-UZ")} UZS</span>
  </button>

  <button style={styles.burgerButton} className="bt-secondary-btn" onClick={() => { haptic("light"); setIsMenuOpen(true); }}>
    <div style={styles.burgerLine}></div>
    <div style={{ ...styles.burgerLine, width: "16px" }}></div>
  </button>
</header>

{/* ===================== 1. ГЛАВНАЯ ===================== */}
{activeView === "home" && (
  <>
{/* HERO / KATALOG */}
    <section style={{ ...styles.hero, paddingBottom: '4px', paddingTop: '8px' }}>
      <div style={{
        ...styles.heroBadge,
        background: 'rgba(184, 139, 255, 0.12)',
        border: '1px solid rgba(184, 139, 255, 0.25)',
        color: '#D1B3FF',
        fontSize: '11px',
        fontWeight: '600',
        padding: '4px 10px',
        borderRadius: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <Icons.Sparkle /> Bitta ilovada — hammasi
      </div>
      <h1 style={{ 
        fontFamily: "'Plus Jakarta Sans', sans-serif", 
        fontSize: '24px', 
        fontWeight: '800', 
        letterSpacing: '-0.5px',
        color: '#FFFFFF',
        marginTop: '8px', 
        marginBottom: '0' 
      }}>
        Katalog
      </h1>
    </section>
{/* ВИТРИНА ИГР И СЕРВИСОВ (Чистая сетка 3 колонки без внешних CSS) */}
    <div style={{ padding: '0 10px', marginTop: '16px', marginBottom: '24px' }}>
      <div style={{ 
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '14px', 
        fontWeight: '700', 
        color: '#FFFFFF', 
        marginBottom: '10px',
        paddingLeft: '2px'
      }}>
        O'yinlar va Xizmatlar
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        width: '100%'
      }}>
        {[
          { id: "pubg", title: "PUBG Mobile", img: "/pubg_mobile.jpg" },
          { id: "freefire", title: "Free Fire", img: "/ff_diamonds.jpg" },
          { id: "premium", title: "Telegram Premium", img: "/telegram_premium.jpg" },
          { id: "mlbb", title: "Mobile Legends", img: "/mobile_legends.jpg" },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => {
              haptic("light");
              handleOpenShop(item.id as any);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '4px 4px 6px 4px', /* Минимальный padding: картинка почти вплотную к краю */
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              textAlign: 'center',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <img 
              src={item.img} 
              alt={item.title} 
              style={{ 
                width: '100%', 
                aspectRatio: '1/1', 
                objectFit: 'cover', 
                borderRadius: '9px',
                marginBottom: '4px' 
              }} 
            />
            <span style={{ 
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '11px', 
              fontWeight: '700', 
              color: '#FFFFFF', 
              lineHeight: '1.15',
              letterSpacing: '-0.1px',
              wordBreak: 'break-word'
            }}>
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
    {/* РЕКЛАМА */}
    <section style={{ marginBottom: "20px", padding: "0 16px" }}>
      <div 
        className="bt-tile" 
        onClick={() => openTelegramLink("https://t.me/bitta_mngr")}
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "16px",
          cursor: "pointer"
        }}
      >
        <div style={{ fontSize: "12px", color: "#38ef7d", fontWeight: "600", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Icons.Sparkle /> Reklama xizmati
        </div>
        <div style={{ fontSize: "15px", fontWeight: "700", color: "#FFF", marginBottom: "4px" }}>
          Bitta-da o'z brendingizni e'lon qiling!
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "10px" }}>
          Kanal, bot yoki xizmatlarni minglab faol foydalanuvchilarga ko'rsating.
        </div>
        <span style={{ fontSize: "13px", color: "#0088cc", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
          Murojaat qilish (@bitta_mngr) <Icons.ChevronRight />
        </span>
      </div>
    </section>
  </>
)}
{/* ===================== 2. КОШЕЛЁК (HAMYON) ===================== */}
{activeView === "wallet" && (
  <WalletView 
    balance={userBalance} 
    onOpenDeposit={handleOpenTopUp} 
  />
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
              <button style={{ ...styles.langPill, ...(uiLanguage === "en" ? styles.langPillActive : {}) }} onClick={() => setUiLanguage("en")}>Qaraqalpaq</button>
            </div>
            <p style={{ fontSize: "11px", color: "#7E7694", margin: "6px 0 20px 0" }}>Boshqa tillar tez orada qo'shiladi.</p>

            <div style={styles.profileSectionLabel}>Yordam</div>
            <div style={styles.menuList}>
              <button style={styles.menuItem} onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
                <Icons.Headphones /> Qo'llab-quvvatlash (@bitta_mngr)
              </button>
              <button style={styles.menuItem} onClick={() => openTelegramLink("https://t.me/bitta_hub")}>
                <Icons.Megaphone /> Rasmiy kanal 
              </button>
            </div>
          </div>
        )}
      </div>

      {activeView === "history" && (
  <HistoryView telegramId={u?.id || 0} />
)}

{/* ===================== ПОЛНОЭКРАННОЕ ОКНО: BALANS TO'LDIRISH ===================== */}
{isTopUpOpen && (
  <div 
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: '65px', // Отступ снизу, чтобы НЕ перекрывать Нижнее Меню
      background: '#0d0f17', // Тёмный фон приложения
      zIndex: 99,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {/* ВЕРХНЯЯ ПАНЕЛЬ С КНОПКОЙ «НАЗАД / ЗАКРЫТЬ» */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      position: 'sticky',
      top: 0,
      background: '#0d0f17',
      zIndex: 10,
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <button 
        onClick={() => {
          haptic("light");
          setIsTopUpOpen(false);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFF',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        ‹ Orqaga
      </button>

      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#a855f7', display: 'flex', alignItems: 'center' }}><Icons.Wallet /></span>
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>
          Balans to'ldirish
        </span>
      </div>

      {/* Кнопка закрытия (если разрешено статусом) */}
      <div>
        {(topUpStatus === "idle" || topUpStatus === "error" || topUpStatus === "approved" || topUpStatus === "rejected") ? (
          <button 
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer', display: 'flex' }} 
            onClick={() => setIsTopUpOpen(false)}
          >
            <Icons.Close />
          </button>
        ) : (
          <div style={{ width: '24px' }}></div>
        )}
      </div>
    </div>

    {/* КОНТЕНТ СТРАНИЦЫ */}
    <div style={{ padding: '16px', flex: 1 }}>
      {(topUpStatus === "idle" || topUpStatus === "submitting" || topUpStatus === "error") ? (
        <div>
          {/* КАРТОЧКА ДЛЯ ОПЛАТЫ */}
          <div style={styles.paymentCard}>
            <p style={styles.paymentText}>
              Plastik kartamizga to'lovni amalga oshiring:
            </p>
            <div style={styles.cardBox}>
              <span style={styles.cardNumber}>9860 1966 1961 4445</span>
              <button
                style={styles.copyBtn}
                className="bt-copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText("9860196619614445");
                  haptic("light");
                  setTopUpCopied(true);
                  setTimeout(() => setTopUpCopied(false), 1500);
                }}
              >
                {topUpCopied ? <><Icons.CheckSmall /> Nusxalandi!</> : "Nusxa olish"}
              </button>
            </div>
            <div style={styles.cardHolder}>Karta egasi: MUSA X.</div>
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
            style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%", marginTop: "24px", opacity: topUpStatus === "submitting" ? 0.7 : 1 }}
            className="bt-primary-btn"
            onClick={handleFinishTopUp}
            disabled={topUpStatus === "submitting"}
          >
            {topUpStatus === "submitting" ? "Yuborilmoqda..." : <><Icons.Rocket /> To'lovni tasdiqlash</>}
          </button>
        </div>
      ) : topUpStatus === "pending" ? (
        <div style={{ ...styles.successBox, padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ color: "#FFD166", marginBottom: "12px", display: 'flex', justifyContent: 'center' }}>
            <Icons.Clock />
          </div>
          <div style={styles.successTitle}>Tekshirilmoqda...</div>
          <div style={styles.successSub}>
            To'lov so'rovingiz adminga yuborildi. Tasdiqlangach bu oyna avtomatik yangilanadi — hech narsa qilish shart emas.
          </div>
        </div>
      ) : topUpStatus === "approved" ? (
        <div style={{ ...styles.successBox, padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ color: "#3DDC97", marginBottom: "12px", display: 'flex', justifyContent: 'center' }}>
            <Icons.Check />
          </div>
          <div style={styles.successTitle}>Balans to'ldirildi!</div>
          <div style={styles.successSub}>
            Joriy balansingiz: <strong style={{ color: "#3DDC97" }}>{userBalance.toLocaleString("uz-UZ")} UZS</strong>
          </div>
          <button
            style={{ ...styles.btnPrimary, background: "#3DDC97", color: "#000", fontWeight: "700", width: "100%", marginTop: "20px" }}
            className="bt-primary-btn"
            onClick={() => setIsTopUpOpen(false)}
          >
            Tushunarli
          </button>
        </div>
      ) : (
        <div style={{ ...styles.successBox, padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ color: "#FF9DAF", marginBottom: "12px", display: 'flex', justifyContent: 'center' }}>
            <Icons.XCircle />
          </div>
          <div style={styles.successTitle}>So'rov rad etildi</div>
          <div style={styles.successSub}>
            To'lov tasdiqlanmadi. Agar bu xato bo'lsa, @bitta_mngr ga yozing yoki qaytadan urinib ko'ring.
          </div>
          <button
            style={{ ...styles.btnPrimary, background: themes.violet.grad, width: "100%", marginTop: "20px" }}
            className="bt-primary-btn"
            onClick={handleOpenTopUp}
          >
            Qayta urinish
          </button>
        </div>
      )}
    </div>
  </div>
)}

{/* ===================== ПОЛНОЭКРАННОЕ ОКНО МАГАЗИНА ===================== */}
{isShopOpen && activeShopType && (
  <div 
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: '65px', // Отступ снизу, чтобы НЕ перекрывать ваше Нижнее Меню
      background: '#0d0f17', // Тёмный фон приложения
      zIndex: 99,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {/* ВЕРХНЯЯ ПАНЕЛЬ С КНОПКОЙ «НАЗАД» */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      position: 'sticky',
      top: 0,
      background: '#0d0f17',
      zIndex: 10,
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <button 
        onClick={() => {
          haptic("light");
          if (shopStep === 2) {
            setShopStep(1);
          } else {
            setIsShopOpen(false);
          }
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#FFF',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        ‹ Orqaga
      </button>

      {/* Аватарка и Название игры */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {gameLogos[activeShopType] ? (
          <img 
            src={gameLogos[activeShopType]} 
            alt="Game Logo" 
            style={{ width: '24px', height: '24px', borderRadius: '6px', objectFit: 'cover' }} 
          />
        ) : (
          (() => { const ShopIcon = shopIcons[activeShopType]; return <ShopIcon />; })()
        )}
        <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>
          {shopProducts[activeShopType].title}
        </span>
      </div>

      {/* Пустой блок для выравнивания заголовка по центру */}
      <div style={{ width: '60px' }}></div>
    </div>

    {/* КОНТЕНТ СТРАНИЦЫ */}
    <div style={{ padding: '16px', flex: 1 }}>

      {/* ШАГ 1: ВЫБОР ТАРИФА (СЕТКА ПАКЕТОВ) */}
      {shopStep === 1 && (
        <div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '14px' }}>
            Paketni tanlang
          </p>
          
          {/* Сетка тарифов (по 2 в ряд) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
          }}>
            {shopProducts[activeShopType].packs.map((pack: any, idx: number) => {
              const packIcon = pack.icon || shopImages[activeShopType];

              return (
                <button
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '14px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  className="bt-pack-card"
                  onClick={() => {
                    haptic("light");
                    handleSelectPack(pack);
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF', lineHeight: '1.2' }}>
                      {pack.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a855f7', fontWeight: '600', marginTop: '6px' }}>
                      {pack.price}
                    </div>
                  </div>

                  {packIcon && (
                    <img
                      src={packIcon}
                      alt="icon"
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        flexShrink: 0,
                        transform: pack.scale ? `scale(${pack.scale})` : 'none'
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ШАГ 2: ВВОД PLAYER ID И ОПЛАТА */}
      {shopStep === 2 && selectedPack && (
        <div>
          {/* Сводка заказа */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '14px',
            marginBottom: '16px',
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Tanlangan paket: <span style={{ color: "#FFF", fontWeight: 700 }}>{selectedPack.name}</span>
            <div style={{ fontSize: '15px', color: '#a855f7', fontWeight: '700', marginTop: '4px' }}>
              {selectedPack.price}
            </div>
          </div>

          {/* Ввод ID */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '6px' }}>
              {shopProducts[activeShopType].placeholder || "Player ID kiriting"}
            </p>
            <input
              type="text"
              placeholder={shopProducts[activeShopType].placeholder}
              value={userCredential}
              onChange={(e) => setUserCredential(e.target.value)}
              style={styles.input}
              className="bt-search-input"
            />
          </div>

          {/* Ошибка */}
          {buyError && (
            <div style={{ color: "#FF9DAF", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              <span>{buyError}</span>
              {buyError === "Balansingiz yetarli emas." && (
                <button
                  style={{ ...styles.btnPrimary, background: "linear-gradient(135deg,#B98BFF,#6E6BFF)" }}
                  className="bt-primary-btn"
                  onClick={() => { haptic("medium"); setIsShopOpen(false); handleOpenTopUp(); }}
                >
                  <Icons.Wallet /> Hisobni to'ldirish
                </button>
              )}
            </div>
          )}

          {/* Кнопка Покупки */}
          <button
            style={{ 
              ...styles.btnPrimary, 
              width: '100%',
              padding: '14px',
              background: shopTheme[activeShopType]?.grad || "linear-gradient(135deg,#B98BFF,#6E6BFF)", 
              opacity: isBuying ? 0.7 : 1 
            }}
            className="bt-primary-btn"
            onClick={() => { haptic("medium"); handleBuy(); }}
            disabled={isBuying}
          >
            {isBuying ? "Yuborilmoqda..." : "Sotib olish"}
          </button>
        </div>
      )}

      {/* ШАГ 4: УСПЕШНЫЙ ЗАКАЗ */}
      {shopStep === 4 && (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <div style={{ color: "#3DDC97", marginBottom: "12px", display: 'flex', justifyContent: 'center' }}>
            <Icons.Check />
          </div>
          <div style={styles.successTitle}>Buyurtma qabul qilindi!</div>
          <div style={{ ...styles.successSub, marginBottom: '20px' }}>
            Tez orada buyurtmangiz bajariladi va sizga xabar beriladi.
          </div>
          
          <button
            style={{ ...styles.btnPrimary, background: "#3DDC97", color: "#000", fontWeight: "700", width: "100%" }}
            className="bt-primary-btn"
            onClick={() => { haptic("light"); setIsShopOpen(false); }}
          >
            Tushunarli
          </button>
        </div>
      )}
    </div>
  </div>
)}


      {/* ===================== FOOTER (ПОДВАЛ) ===================== */}
<footer style={{
  marginTop: '28px',
  paddingBottom: '80px', // Запас снизу, чтобы плавающая кнопка BITTA AI не перекрывала текст!
  textAlign: 'center',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  paddingTop: '16px'
}}>
  {/* Навигация мелким текстом */}
  <div style={{
    display: 'flex',
    justifyContent: 'center', // 1. Исправлено с justify на justifyContent
    alignItems: 'center',
    gap: '12px',
    marginBottom: '10px'
  }}>
    <button 
      onClick={() => handleOpenFaq()} 
      style={{
        background: 'none',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '11px',
        cursor: 'pointer',
        padding: 0
      }}
    >
      Savol-javoblar (FAQ)
    </button>

    <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '10px' }}>•</span>

    <button 
      onClick={() => handleOpenTerms()} 
      style={{
        background: 'none',
        border: 'none',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '11px',
        cursor: 'pointer',
        padding: 0
      }}
    >
      Foydalanish shartlari
    </button>
  </div>

  {/* Копирайт и версия */}
  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.3)' }}>
    © 2026 BITTA Platform. Barcha huquqlar himoyalangan.
  </div>
</footer>

{/* ===================== МОДАЛКА FAQ ===================== */}
{isFaqOpen && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  }}>
    <div style={{
      background: '#181528',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '20px',
      width: '100%',
      maxWidth: '480px',
      maxHeight: '80vh',
      overflowY: 'auto',
      padding: '20px',
      color: '#FFFFFF'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Savol-javoblar (FAQ)</h3>
        <button 
          onClick={() => setIsFaqOpen(false)}
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFF', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}
        >✕</button>
      </div>

      <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.8)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          {/* 2. Цифра 1 перенесена внутрь <b> для единообразия */}
          <b style={{ color: '#FFF' }}>1. Hisobni to'ldirish qanday amalga oshiriladi?</b>
          <p style={{ margin: '4px 0 0 0' }}>Barcha xaridlar Player ID orqali to'g'ridan-to'g me'yoriy tartibda o'yinga tushiriladi. Parol berish shart emas.</p>
        </div>
        <div>
          <b style={{ color: '#FFF' }}>2. Valyuta qancha vaqtda tushadi?</b>
          <p style={{ margin: '4px 0 0 0' }}>95% holatlarda to'lov qiliningach 1-5 daqiqa ichida tushadi. Ba'zan server yuklanishi sabab 24 soatgacha cho'zilishi mumkin.</p>
        </div>
        <div>
          <b style={{ color: '#FFF' }}>3. ID xato kiritilsa nima bo'ladi?</b>
          <p style={{ margin: '4px 0 0 0' }}>To'lovdan oldin ID raqamingizni tekshiring. Agar valyuta noto'g'ri IDga tushgan bo'lsa, qaytarish imkonsiz.</p>
        </div>
        <div>
          <b style={{ color: '#FFF' }}>4. Qanday to'lov turlari bor?</b>
          <p style={{ margin: '4px 0 0 0' }}>Uzcard, Humo, Payme, Click va BITTA ichki balansi orqali to'lash mumkin.</p>
        </div>
      </div>
    </div>
  </div>
)}

{/* ===================== МОДАЛКА OFERTA ===================== */}
{isTermsOpen && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px'
  }}>
    <div style={{
      background: '#181528',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '20px',
      width: '100%',
      maxWidth: '480px',
      maxHeight: '80vh',
      overflowY: 'auto',
      padding: '20px',
      color: '#FFFFFF'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Foydalanish shartlari</h3>
        <button 
          onClick={() => setIsTermsOpen(false)}
          style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: '#FFF', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}
        >✕</button>
      </div>

      <div style={{ fontSize: '12px', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 3. Цифра 1 внесена внутрь тега <p> */}
        <p><b>1. Umumiy qoidalar:</b> BITTA platformasi raqamli xizmatlar va o'yin valyutalarini yetkazib beruvchi mustaqil servis hisoblanadi.</p>
        <p><b>2. Mas'uliyat:</b> Foydalanuvchi kiritgan Player ID rekvizitlari to'g'riligiga o'zi javobgar. Noto'g'ri ID uchun mablag' qaytarilmaydi.</p>
        <p><b>3. Qaytarish shartlari:</b> Muvaffaqiyatli yetkazilgan raqamli tovarlar qaytarib olinmaydi va almashtirilmaydi.</p>
      </div>
    </div>
  </div>
)}
{/* ===================== НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (BOTTOM NAV) ===================== */}
<div style={{
  position: 'fixed',
  bottom: '12px',
  left: '16px',
  right: '16px',
  height: '62px',
  backgroundColor: 'rgba(18, 14, 32, 0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  zIndex: 1000,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
}}>
  {/* 1. Bosh sahifa */}
  <button
    onClick={() => {
      if (typeof haptic === 'function') haptic("light");
      setActiveView("home");
    }}
    style={{
      background: 'none',
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      color: activeView === 'home' ? '#A855F7' : 'rgba(255, 255, 255, 0.4)',
      cursor: 'pointer',
      outline: 'none'
    }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="2"/>
      <rect x="14" y="3" width="7" height="7" rx="2"/>
      <rect x="14" y="14" width="7" height="7" rx="2"/>
      <rect x="3" y="14" width="7" height="7" rx="2"/>
    </svg>
    <span style={{ fontSize: '10px', fontWeight: activeView === 'home' ? '700' : '500' }}>Bosh sahifa</span>
  </button>

  {/* 2. Hamyon */}
  <button
    onClick={() => {
      if (typeof haptic === 'function') haptic("light");
      setActiveView("wallet");
    }}
    style={{
      background: 'none',
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      color: activeView === 'wallet' ? '#A855F7' : 'rgba(255, 255, 255, 0.4)',
      cursor: 'pointer',
      outline: 'none'
    }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
    <span style={{ fontSize: '10px', fontWeight: activeView === 'wallet' ? '700' : '500' }}>Hamyon</span>
  </button>

  {/* 3. Tarix */}
  <button
    onClick={() => {
      if (typeof haptic === 'function') haptic("light");
      setActiveView("history");
    }}
    style={{
      background: 'none',
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      color: activeView === 'history' ? '#A855F7' : 'rgba(255, 255, 255, 0.4)',
      cursor: 'pointer',
      outline: 'none'
    }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    <span style={{ fontSize: '10px', fontWeight: activeView === 'history' ? '700' : '500' }}>Tarix</span>
  </button>

  {/* 4. Profil */}
  <button
    onClick={() => {
      if (typeof haptic === 'function') haptic("light");
      setActiveView("profile");
    }}
    style={{
      background: 'none',
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '3px',
      color: activeView === 'profile' ? '#A855F7' : 'rgba(255, 255, 255, 0.4)',
      cursor: 'pointer',
      outline: 'none'
    }}
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    <span style={{ fontSize: '10px', fontWeight: activeView === 'profile' ? '700' : '500' }}>Profil</span>
  </button>
</div>

{/* ===================== AI УДАЛЁН ===================== */}

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