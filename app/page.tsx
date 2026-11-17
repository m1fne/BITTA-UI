"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import WalletView from "./components/wallet";
import HistoryView from "./components/history";
import { translate, type Lang, type TKey } from "./i18n";

// ===================== ТИПЫ TELEGRAM =====================

declare global {
  interface Window {
    Telegram?: { WebApp: any };
  }
}

type ShopType = "pubg" | "freefire" | "premium" | "mlbb" | "bloodstrike";
type View = "home" | "wallet" | "history" | "profile";
type Pack = { name: string; price: number; icon?: string; scale?: number; tab?: "UC" | "SHOP"; months?: number };

// ===================== КАТАЛОГ =====================
// ВАЖНО: поле name уходит на сервер и по нему определяется товар — не меняйте названия.

const SHOPS: Record<
  ShopType,
  { title: string; logo: string; packIcon: string; accent: string; accent2: string; hasTabs?: boolean; packs: Pack[] }
> = {
  pubg: {
    title: "PUBG Mobile",
    logo: "/pubg_mobile.jpg",
    packIcon: "/pubgmobileuc.png",
    accent: "#FF5F7E",
    accent2: "#FF9D5C",
    hasTabs: true,
    packs: [
      { name: "60 UC", price: 13000, icon: "/pubgmobileuc.png", tab: "UC" },
      { name: "325 UC", price: 58000, icon: "/325uc.png", scale: 1.4, tab: "UC" },
      { name: "660 UC", price: 115000, icon: "/660uc.png", scale: 2.5, tab: "UC" },
      { name: "1800 UC", price: 285000, icon: "/1800uc.png", scale: 1.2, tab: "UC" },
      { name: "3850 UC", price: 560000, icon: "/3850uc.png", scale: 1.3, tab: "UC" },
      { name: "8100 UC", price: 1130000, icon: "/8100uc.png", scale: 1.5, tab: "UC" },

      { name: "Prime (1 Month)", price: 14000, icon: "/prime_month.png", tab: "SHOP" },
      { name: "Prime (3 Months)", price: 36000, icon: "/prime_month.png", tab: "SHOP" },
      { name: "Prime (6 Months)", price: 70000, icon: "/prime_month.png", tab: "SHOP" },
      { name: "Prime (12 Months)", price: 135000, icon: "/prime_year.png", tab: "SHOP" },

      { name: "Prime Plus (1 Month)", price: 120000, icon: "/prime_plus_month.png", tab: "SHOP" },
      { name: "Prime Plus (3 Months)", price: 330000, icon: "/prime_plus_month.png", tab: "SHOP" },
      { name: "Prime Plus (6 Months)", price: 639000, icon: "/prime_plus_month.png", tab: "SHOP" },
      { name: "Prime Plus (12 Months)", price: 1350000, icon: "/prime_plus_year.webp", tab: "SHOP" },

      { name: "First Purchase Pack", price: 15000, icon: "/first_purchase_pack.webp", tab: "SHOP" },
      { name: "Weekly Deal Pack 1", price: 15000, icon: "/pack.webp", tab: "SHOP" },
      { name: "Weekly Deal Pack 2", price: 36000, icon: "/pack.webp", tab: "SHOP" },
      { name: "Weekly Mythic Emblem Value Pack", price: 36000, icon: "/pack.webp", tab: "SHOP" },
      { name: "Mythic Emblem Pack", price: 60000, icon: "/pack_3.webp", tab: "SHOP" },
      // "Upgradable Firearm Materials Pack" убран: его нет в каталоге Ludovex, покупка всё равно не прошла бы.
    ],
  },
  freefire: {
    title: "Free Fire",
    logo: "/ff_diamonds.jpg",
    packIcon: "/ffdiamonds.png",
    accent: "#FFD166",
    accent2: "#FF9D5C",
    packs: [
      { name: "110 Almaz", price: 12000 },
      { name: "341 Almaz", price: 32000 },
      { name: "572 Almaz", price: 53000 },
      { name: "1166 Almaz", price: 101000 },
      { name: "2398 Almaz", price: 199000 },
      { name: "6160 Almaz", price: 495000 },
    ],
  },
  mlbb: {
    title: "Mobile Legends",
    logo: "/mobile_legends.jpg",
    packIcon: "/mlbbdiamonds.png",
    accent: "#37E5C4",
    accent2: "#2FA8E8",
    packs: [
      { name: "14 Diamonds", price: 5000 },
      { name: "42 Diamonds", price: 11000 },
      { name: "170 Diamonds", price: 38000 },
      { name: "284 Diamonds", price: 62000 },
      { name: "706 Diamonds", price: 115000 },
      { name: "1084 diamonds", price: 220000 },
      { name: "3688 diamonds", price: 590000 },
    ],
  },
  bloodstrike: {
    title: "Blood Strike",
    logo: "/bloodstrike.jpg",
    packIcon: "/bloodstrikebc.png",
    accent: "#FF5F7E",
    accent2: "#FF8A5C",
    packs: [
      { name: "51 BC", price: 8000 },
      { name: "105 BC", price: 12000 },
      { name: "320 BC", price: 34000 },
      { name: "540 BC", price: 50000 },
      { name: "1100 BC", price: 96000 },
      { name: "2260 BC", price: 190000 },
      { name: "5800 BC", price: 473000 },
    ],
  },
  premium: {
    title: "Telegram Premium",
    logo: "/telegram_premium.jpg",
    packIcon: "/tg_prem_icon.png",
    accent: "#B98BFF",
    accent2: "#6E6BFF",
    packs: [
      { name: "3 Oy", price: 160000, icon: "/tg_prem_icon.png", months: 3 },
      { name: "6 Oy", price: 220000, icon: "/tg_prem_icon.png", months: 6 },
      { name: "12 Oy", price: 390000, icon: "/tg_prem_icon.png", months: 12 },
    ],
  },
};

const SHOP_ORDER: ShopType[] = ["pubg", "freefire", "premium", "mlbb", "bloodstrike"];

// ===================== ИКОНКИ =====================

const svg = (children: React.ReactNode, size = 20, sw = 2) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Icon = {
  Home: () => svg(<><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /></>, 22),
  Wallet: (p: { size?: number }) => svg(<><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></>, p?.size ?? 22),
  History: () => svg(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, 22),
  User: () => svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, 22),
  Back: () => svg(<polyline points="15 6 9 12 15 18" />, 20, 2.5),
  Close: () => svg(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, 16, 2.5),
  Chevron: () => svg(<polyline points="9 6 15 12 9 18" />, 16, 2.5),
  Check: () => svg(<polyline points="20 6 9 17 4 12" />, 14, 3),
  Sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.9 5.9L20 10l-6.1 2.1L12 18l-1.9-5.9L4 10l6.1-2.1L12 2z" />
    </svg>
  ),
  Headphones: () => svg(<><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></>, 18),
  Megaphone: () => svg(<><path d="M3 11l18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>, 18),
  Gift: () => svg(<><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></>, 20),
  BigCheck: () => (
    <svg width="64" height="64" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M15 27l7 7 15-16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="check-path" />
    </svg>
  ),
  BigX: () => (
    <svg width="64" height="64" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <line x1="18" y1="18" x2="34" y2="34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="34" y1="18" x2="18" y2="34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  BigClock: () => svg(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, 56, 1.6),
};

// ===================== ВСПОМОГАТЕЛЬНОЕ =====================

const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

const CARD_NUMBER = "9860196619614445";
const CARD_NUMBER_VIEW = "9860 1966 1961 4445";
const CARD_OWNER = "MUSA X.";

type TopUpStatus = "idle" | "submitting" | "pending" | "approved" | "rejected" | "error";

// ===================== КОМПОНЕНТ =====================

export default function Home() {
  // ---- язык ----
  const [lang, setLang] = useState<Lang>("uz");
  const t = (key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars);
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  // ---- общее ----
  const [view, setView] = useState<View>("home");
  const [balance, setBalance] = useState(0);
  const [tgUser, setTgUser] = useState<any>(null);
  const [referral, setReferral] = useState<{ invited: number; earned: number; available: number; percent: number } | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // ---- магазин ----
  const [shopType, setShopType] = useState<ShopType | null>(null);
  const [shopStep, setShopStep] = useState<1 | 2 | 4>(1);
  const [tab, setTab] = useState<"UC" | "SHOP">("UC");
  const [pack, setPack] = useState<Pack | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<{ text: string; noBalance: boolean } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- пополнение ----
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpStatus, setTopUpStatus] = useState<TopUpStatus>("idle");
  const [topUpError, setTopUpError] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedSum, setCopiedSum] = useState(false);

  // ---- оплата звёздами ----
  const [topUpMethod, setTopUpMethod] = useState<"card" | "stars">("card");
  const [starsPacks, setStarsPacks] = useState<{ stars: number; uzs: number }[]>([]);
  const [starsSel, setStarsSel] = useState<number | null>(null);
  const [starsBusy, setStarsBusy] = useState(false);
  const [starsMsg, setStarsMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // ===================== TELEGRAM / ЗАГРУЗКА =====================

  const getInitData = (): string =>
    typeof window !== "undefined" ? window.Telegram?.WebApp?.initData ?? "" : "";

  const haptic = (type: "light" | "medium" | "success" = "light") => {
    const hf = typeof window !== "undefined" ? window.Telegram?.WebApp?.HapticFeedback : undefined;
    if (!hf) return;
    if (type === "success") hf.notificationOccurred("success");
    else hf.impactOccurred(type);
  };

  const openTelegramLink = (url: string) => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, "_blank");
    }
  };

  const loadBalance = async () => {
    const initData = getInitData();
    if (!initData) return;
    try {
      const res = await fetch(`/api/deposit?initData=${encodeURIComponent(initData)}`);
      const data = await res.json();
      if (res.ok && typeof data.balance === "number") setBalance(data.balance);
    } catch {
      // сеть пропала — попробуем при следующем действии
    }
  };

  const loadReferral = async () => {
    const initData = getInitData();
    if (!initData) return;
    try {
      const res = await fetch("/api/referral/state", { headers: { "x-telegram-init-data": initData } });
      const data: any = await res.json();
      if (res.ok && data.success) {
        setReferral({ invited: data.invited, earned: data.earned, available: data.available, percent: data.percent });
      }
    } catch {
      // ничего не делаем
    }
  };

  // Всё, что нужно после того, как Telegram SDK загрузился (раньше initData мог быть пустым)
  useEffect(() => {
    let started = false;
    const boot = () => {
      if (started) return;
      started = true;
      const tg = window.Telegram?.WebApp;
      try {
        tg?.ready();
        tg?.expand();
      } catch {}
      setTgUser(tg?.initDataUnsafe?.user ?? null);

      // язык: сохранённый выбор → язык Telegram → uz
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("bitta_lang");
      } catch {}
      if (saved === "uz" || saved === "ru") setLang(saved);
      else if (tg?.initDataUnsafe?.user?.language_code === "ru") setLang("ru");

      const initData = tg?.initData ?? "";
      if (!initData) return;

      loadBalance();
      loadReferral();

      fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, action: "me" }),
      })
        .then((r) => r.json())
        .then((d) => setIsAdmin(!!d?.isAdmin))
        .catch(() => {});

      fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      }).catch(() => {});

      const sp = new URLSearchParams(initData).get("start_param") || "";
      if (sp.startsWith("ref_")) {
        fetch("/api/referral/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        }).catch(() => {});
      }
    };

    if (window.Telegram?.WebApp) {
      boot();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    script.onload = boot;
    script.onerror = boot; // открыто не из Telegram — просто показываем интерфейс
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseLang = (l: Lang) => {
    haptic("light");
    setLang(l);
    try {
      localStorage.setItem("bitta_lang", l);
    } catch {}
  };

  // Обновляем купоны при открытии профиля / магазина
  useEffect(() => {
    if (view === "profile" || shopType) loadReferral();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, shopType]);

  // Закрываем магазин при смене вкладки снизу
  useEffect(() => {
    closeShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ===================== КНОПКА «НАЗАД» TELEGRAM =====================

  const handleBack = () => {
    if (topUpOpen) setTopUpOpen(false);
    else if (shopType && shopStep === 2) {
      setShopStep(1);
      setBuyError(null);
    } else closeShop();
  };

  const handleBackRef = useRef(handleBack);
  handleBackRef.current = handleBack;

  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    const cb = () => handleBackRef.current();
    if (topUpOpen || shopType) {
      bb.show();
      bb.onClick(cb);
    } else {
      bb.hide();
    }
    return () => {
      bb.offClick?.(cb);
    };
  }, [topUpOpen, shopType]);

  // ===================== ПОПОЛНЕНИЕ =====================

  const openTopUp = () => {
    haptic("light");
    setTopUpOpen(true);
    setStarsMsg(null);
    setTopUpStatus("idle");
    setTopUpError("");
    setDepositId(null);
    setPayAmount(null);
    setExpiresAt(null);
  };

  const submitTopUp = async () => {
    const amount = parseInt(topUpAmount.replace(/[^\d]/g, ""), 10);
    if (!amount || amount <= 0) {
      haptic("medium");
      setTopUpStatus("error");
      setTopUpError(t("enterAmount"));
      return;
    }
    setTopUpStatus("submitting");
    setTopUpError("");
    try {
      const form = new FormData();
      form.append("initData", getInitData());
      form.append("amount", String(amount));
      const res = await fetch("/api/deposit", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTopUpStatus("error");
        setTopUpError(
          data.error === "INVALID_AMOUNT"
            ? t("amountRange", { min: fmt(Number(data.minAmount)), max: fmt(Number(data.maxAmount)) })
            : data.error === "TOO_BUSY"
            ? t("tooBusy")
            : `${t("errorPrefix")}: ${data.error ?? "HTTP " + res.status}${data.reason ? " (" + data.reason + ")" : ""}`
        );
        haptic("medium");
        return;
      }
      setDepositId(data.deposit.id);
      setPayAmount(Number(data.deposit.pay_amount));
      setExpiresAt(new Date(data.deposit.expires_at).getTime());
      setNow(Date.now());
      setTopUpStatus("pending");
      haptic("success");
    } catch (e) {
      setTopUpStatus("error");
      setTopUpError(`${t("networkErrorPrefix")}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Пока заявка ждёт — раз в 3 сек спрашиваем сервер
  useEffect(() => {
    if (topUpStatus !== "pending" || !depositId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/deposit?initData=${encodeURIComponent(getInitData())}&id=${depositId}`);
        const data = await res.json();
        const st = data?.deposit?.status;
        if (res.ok && st && st !== "pending") {
          setTopUpStatus(st === "approved" ? "approved" : "rejected");
          if (st === "approved") {
            haptic("success");
            loadBalance();
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topUpStatus, depositId]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (topUpStatus !== "pending") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [topUpStatus]);

  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const timeLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const expired = topUpStatus === "pending" && secondsLeft === 0;

  // Пакеты звёзд подгружаем при первом открытии вкладки «Stars»
  useEffect(() => {
    if (!topUpOpen || topUpMethod !== "stars" || starsPacks.length > 0) return;
    fetch("/api/stars/invoice")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.packs)) {
          setStarsPacks(d.packs);
          setStarsSel(d.packs[1]?.stars ?? d.packs[0]?.stars ?? null);
        }
      })
      .catch(() => {});
  }, [topUpOpen, topUpMethod, starsPacks.length]);

  const payWithStars = async () => {
    if (!starsSel || starsBusy) return;
    const tg = window.Telegram?.WebApp;
    if (!tg?.openInvoice) {
      setStarsMsg({ text: t("starsOnlyTelegram"), ok: false });
      return;
    }
    setStarsBusy(true);
    setStarsMsg(null);
    try {
      const res = await fetch("/api/stars/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: getInitData(), stars: starsSel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.link) {
        setStarsMsg({ text: t("starsError"), ok: false });
        return;
      }
      tg.openInvoice(data.link, (status: string) => {
        if (status === "paid") {
          haptic("success");
          setStarsMsg({ text: t("starsPaid"), ok: true });
          // зачисление приходит от Telegram через вебхук — несколько раз обновляем баланс
          [1500, 4000, 8000].forEach((ms) => setTimeout(loadBalance, ms));
        } else if (status === "cancelled") {
          setStarsMsg({ text: t("starsCancelled"), ok: false });
        } else if (status === "failed") {
          setStarsMsg({ text: t("starsFailed"), ok: false });
        }
      });
    } catch {
      setStarsMsg({ text: t("starsError"), ok: false });
    } finally {
      setStarsBusy(false);
    }
  };

  const copy = async (text: string, set: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    haptic("light");
    set(true);
    setTimeout(() => set(false), 1500);
  };

  // ===================== МАГАЗИН =====================

  const openShop = (type: ShopType) => {
    haptic("light");
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopType(type);
    setTab("UC");
    setShopStep(1);
    setPack(null);
    setPlayerId("");
    setZoneId("");
    setBuyError(null);
    setBuying(false);
  };

  function closeShop() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setShopType(null);
    setShopStep(1);
    setPack(null);
    setBuyError(null);
  }

  const hasCoupon = !!referral && referral.available > 0;
  const finalPrice = (p: number) => (hasCoupon ? Math.round((p * (100 - referral!.percent)) / 100) : p);

  const buy = async () => {
    if (!playerId.trim()) {
      haptic("medium");
      setBuyError({ text: t("enterId"), noBalance: false });
      return;
    }
    if (!shopType || !pack || buying) return;

    setBuying(true);
    setBuyError(null);
    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: getInitData(),
          service: shopType,
          productName: pack.name,
          targetId: playerId.trim(),
          price: pack.price, // сервер всё равно берёт цену из своего прайса
          playerId: playerId.trim(),
          serverId: shopType === "mlbb" ? zoneId.trim() : "",
        }),
      });
      const data: any = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        haptic("medium");
        const raw = String(data.error || "");
        if (raw === "Balansingiz yetarli emas.") {
          setBuyError({ text: t("errNoBalance"), noBalance: true });
        } else if (raw.startsWith("Xatolik yuz berdi")) {
          setBuyError({ text: t("errGeneric"), noBalance: false });
        } else {
          const details = data.details ? " — " + JSON.stringify(data.details) : "";
          setBuyError({ text: (raw || t("errGeneric")) + details, noBalance: false });
        }
        return;
      }

      haptic("success");
      setShopStep(4);
      loadBalance();
      loadReferral();
      closeTimer.current = setTimeout(closeShop, 2600);
    } catch {
      setBuyError({ text: t("errNetwork"), noBalance: false });
    } finally {
      setBuying(false);
    }
  };

  const shareReferral = () => {
    if (!tgUser?.id) return;
    haptic("light");
    const link = `https://t.me/bitta_hub_bot?startapp=ref_${tgUser.id}`;
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t("refShareText"))}`);
  };

  // ===================== ОТРИСОВКА =====================

  const shop = shopType ? SHOPS[shopType] : null;
  const accentStyle = shop ? ({ "--a": shop.accent, "--a2": shop.accent2 } as React.CSSProperties) : undefined;

  const idLabel = (type: ShopType): string =>
    ({ pubg: t("idPubg"), freefire: t("idFreefire"), bloodstrike: t("idBloodstrike"), premium: t("idPremium"), mlbb: t("idMlbb") }[type]);

  const idPlaceholder = (type: ShopType): string =>
    ({ pubg: "5123456789", freefire: "78291044", bloodstrike: "1234567890", premium: "@username", mlbb: "12345678" }[type]);

  const packTitle = (p: Pack) => (p.months ? `${p.months} ${t("months")}` : p.name);

  const titles: Record<View, string> = {
    home: "bitta",
    wallet: t("navWallet"),
    history: t("navHistory"),
    profile: t("navProfile"),
  };

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: t("navHome"), icon: <Icon.Home /> },
    { id: "wallet", label: t("navWallet"), icon: <Icon.Wallet /> },
    { id: "history", label: t("navHistory"), icon: <Icon.History /> },
    { id: "profile", label: t("navProfile"), icon: <Icon.User /> },
  ];

  const faq = [
    [t("faq1q"), t("faq1a")],
    [t("faq2q"), t("faq2a")],
    [t("faq3q"), t("faq3a")],
    [t("faq4q"), t("faq4a")],
  ];

  return (
    <div className="app">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="bg" aria-hidden="true">
        <i className="blob b1" />
        <i className="blob b2" />
        <i className="blob b3" />
      </div>

      {/* ---------- ХЕДЕР ---------- */}
      <header className="header">
        <div className="brand">
          <span className="brand-dot"><Icon.Sparkle /></span>
          <span className="brand-name">{titles[view]}</span>
        </div>
        <button className="balance-pill press" onClick={openTopUp}>
          <Icon.Wallet size={16} />
          <span>{fmt(balance)} UZS</span>
          <span className="plus">+</span>
        </button>
      </header>

      <main className="content">
        {/* ---------- ГЛАВНАЯ ---------- */}
        {view === "home" && (
          <>
            <section className="hero">
              <span className="chip"><Icon.Sparkle /> {t("heroBadge")}</span>
              <h1>{t("heroTitle")}</h1>
              <p>{t("heroSub")}</p>
            </section>

            <h2 className="section-title">{t("gamesTitle")}</h2>
            <div className="games">
              {SHOP_ORDER.map((id) => (
                <button key={id} className="game press" onClick={() => openShop(id)} style={{ "--a": SHOPS[id].accent } as React.CSSProperties}>
                  <img src={SHOPS[id].logo} alt={SHOPS[id].title} />
                  <span>{SHOPS[id].title}</span>
                </button>
              ))}
            </div>

            <button className="promo press" onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
              <span className="promo-tag"><Icon.Sparkle /> {t("promoTag")}</span>
              <strong>{t("promoTitle")}</strong>
              <small>{t("promoText")}</small>
              <span className="promo-cta">{t("promoCta")} <Icon.Chevron /></span>
            </button>
          </>
        )}

        {/* ---------- КОШЕЛЁК ---------- */}
        {view === "wallet" && <WalletView balance={balance} onOpenDeposit={openTopUp} />}

        {/* ---------- ИСТОРИЯ ---------- */}
        {view === "history" && <HistoryView telegramId={tgUser?.id || 0} />}

        {/* ---------- ПРОФИЛЬ ---------- */}
        {view === "profile" && (
          <div className="stack">
            <div className="card profile-card">
              {tgUser?.photo_url ? (
                <img className="avatar" src={tgUser.photo_url} alt="" />
              ) : (
                <div className="avatar avatar-fallback"><Icon.User /></div>
              )}
              <div className="pname">
                {tgUser?.first_name || t("user")} {tgUser?.last_name || ""}
              </div>
              {tgUser?.username && <div className="puser">@{tgUser.username}</div>}
            </div>

            <div className="card">
              <div className="muted">{t("yourBalance")}</div>
              <div className="big-balance">{fmt(balance)} UZS</div>
              <button className="btn btn-primary press" onClick={openTopUp}>
                <Icon.Wallet size={18} /> {t("topUpAccount")}
              </button>
            </div>

            <div className="card">
              <div className="card-title"><Icon.Gift /> {t("refTitle")}</div>
              <p className="muted small">{t("refText", { p: referral?.percent ?? 2 })}</p>
              <div className="stats">
                {[
                  [t("refInvited"), referral?.invited ?? 0],
                  [t("refBought"), referral?.earned ?? 0],
                  [t("refCoupons"), referral?.available ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="stat">
                    <b>{value}</b>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary press" onClick={shareReferral}>{t("refButton")}</button>
            </div>

            <div className="label">{t("language")}</div>
            <div className="seg">
              <button className={lang === "uz" ? "on" : ""} onClick={() => chooseLang("uz")}>O'zbekcha</button>
              <button className={lang === "ru" ? "on" : ""} onClick={() => chooseLang("ru")}>Русский</button>
              <button disabled title="soon">Qaraqalpaq</button>
            </div>
            <p className="muted tiny">{t("langSoon")}</p>

            <div className="label">{t("help")}</div>
            <div className="card list">
              <button className="list-item press" onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
                <Icon.Headphones /> <span>{t("support")}</span> <Icon.Chevron />
              </button>
              <button className="list-item press" onClick={() => openTelegramLink("https://t.me/bitta_hub")}>
                <Icon.Megaphone /> <span>{t("channel")}</span> <Icon.Chevron />
              </button>
              {isAdmin && (
                <button className="list-item press" onClick={() => router.push("/admin")}>
                  <Icon.Sparkle /> <span>Admin</span> <Icon.Chevron />
                </button>
              )}
              <button className="list-item press" onClick={() => setFaqOpen(true)}>
                <Icon.Sparkle /> <span>{t("faq")}</span> <Icon.Chevron />
              </button>
              <button className="list-item press" onClick={() => setTermsOpen(true)}>
                <Icon.Sparkle /> <span>{t("terms")}</span> <Icon.Chevron />
              </button>
            </div>
            <p className="copyright">{t("copyright")}</p>
          </div>
        )}
      </main>

      {/* ---------- НИЖНЕЕ МЕНЮ ---------- */}
      <nav className="nav">
        {navItems.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${view === n.id ? "active" : ""}`}
            onClick={() => {
              haptic("light");
              setView(n.id);
            }}
          >
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* ---------- МАГАЗИН (на весь экран) ---------- */}
      {shop && shopType && (
        <div className="sheet" style={accentStyle}>
          <div className="sheet-top">
            <button className="icon-btn press" onClick={handleBack} aria-label={t("back")}><Icon.Back /></button>
            <div className="sheet-title">
              <img src={shop.logo} alt="" />
              <span>{shop.title}</span>
            </div>
            <span style={{ width: 40 }} />
          </div>

          <div className="sheet-body">
            {/* ШАГ 1 — выбор пакета */}
            {shopStep === 1 && (
              <>
                <p className="label first">{t("choosePack")}</p>

                {shop.hasTabs && (
                  <div className="seg tabs">
                    {(["UC", "SHOP"] as const).map((k) => (
                      <button key={k} className={tab === k ? "on" : ""} onClick={() => { haptic("light"); setTab(k); }}>
                        {k === "UC" ? t("tabUC") : t("tabShop")}
                      </button>
                    ))}
                  </div>
                )}

                <div className="packs">
                  {shop.packs
                    .filter((p) => !shop.hasTabs || p.tab === tab)
                    .map((p) => (
                      <button
                        key={p.name}
                        className="pack press"
                        onClick={() => {
                          haptic("light");
                          setPack(p);
                          setBuyError(null);
                          setShopStep(2);
                        }}
                      >
                        <div className="pack-text">
                          <b>{packTitle(p)}</b>
                          <span>{fmt(p.price)} UZS</span>
                        </div>
                        <img
                          src={p.icon || shop.packIcon}
                          alt=""
                          style={p.scale ? { transform: `scale(${p.scale})` } : undefined}
                        />
                      </button>
                    ))}
                </div>
              </>
            )}

            {/* ШАГ 2 — ID и оплата */}
            {shopStep === 2 && pack && (
              <>
                <div className="card summary">
                  <img src={pack.icon || shop.packIcon} alt="" />
                  <div>
                    <div className="muted small">{t("selectedPack")}</div>
                    <b>{packTitle(pack)}</b>
                  </div>
                  <div className="price">
                    {hasCoupon && <s>{fmt(pack.price)}</s>}
                    <b>{fmt(finalPrice(pack.price))} UZS</b>
                  </div>
                </div>

                {hasCoupon && (
                  <div className="coupon"><Icon.Gift /> {t("couponApplied", { p: referral!.percent })}</div>
                )}

                <div className="fields">
                  <div className="field grow">
                    <label>{idLabel(shopType)}</label>
                    <input
                      type="text"
                      inputMode={shopType === "premium" ? "text" : "numeric"}
                      placeholder={idPlaceholder(shopType)}
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                    />
                  </div>
                  {shopType === "mlbb" && (
                    <div className="field zone">
                      <label>{t("zoneId")}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1234"
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <p className="muted tiny">{shopType === "premium" ? t("idHintPremium") : t("idHintDefault")}</p>

                {buyError && (
                  <div className="error">
                    <span>{buyError.text}</span>
                    {buyError.noBalance && (
                      <button
                        className="btn btn-primary press"
                        onClick={() => {
                          haptic("medium");
                          closeShop();
                          openTopUp();
                        }}
                      >
                        <Icon.Wallet size={18} /> {t("topUpAccount")}
                      </button>
                    )}
                  </div>
                )}

                <button className="btn btn-accent press" disabled={buying} onClick={() => { haptic("medium"); buy(); }}>
                  {buying ? t("sending") : `${t("buy")} · ${fmt(finalPrice(pack.price))} UZS`}
                </button>
              </>
            )}

            {/* ШАГ 4 — готово */}
            {shopStep === 4 && (
              <div className="result ok">
                <Icon.BigCheck />
                <h3>{t("orderAccepted")}</h3>
                <p>{t("orderAcceptedSub")}</p>
                <button className="btn btn-green press" onClick={closeShop}>{t("ok")}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- ПОПОЛНЕНИЕ (на весь экран, поверх магазина) ---------- */}
      {topUpOpen && (
        <div className="sheet top">
          <div className="sheet-top">
            <button className="icon-btn press" onClick={() => setTopUpOpen(false)} aria-label={t("back")}><Icon.Back /></button>
            <div className="sheet-title">
              <Icon.Wallet size={20} />
              <span>{t("topUpTitle")}</span>
            </div>
            <span style={{ width: 40 }} />
          </div>

          <div className="sheet-body">
            {(topUpStatus === "idle" || topUpStatus === "submitting" || topUpStatus === "error") && (
              <div className="seg" style={{ marginBottom: 16 }}>
                <button className={topUpMethod === "card" ? "on" : ""} onClick={() => { haptic("light"); setTopUpMethod("card"); }}>
                  {t("methodCard")}
                </button>
                <button className={topUpMethod === "stars" ? "on" : ""} onClick={() => { haptic("light"); setTopUpMethod("stars"); }}>
                  ⭐ {t("methodStars")}
                </button>
              </div>
            )}

            {topUpMethod === "stars" && (topUpStatus === "idle" || topUpStatus === "submitting" || topUpStatus === "error") && (
              <>
                <p className="muted small">{t("starsInfo")}</p>
                <div className="packs" style={{ marginTop: 12 }}>
                  {starsPacks.map((sp) => (
                    <button
                      key={sp.stars}
                      className={`pack press ${starsSel === sp.stars ? "picked" : ""}`}
                      onClick={() => { haptic("light"); setStarsSel(sp.stars); }}
                    >
                      <div className="pack-text">
                        <b>⭐ {sp.stars}</b>
                        <span>{fmt(sp.uzs)} UZS</span>
                      </div>
                    </button>
                  ))}
                </div>
                {starsMsg && (
                  <div className={starsMsg.ok ? "coupon" : "error"} style={{ marginTop: 14 }}>
                    <span>{starsMsg.text}</span>
                  </div>
                )}
                <button className="btn btn-primary press" style={{ marginTop: 18 }} disabled={starsBusy || !starsSel} onClick={payWithStars}>
                  {starsBusy ? t("sending") : `⭐ ${t("starsPay")}`}
                </button>
              </>
            )}

            {topUpMethod === "card" && (topUpStatus === "idle" || topUpStatus === "submitting" || topUpStatus === "error") && (
              <>
                <div className="field">
                  <label>{t("topUpAmountLabel")}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder={t("topUpPlaceholder")}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                  />
                </div>
                <div className="quick">
                  {["10000", "25000", "50000", "100000"].map((a) => (
                    <button key={a} className="press" onClick={() => { haptic("light"); setTopUpAmount(a); }}>
                      +{fmt(Number(a))}
                    </button>
                  ))}
                </div>
                <p className="muted small">{t("topUpInfo")}</p>
                {topUpStatus === "error" && <div className="error"><span>{topUpError}</span></div>}
                <button className="btn btn-primary press" disabled={topUpStatus === "submitting"} onClick={submitTopUp}>
                  {topUpStatus === "submitting" ? t("sending") : t("next")}
                </button>
              </>
            )}

            {topUpStatus === "pending" && !expired && (
              <>
                <div className="card">
                  <p className="small">{t("payToCard")}</p>
                  <div className="copy-box">
                    <span>{CARD_NUMBER_VIEW}</span>
                    <button className="press" onClick={() => copy(CARD_NUMBER, setCopiedCard)}>
                      {copiedCard ? <><Icon.Check /> {t("copied")}</> : t("copy")}
                    </button>
                  </div>
                  <div className="muted small">{t("cardOwner")}: {CARD_OWNER}</div>
                </div>

                <div className="field" style={{ marginTop: 14 }}>
                  <label>{t("transferAmount")}</label>
                  <div className="copy-box">
                    <span>{payAmount !== null ? fmt(payAmount) : ""}</span>
                    <button className="press" onClick={() => payAmount !== null && copy(String(payAmount), setCopiedSum)}>
                      {copiedSum ? <><Icon.Check /> {t("copied")}</> : t("copy")}
                    </button>
                  </div>
                </div>
                <p className="warn">{t("dontChangeAmount")}</p>

                <div className="timer">{timeLabel}</div>
                <p className="muted small center">{t("autoCredit")}</p>
              </>
            )}

            {expired && (
              <div className="result warn-c">
                <Icon.BigClock />
                <h3>{t("timeUp")}</h3>
                <p>{t("timeUpSub")}</p>
                <button className="btn btn-primary press" onClick={openTopUp}>{t("retry")}</button>
              </div>
            )}

            {topUpStatus === "approved" && (
              <div className="result ok">
                <Icon.BigCheck />
                <h3>{t("topUpDone")}</h3>
                <p>{t("currentBalance")}: <b className="green">{fmt(balance)} UZS</b></p>
                <button className="btn btn-green press" onClick={() => setTopUpOpen(false)}>{t("ok")}</button>
              </div>
            )}

            {topUpStatus === "rejected" && (
              <div className="result bad">
                <Icon.BigX />
                <h3>{t("rejected")}</h3>
                <p>{t("rejectedSub")}</p>
                <button className="btn btn-primary press" onClick={openTopUp}>{t("retry")}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- FAQ / УСЛОВИЯ ---------- */}
      {faqOpen && (
        <div className="modal" onClick={() => setFaqOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t("faq")}</h3>
              <button className="icon-btn small-btn" onClick={() => setFaqOpen(false)}><Icon.Close /></button>
            </div>
            {faq.map(([q, a], i) => (
              <div key={i} className="qa">
                <b>{i + 1}. {q}</b>
                <p>{a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {termsOpen && (
        <div className="modal" onClick={() => setTermsOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{t("terms")}</h3>
              <button className="icon-btn small-btn" onClick={() => setTermsOpen(false)}><Icon.Close /></button>
            </div>
            <div className="qa"><p>{t("terms1")}</p></div>
            <div className="qa"><p>{t("terms2")}</p></div>
            <div className="qa"><p>{t("terms3")}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== СТИЛИ =====================

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #0E0A1B;
  --card: rgba(255,255,255,.055);
  --line: rgba(255,255,255,.09);
  --text: #FFFFFF;
  --muted: #A79FC2;
  --violet: linear-gradient(135deg,#B98BFF,#6E6BFF);
  --green: #3DDC97;
  --a: #B98BFF;
  --a2: #6E6BFF;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { margin: 0; background: var(--bg); }
button { font-family: inherit; color: inherit; }

.app {
  min-height: 100vh; position: relative; color: var(--text);
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  background: var(--bg); overflow-x: hidden;
}
.bg { position: fixed; inset: 0; overflow: hidden; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .32; animation: float 10s ease-in-out infinite; }
.b1 { width: 260px; height: 260px; top: -90px; left: -70px; background: #FF5F7E; }
.b2 { width: 240px; height: 240px; top: 180px; right: -110px; background: #6E6BFF; animation-delay: 2s; }
.b3 { width: 220px; height: 220px; bottom: 60px; left: -90px; background: #37E5C4; opacity: .2; animation-delay: 4s; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-22px); } }

.header {
  position: sticky; top: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding: 12px 16px; background: rgba(14,10,27,.72);
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: 1px solid var(--line);
}
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.brand-dot { width: 32px; height: 32px; border-radius: 11px; display: grid; place-items: center; background: linear-gradient(135deg,#FF5F7E,#FF9D5C); flex-shrink: 0; }
.brand-name { font-weight: 800; font-size: 19px; letter-spacing: -.4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.balance-pill {
  display: flex; align-items: center; gap: 7px; border: 0; cursor: pointer; padding: 8px 8px 8px 12px;
  border-radius: 999px; background: var(--violet); font-weight: 700; font-size: 13px;
  box-shadow: 0 6px 18px rgba(110,107,255,.35); white-space: nowrap;
}
.balance-pill .plus { width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,.25); display: grid; place-items: center; font-size: 14px; line-height: 1; }

.content { position: relative; padding: 16px 16px 110px; max-width: 560px; margin: 0 auto; animation: fade .25s ease; }
@keyframes fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.hero { margin-bottom: 22px; }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; font-size: 11px; font-weight: 600; color: #D1B3FF; background: rgba(184,139,255,.12); border: 1px solid rgba(184,139,255,.25); }
.hero h1 { font-size: 30px; line-height: 1.1; letter-spacing: -.8px; margin: 14px 0 6px; font-weight: 800; }
.hero p { margin: 0; color: var(--muted); font-size: 14px; line-height: 1.5; }

.section-title { font-size: 15px; font-weight: 700; margin: 0 0 12px; }
.games { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px; }
.game {
  background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 6px 6px 10px;
  display: flex; flex-direction: column; align-items: center; gap: 7px; cursor: pointer;
}
.game img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 13px; }
.game span { font-size: 11.5px; font-weight: 700; line-height: 1.15; text-align: center; }

.promo {
  width: 100%; text-align: left; cursor: pointer; display: flex; flex-direction: column; gap: 6px; padding: 16px;
  border-radius: 20px; border: 1px solid var(--line); background: linear-gradient(135deg, rgba(185,139,255,.16), rgba(55,229,196,.08));
}
.promo-tag { font-size: 11px; font-weight: 700; color: var(--green); display: flex; align-items: center; gap: 5px; }
.promo strong { font-size: 15px; }
.promo small { font-size: 12px; color: var(--muted); line-height: 1.45; }
.promo-cta { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 700; color: #6CC4FF; margin-top: 4px; }

.stack { display: flex; flex-direction: column; gap: 12px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 16px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; }
.profile-card { text-align: center; }
.avatar { width: 84px; height: 84px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px; display: block; border: 3px solid rgba(185,139,255,.5); }
.avatar-fallback { display: grid; place-items: center; background: var(--violet); }
.pname { font-size: 18px; font-weight: 800; }
.puser { color: var(--muted); font-size: 13px; margin-top: 2px; }
.big-balance { font-size: 26px; font-weight: 800; color: var(--green); margin: 4px 0 14px; letter-spacing: -.5px; }
.muted { color: var(--muted); }
.small { font-size: 12.5px; line-height: 1.5; }
.tiny { font-size: 11px; margin: 6px 2px 0; line-height: 1.4; }
.center { text-align: center; }
.label { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; margin: 10px 4px 0; }
.label.first { margin: 0 0 12px; font-size: 14px; text-transform: none; letter-spacing: 0; color: rgba(255,255,255,.75); }

.stats { display: flex; gap: 8px; margin: 12px 0; }
.stat { flex: 1; text-align: center; padding: 10px 4px; border-radius: 14px; background: rgba(255,255,255,.05); border: 1px solid var(--line); }
.stat b { display: block; font-size: 19px; }
.stat span { font-size: 10px; color: var(--muted); }

.seg { display: flex; gap: 4px; padding: 4px; border-radius: 16px; background: var(--card); border: 1px solid var(--line); }
.seg button { flex: 1; border: 0; background: transparent; color: rgba(255,255,255,.6); padding: 10px 6px; border-radius: 12px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .2s; }
.seg button.on { background: #8B5CF6; color: #fff; box-shadow: 0 4px 14px rgba(139,92,246,.4); }
.seg button:disabled { opacity: .4; cursor: not-allowed; }
.seg.tabs { margin-bottom: 14px; }

.list { padding: 4px; }
.list-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 13px 12px; background: none; border: 0; border-radius: 14px; font-size: 14px; font-weight: 600; cursor: pointer; text-align: left; }
.list-item span { flex: 1; }
.list-item + .list-item { border-top: 1px solid var(--line); border-radius: 0 0 14px 14px; }
.copyright { text-align: center; font-size: 10.5px; color: rgba(255,255,255,.3); margin: 8px 0 0; }

.btn { width: 100%; border: 0; border-radius: 16px; padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn:disabled { opacity: .6; cursor: default; }
.btn-primary { background: var(--violet); color: #fff; box-shadow: 0 8px 22px rgba(110,107,255,.3); }
.btn-accent { background: linear-gradient(135deg, var(--a), var(--a2)); color: #fff; box-shadow: 0 8px 24px color-mix(in srgb, var(--a) 40%, transparent); margin-top: 18px; }
.btn-green { background: var(--green); color: #04130B; }

.nav {
  position: fixed; z-index: 30; left: 16px; right: 16px; bottom: calc(12px + env(safe-area-inset-bottom)); height: 64px; max-width: 528px; margin: 0 auto;
  display: flex; justify-content: space-around; align-items: center; border-radius: 26px;
  background: rgba(20,15,38,.86); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,.12); box-shadow: 0 12px 34px rgba(0,0,0,.5);
}
.nav-item { background: none; border: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; color: rgba(255,255,255,.42); cursor: pointer; padding: 6px 10px; font-size: 10.5px; font-weight: 600; transition: color .2s, transform .2s; }
.nav-item.active { color: #B98BFF; font-weight: 800; transform: translateY(-2px); }

.sheet { position: fixed; inset: 0; z-index: 50; background: var(--bg); display: flex; flex-direction: column; animation: sheet .28s cubic-bezier(.2,.8,.2,1); }
.sheet.top { z-index: 60; }
@keyframes sheet { from { transform: translateY(24px); opacity: 0; } to { transform: none; opacity: 1; } }
.sheet-top { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--line); background: rgba(14,10,27,.9); }
.sheet-title { display: flex; align-items: center; gap: 9px; font-weight: 800; font-size: 16px; }
.sheet-title img { width: 28px; height: 28px; border-radius: 8px; object-fit: cover; }
.sheet-body { flex: 1; overflow-y: auto; padding: 16px 16px 40px; max-width: 560px; width: 100%; margin: 0 auto; }
.icon-btn { width: 40px; height: 40px; border-radius: 13px; border: 1px solid var(--line); background: var(--card); display: grid; place-items: center; cursor: pointer; }
.small-btn { width: 30px; height: 30px; border-radius: 50%; }

.packs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.pack {
  background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 14px 12px; min-height: 72px;
  display: flex; align-items: center; justify-content: space-between; gap: 6px; cursor: pointer; text-align: left;
}
.pack-text { min-width: 0; }
.pack.picked { border-color: #B98BFF; box-shadow: 0 0 0 2px rgba(185,139,255,.35); }
.pack b { display: block; font-size: 13.5px; line-height: 1.2; }
.pack span { display: block; margin-top: 6px; font-size: 12px; font-weight: 700; color: var(--a); }
.pack img { width: 34px; height: 34px; object-fit: contain; flex-shrink: 0; }

.summary { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.summary img { width: 44px; height: 44px; object-fit: contain; }
.summary > div:nth-child(2) { flex: 1; min-width: 0; }
.summary b { font-size: 15px; }
.price { text-align: right; display: flex; flex-direction: column; }
.price s { font-size: 11px; color: var(--muted); }
.price b { color: var(--a); font-size: 14px; white-space: nowrap; }
.coupon { display: flex; align-items: center; gap: 8px; padding: 10px 12px; margin-bottom: 14px; border-radius: 14px; font-size: 12.5px; font-weight: 600; color: var(--green); background: rgba(61,220,151,.1); border: 1px solid rgba(61,220,151,.25); }

.fields { display: flex; gap: 10px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field.grow { flex: 1; }
.field.zone { flex: 0 0 110px; }
.field label { font-size: 12px; color: rgba(255,255,255,.65); font-weight: 600; }
input {
  width: 100%; padding: 14px; font-size: 16px; font-family: inherit; color: #fff; border-radius: 14px;
  background: rgba(255,255,255,.06); border: 1px solid var(--line); outline: none; transition: box-shadow .2s, border-color .2s;
}
input::placeholder { color: rgba(255,255,255,.3); }
input:focus { border-color: rgba(185,139,255,.6); box-shadow: 0 0 0 3px rgba(185,139,255,.2); }

.error { margin-top: 14px; padding: 12px; border-radius: 14px; font-size: 12.5px; color: #FF9DAF; background: rgba(255,95,126,.1); border: 1px solid rgba(255,95,126,.25); display: flex; flex-direction: column; gap: 10px; line-height: 1.45; word-break: break-word; }
.error .btn { color: #fff; }

.quick { display: flex; gap: 8px; margin: 10px 0 14px; flex-wrap: wrap; }
.quick button { flex: 1; min-width: 70px; padding: 10px 6px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); font-size: 13px; font-weight: 700; cursor: pointer; }

.copy-box { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 10px 10px 14px; margin: 10px 0; border-radius: 14px; background: rgba(0,0,0,.28); border: 1px solid var(--line); }
.copy-box span { font-size: 17px; font-weight: 800; letter-spacing: .5px; }
.copy-box button { border: 0; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 11px; background: var(--violet); font-size: 12px; font-weight: 700; white-space: nowrap; }
.warn { color: #FFD166; font-size: 12.5px; line-height: 1.5; margin: 8px 0 0; }
.timer { text-align: center; font-size: 34px; font-weight: 800; margin: 22px 0 6px; letter-spacing: 1px; font-variant-numeric: tabular-nums; }

.result { text-align: center; padding: 36px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.result h3 { margin: 10px 0 0; font-size: 21px; }
.result p { margin: 0 0 16px; color: var(--muted); font-size: 14px; line-height: 1.5; }
.result .btn { margin-top: 6px; }
.result.ok { color: var(--green); }
.result.bad { color: #FF9DAF; }
.result.warn-c { color: #FFD166; }
.result h3 { color: var(--text); }
.green { color: var(--green); }
.check-path { stroke-dasharray: 46; stroke-dashoffset: 46; animation: draw .5s .15s cubic-bezier(.65,0,.35,1) forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }

.modal { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.72); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; animation: fade .2s; }
.modal-card { width: 100%; max-width: 480px; max-height: 82vh; overflow-y: auto; padding: 20px; border-radius: 22px; background: #181528; border: 1px solid rgba(255,255,255,.12); }
.modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.modal-head h3 { margin: 0; font-size: 18px; }
.qa { margin-bottom: 14px; font-size: 13px; line-height: 1.55; color: rgba(255,255,255,.8); }
.qa b { color: #fff; }
.qa p { margin: 4px 0 0; }

.press { transition: transform .15s cubic-bezier(.34,1.56,.64,1); }
.press:active { transform: scale(.95); }
`;