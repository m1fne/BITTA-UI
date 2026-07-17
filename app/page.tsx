"use client";

import { useState, useEffect } from "react";

// Объявляем типы для Telegram SDK
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        sendData: (data: string) => void;
      };
    };
  }
}

// База данных партнеров для поиска
const adPartners = [
  {
    id: 1,
    title: "Uzum Market Hamkori",
    desc: "Eng tez yetkazib berish va arzon narxlar do'koni!",
    link: "https://uzum.uz",
    category: "market",
    badge: "Offline Market"
  }
];

// Паки товаров для рынка (Бак 1)
const shopProducts = {
  pubg: {
    title: "PUBG Mobile UC",
    placeholder: "Player ID (masalan: 5123456789)",
    packs: [
      { name: "60 UC", price: "12,000 UZS" },
      { name: "325 UC", price: "60,000 UZS" },
      { name: "660 UC", price: "115,000 UZS" },
      { name: "1800 UC", price: "310,000 UZS" }
    ]
  },
  freefire: {
    title: "Free Fire Almazlar",
    placeholder: "Player ID (masalan: 78291044)",
    packs: [
      { name: "100 + 10 Almaz", price: "15,000 UZS" },
      { name: "310 + 31 Almaz", price: "42,000 UZS" },
      { name: "520 + 52 Almaz", price: "68,000 UZS" },
      { name: "1060 + 106 Almaz", price: "135,000 UZS" }
    ]
  },
  steam: {
    title: "Steam Balans",
    placeholder: "Steam Login (masalan: musa_pro)",
    packs: [
      { name: "$5 USD", price: "70,000 UZS" },
      { name: "$10 USD", price: "140,000 UZS" },
      { name: "$20 USD", price: "275,000 UZS" }
    ]
  },
  premium: {
    title: "Telegram Premium",
    placeholder: "Telegram Username (masalan: @username)",
    packs: [
      { name: "3 Oy (Muddatsiz)", price: "90,000 UZS" },
      { name: "6 Oy (Muddatsiz)", price: "150,000 UZS" },
      { name: "12 Oy (Muddatsiz)", price: "270,000 UZS" }
    ]
  }
};

// Вакансии (Бак 3)
const mockVacancies = [
  { id: 1, title: "Next.js va WebApp dasturchi kerak", budget: "500,000 UZS", desc: "Bitta loyihasini rivojlantirish uchun tajribali dasturchi taklif etiladi.", type: "job", contact: "@bitta_mngr" },
  { id: 2, title: "SMM / Grafik Dizayner", budget: "1,200,000 UZS/oy", desc: "Kanal postlari va vizuallari bilan ishlash uchun professional.", type: "job", contact: "@bitta_mngr" },
  { id: 3, title: "UI/UX Dizayn xizmati", budget: "Kelishilgan narxda", desc: "Sizning g'oyalaringizni chiroyli va qulay interfeysga aylantirib beraman.", type: "worker", contact: "@musa_design" }
];

// Тонкие SVG иконки для премиального вида
const Icons = {
  Gamepad: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="3" />
    </svg>
  ),
  Diamond: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.7 10.3l9.3 9.3 9.3-9.3L12 3 2.7 10.3z" />
    </svg>
  ),
  Premium: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 8.5 17 22 7 22 2 8.5 12 2" />
    </svg>
  ),
  Steam: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zM7 16a3 3 0 1 1 3-3v1a2 2 0 1 0 4 0V9a1 1 0 1 1 2 0v5a3 3 0 0 1-6 0z" />
    </svg>
  ),
  Book: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5V4.5z" />
    </svg>
  ),
  Pravaga: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
};

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Состояния БАК 1: Маркет
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeShopType, setActiveShopType] = useState<"pubg" | "freefire" | "steam" | "premium" | null>(null);
  const [shopStep, setShopStep] = useState(1);
  const [selectedPack, setSelectedPack] = useState<{ name: string; price: string } | null>(null);
  const [userCredential, setUserCredential] = useState("");
  const [copied, setCopied] = useState(false);

  // Состояния БАК 2: Обучение (CEFR, Prava)
  const [isEduOpen, setIsEduOpen] = useState(false);
  const [eduType, setEduType] = useState<"cefr" | "prava" | null>(null);

  // Состояния БАК 3: Вакансии
  const [isVacancyOpen, setIsVacancyOpen] = useState(false);
  const [vacancyTab, setVacancyTab] = useState<"job" | "worker">("job");
  const [isCreatingVacancy, setIsCreatingVacancy] = useState(false);
  
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

  const handleOpenShop = (type: "pubg" | "freefire" | "steam" | "premium") => {
    setActiveShopType(type);
    setShopStep(1);
    setSelectedPack(null);
    setUserCredential("");
    setIsShopOpen(true);
  };

  const handleSelectPack = (pack: { name: string; price: string }) => {
    setSelectedPack(pack);
    setShopStep(2);
  };

  const handleConfirmCredentials = () => {
    if (!userCredential.trim()) return;
    setShopStep(3);
  };

  const handleFinishOrder = () => {
    const orderJSON = {
      action: "new_order",
      service: activeShopType,
      pack: selectedPack?.name,
      price: selectedPack?.price,
      credentials: userCredential,
    };
    sendDataToBot(orderJSON);
    setIsShopOpen(false);
  };

  const handleOpenEdu = (type: "cefr" | "prava") => {
    setEduType(type);
    setIsEduOpen(true);
  };

  const handleCreateVacancy = () => {
    if (!newVacTitle || !newVacBudget || !newVacDesc || !newVacContact) return;
    const vacancyJSON = {
      action: "create_vacancy",
      type: newVacType,
      title: newVacTitle,
      budget: newVacBudget,
      desc: newVacDesc,
      contact: newVacContact
    };
    sendDataToBot(vacancyJSON);
    setIsCreatingVacancy(false);
    setIsVacancyOpen(false);
  };

  const filteredAds = searchQuery.trim() 
    ? adPartners.filter(ad => ad.category.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : [];

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.logo}>bitta</div>
        
        <div style={styles.searchWrapper}>
          <div style={styles.searchIcon}><Icons.Search /></div>
          <input 
            type="text" 
            placeholder="Qidiruv..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>✕</button>
          )}
        </div>

        <button style={styles.burgerButton} onClick={() => setIsMenuOpen(true)}>
          <div style={styles.burgerLine}></div>
          <div style={styles.burgerLine}></div>
        </button>
      </header>

      {/* SEARCH / ADS */}
      {searchQuery.trim() !== "" && (
        <div style={styles.adsSection}>
          <div style={styles.adsSectionHeader}>Natijalar</div>
          {filteredAds.length > 0 ? (
            filteredAds.map(ad => (
              <div key={ad.id} style={styles.adCard} onClick={() => openLinkInside(ad.link)}>
                <div style={styles.adBadge}>{ad.badge}</div>
                <div style={styles.adTitle}>{ad.title}</div>
                <div style={styles.adDesc}>{ad.desc}</div>
              </div>
            ))
          ) : (
            <div style={styles.noAdsText}>Hech narsa topilmadi.</div>
          )}
        </div>
      )}

      {/* ======================================================= */}
      {/* 📦 БАК №1: ONLINE MARKET & DONAT */}
      <section style={styles.sectionBlock}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>ONLINE MARKET & DONAT</span>
        </div>
        <div style={styles.horizontalList}>
          <button style={styles.listItem} onClick={() => handleOpenShop("pubg")}>
            <div style={styles.itemIcon}><Icons.Gamepad /></div>
            <div style={styles.itemContent}>
              <span style={styles.itemTitle}>PUBG Mobile</span>
              <span style={styles.itemSub}>UC to'ldirish</span>
            </div>
          </button>

          <button style={styles.listItem} onClick={() => handleOpenShop("freefire")}>
            <div style={{ ...styles.itemIcon, color: "#f97316" }}><Icons.Diamond /></div>
            <div style={styles.itemContent}>
              <span style={styles.itemTitle}>Free Fire</span>
              <span style={styles.itemSub}>Almazlar</span>
            </div>
          </button>

          <button style={styles.listItem} onClick={() => handleOpenShop("premium")}>
            <div style={{ ...styles.itemIcon, color: "#a855f7" }}><Icons.Premium /></div>
            <div style={styles.itemContent}>
              <span style={styles.itemTitle}>TG Premium</span>
              <span style={styles.itemSub}>Tezkor obuna</span>
            </div>
          </button>

          <button style={styles.listItem} onClick={() => handleOpenShop("steam")}>
            <div style={{ ...styles.itemIcon, color: "#3b82f6" }}><Icons.Steam /></div>
            <div style={styles.itemContent}>
              <span style={styles.itemTitle}>Steam</span>
              <span style={styles.itemSub}>Hamyon balansi</span>
            </div>
          </button>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 📦 БАК №2: O'QISH VA IMTIHONLARGA TAYYORGARLIK */}
      <section style={styles.sectionBlock}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>O'QISH & IMTIHONLAR</span>
        </div>
        <div style={styles.verticalList}>
          <button style={styles.listRow} onClick={() => openLinkInside("https://ielts.gg")}>
            <div style={{ ...styles.rowIcon, color: "#38bdf8" }}><Icons.Book /></div>
            <div style={styles.rowContent}>
              <span style={styles.rowTitle}>IELTS.GG</span>
              <span style={styles.rowSub}>Professional IELTS imtihoniga tayyorgarlik</span>
            </div>
            <span style={styles.arrowRight}>→</span>
          </button>

          <button style={styles.listRow} onClick={() => handleOpenEdu("cefr")}>
            <div style={{ ...styles.rowIcon, color: "#a78bfa" }}><Icons.Book /></div>
            <div style={styles.rowContent}>
              <span style={styles.rowTitle}>CEFR Imtihonlari</span>
              <span style={styles.rowSub}>Milliy sertifikat imtihon materiallari</span>
            </div>
            <span style={styles.arrowRight}>→</span>
          </button>

          <button style={styles.listRow} onClick={() => handleOpenEdu("prava")}>
            <div style={{ ...styles.rowIcon, color: "#facc15" }}><Icons.Pravaga /></div>
            <div style={styles.rowContent}>
              <span style={styles.rowTitle}>Pravaga Tayyorgarlik</span>
              <span style={styles.rowSub}>Avtomobil imtihoni (GAI) testlari</span>
            </div>
            <span style={styles.arrowRight}>→</span>
          </button>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 📦 БАК №3: ISHGA VAKANSIYA */}
      <section style={styles.sectionBlock}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>ISHGA VAKANSIYA</span>
        </div>
        <div style={styles.vacancyActionGrid}>
          <button style={styles.vacancyBtn} onClick={() => { setVacancyTab("job"); setIsVacancyOpen(true); }}>
            <div style={{ ...styles.cardIconWrapper, color: "#10b981" }}><Icons.Briefcase /></div>
            <span style={styles.vacancyBtnTitle}>Ish topish</span>
            <span style={styles.vacancyBtnSub}>Bo'sh vakansiyalar</span>
          </button>

          <button style={styles.vacancyBtn} onClick={() => { setVacancyTab("worker"); setIsVacancyOpen(true); }}>
            <div style={{ ...styles.cardIconWrapper, color: "#ec4899" }}><Icons.Briefcase /></div>
            <span style={styles.vacancyBtnTitle}>Ishga olish</span>
            <span style={styles.vacancyBtnSub}>Xodimlar rezyumesi</span>
          </button>
        </div>
      </section>

      {/* ======================================================= */}
      {/* 📦 БАК №4: REKLAMA */}
      <section style={{ ...styles.sectionBlock, marginBottom: "20px" }}>
        <div style={styles.promoAdBanner} onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
          <div style={styles.promoBadge}>REKLAMA XIZMATI</div>
          <div style={styles.promoTitle}>Bitta-da o'z brendingizni e'lon qiling!</div>
          <div style={styles.promoDesc}>Kanal, bot yoki xizmatlarni minglab faol foydalanuvchilarga ko'rsating.</div>
          <span style={styles.promoLinkBtn}>Murojaat qilish (@bitta_mngr)</span>
        </div>
      </section>

      {/* ========================================== */}
      {/* 📦 ШТОРКА МАГАЗИНА (BOTTOM SHEET) */}
      {isShopOpen && activeShopType && (
        <>
          <div style={styles.backdrop} onClick={() => setIsShopOpen(false)} />
          <div style={styles.bottomSheet}>
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>
                {shopProducts[activeShopType].title}
              </div>
              <button style={styles.closeModalBtn} onClick={() => setIsShopOpen(false)}>✕</button>
            </div>

            {/* Шаг 1: Выбор пака */}
            {shopStep === 1 && (
              <div style={styles.modalBody}>
                <p style={styles.subLabel}>Tarifni tanlang</p>
                <div style={styles.packGrid}>
                  {shopProducts[activeShopType].packs.map((pack, idx) => (
                    <button key={idx} style={styles.packCard} onClick={() => handleSelectPack(pack)}>
                      <div style={styles.packName}>{pack.name}</div>
                      <div style={styles.packPrice}>{pack.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Шаг 2: Ввод данных */}
            {shopStep === 2 && selectedPack && (
              <div style={styles.modalBody}>
                <div style={styles.orderSummary}>
                  Siz tanladingiz: <span style={{color: "#fff"}}>{selectedPack.name}</span> ({selectedPack.price})
                </div>
                <input 
                  type="text" 
                  placeholder={shopProducts[activeShopType].placeholder} 
                  value={userCredential}
                  onChange={(e) => setUserCredential(e.target.value)}
                  style={styles.modalInput}
                />
                <div style={styles.modalBtnGroup}>
                  <button style={styles.backBtn} onClick={() => setShopStep(1)}>Orqaga</button>
                  <button style={styles.nextBtn} onClick={handleConfirmCredentials}>Davom etish</button>
                </div>
              </div>
            )}

            {/* Шаг 3: Ручная оплата */}
            {shopStep === 3 && selectedPack && (
              <div style={styles.modalBody}>
                <div style={styles.paymentCard}>
                  <p style={styles.paymentInstruction}>
                    Ushbu kartaga roppa-rosa <strong style={{color: "#10b981"}}>{selectedPack.price}</strong> o'tkazing:
                  </p>
                  
                  <div style={styles.cardClipboardBox}>
                    <span style={styles.cardNumber}>8600 4910 2345 6789</span>
                    <button 
                      style={styles.copyBtn} 
                      onClick={() => {
                        navigator.clipboard.writeText("8600491023456789");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                    >
                      {copied ? "Nusxalandi! ✅" : "Nusxa olish"}
                    </button>
                  </div>
                  <div style={styles.cardHolder}>Karta egasi: MUSA A.</div>
                  <p style={styles.warningText}>
                    To'lovdan so'ng chekni rasmga oling va "To'lov qildim" tugmasini bosing.
                  </p>
                </div>

                <button style={styles.postAdBtn} onClick={handleFinishOrder}>
                  To'lov qildim ✅
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 📚 ШТОРКА ОБУЧЕНИЯ (CEFR / PRAVA) */}
      {isEduOpen && eduType && (
        <>
          <div style={styles.backdrop} onClick={() => setIsEduOpen(false)} />
          <div style={styles.bottomSheet}>
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>
                {eduType === "cefr" ? "CEFR Imtihonlari" : "Pravaga Tayyorgarlik"}
              </div>
              <button style={styles.closeModalBtn} onClick={() => setIsEduOpen(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p style={{ ...styles.rowSub, color: "#a1a1aa", fontSize: "14px", lineHeight: "1.5" }}>
                {eduType === "cefr" 
                  ? "Milliy CEFR imtihonlariga tayyorgarlik ko'rish uchun eng so'nggi testlar, audio materiallar va o'quv qo'llanmalari. Quyidagi tugma orqali bepul resurslar kanalimizga o'ting."
                  : "Yol harakati qoidalari (YHQ) va imtihon savollarining to'liq to'plami. Nazariy imtihonni 100% topshirish uchun eng yangi va interaktiv test tizimi."
                }
              </p>
              <button 
                style={styles.postAdBtn} 
                onClick={() => {
                  openTelegramLink(eduType === "cefr" ? "https://t.me/bitta_mngr" : "https://t.me/bitta_mngr");
                  setIsEduOpen(false);
                }}
              >
                Kanalga o'tish (Bepul) 🚀
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========================================== */}
      {/* 💼 ШТОРКА ВАКАНСИЙ (BOTTOM SHEET) */}
      {isVacancyOpen && (
        <>
          <div style={styles.backdrop} onClick={() => setIsVacancyOpen(false)} />
          <div style={{ ...styles.bottomSheet, maxHeight: "85vh" }}>
            <div style={styles.sheetIndicator}></div>
            <div style={styles.modalHeader}>
              <div style={styles.modalLogo}>Bitta Work</div>
              <button style={styles.closeModalBtn} onClick={() => setIsVacancyOpen(false)}>✕</button>
            </div>

            {!isCreatingVacancy ? (
              <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
                {/* Табы */}
                <div style={styles.tabContainer}>
                  <button 
                    style={{ ...styles.tabButton, ...(vacancyTab === "job" ? styles.activeTab : {}) }} 
                    onClick={() => setVacancyTab("job")}
                  >
                    Vakansiyalar
                  </button>
                  <button 
                    style={{ ...styles.tabButton, ...(vacancyTab === "worker" ? styles.activeTab : {}) }} 
                    onClick={() => setVacancyTab("worker")}
                  >
                    Rezyumelar
                  </button>
                </div>

                {/* Свиток вакансий */}
                <div style={styles.vacancyList}>
                  {mockVacancies.filter(v => v.type === vacancyTab).map(v => (
                    <div key={v.id} style={styles.vacancyCard}>
                      <div style={styles.vacancyRow}>
                        <span style={styles.vacancyTitle}>{v.title}</span>
                        <span style={styles.vacancyBudget}>{v.budget}</span>
                      </div>
                      <p style={styles.vacancyDesc}>{v.desc}</p>
                      <button style={styles.vacancyApplyBtn} onClick={() => openTelegramLink(`https://t.me/${v.contact.replace("@", "")}`)}>
                        Bog'lanish ({v.contact})
                      </button>
                    </div>
                  ))}
                </div>

                <button style={styles.postAdBtn} onClick={() => setIsCreatingVacancy(true)}>
                  E'lon joylashtirish
                </button>
              </div>
            ) : (
              /* Форма создания вакансии */
              <div style={styles.modalBody}>
                <div style={styles.tabContainer}>
                  <button 
                    style={{ ...styles.tabButton, ...(newVacType === "job" ? styles.activeTab : {}) }}
                    onClick={() => setNewVacType("job")}
                  >
                    Vakansiya
                  </button>
                  <button 
                    style={{ ...styles.tabButton, ...(newVacType === "worker" ? styles.activeTab : {}) }}
                    onClick={() => setNewVacType("worker")}
                  >
                    Rezyume
                  </button>
                </div>

                <input 
                  type="text" 
                  placeholder="Sarlavha (masalan: Designer kerak)" 
                  value={newVacTitle}
                  onChange={(e) => setNewVacTitle(e.target.value)}
                  style={styles.modalInput}
                />
                <input 
                  type="text" 
                  placeholder="Narxi / Maosh" 
                  value={newVacBudget}
                  onChange={(e) => setNewVacBudget(e.target.value)}
                  style={styles.modalInput}
                />
                <textarea 
                  placeholder="Batafsil tavsif va talablar..." 
                  value={newVacDesc}
                  onChange={(e) => setNewVacDesc(e.target.value)}
                  style={{ ...styles.modalInput, height: "70px", resize: "none" }}
                />
                <input 
                  type="text" 
                  placeholder="Telegram Username (masalan: @musa)" 
                  value={newVacContact}
                  onChange={(e) => setNewVacContact(e.target.value)}
                  style={styles.modalInput}
                />

                <div style={styles.modalBtnGroup}>
                  <button style={styles.backBtn} onClick={() => setIsCreatingVacancy(false)}>Bekor qilish</button>
                  <button style={styles.nextBtn} onClick={handleCreateVacancy}>Joylashtirish</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* DRAWER MENU */}
      {isMenuOpen && (
        <>
          <div style={styles.backdrop} onClick={() => setIsMenuOpen(false)} />
          <div style={styles.drawer}>
            <div style={styles.drawerHeader}>
              <span style={styles.drawerTitle}>Menyu</span>
              <button style={styles.closeButton} onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>
            <nav style={styles.drawerNav}>
              <button style={styles.navItem} onClick={() => alert("O'zbek tili faollashtirildi")}>
                🌐 O'zbekcha
              </button>
              <button style={styles.navItem} onClick={() => openTelegramLink("https://t.me/bitta_mngr")}>
                💬 Bog'lanish
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

// 💎 PREMIUM MINIMALIST DARK THEME WITH CLEAN LOGICAL CONTAINERS
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    backgroundColor: "#09090b", // Матовый космический черный
    color: "#f4f4f5", 
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Roboto, sans-serif",
    padding: "20px 16px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "16px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    gap: "12px",
    marginBottom: "20px",
  },
  logo: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  searchWrapper: {
    position: "relative",
    flexGrow: 1,
    maxWidth: "180px",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#71717a",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    backgroundColor: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    padding: "8px 12px 8px 32px",
    color: "#ffffff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#71717a",
    cursor: "pointer",
    fontSize: "12px",
  },
  burgerButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "4px",
  },
  burgerLine: {
    width: "22px",
    height: "1.5px",
    backgroundColor: "#ffffff",
    borderRadius: "1px",
  },
  adsSection: {
    backgroundColor: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "16px",
  },
  adsSectionHeader: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "700",
    color: "#71717a",
    marginBottom: "12px",
  },
  adCard: {
    backgroundColor: "#09090b",
    borderRadius: "10px",
    padding: "12px",
    cursor: "pointer",
    border: "1px solid rgba(255, 255, 255, 0.04)",
  },
  adBadge: {
    display: "inline-block",
    fontSize: "9px",
    backgroundColor: "#27272a",
    color: "#a1a1aa",
    padding: "3px 8px",
    borderRadius: "5px",
    marginBottom: "6px",
    fontWeight: "600",
  },
  adTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
  },
  adDesc: {
    fontSize: "12px",
    color: "#a1a1aa",
    marginTop: "2px",
  },
  noAdsText: {
    fontSize: "12px",
    color: "#71717a",
    textAlign: "center",
  },

  // СТИЛИ ЛОГИЧЕСКИХ СЕКЦИЙ ("РАЗДЕЛЬНЫЕ БАКИ")
  sectionBlock: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#111113", // Чуть глубже базового серого
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "16px",
  },
  sectionHeader: {
    marginBottom: "12px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#71717a",
    letterSpacing: "1px",
    textTransform: "uppercase",
  },

  // БАК 1: ГОРИЗОНТАЛЬНЫЙ РЫНОК
  horizontalList: {
    display: "flex",
    gap: "10px",
    overflowX: "auto",
    paddingBottom: "4px",
  },
  listItem: {
    flex: "0 0 auto",
    width: "120px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
    alignItems: "flex-start",
    textAlign: "left",
  },
  itemIcon: {
    color: "#10b981", // Тонкий зеленый акцент
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
  },
  itemContent: {
    display: "flex",
    flexDirection: "column",
  },
  itemTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#ffffff",
  },
  itemSub: {
    fontSize: "11px",
    color: "#71717a",
    marginTop: "2px",
  },

  // БАК 2: ВЕРТИКАЛЬНОЕ ОБУЧЕНИЕ
  verticalList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  listRow: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "12px",
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
    width: "100%",
  },
  rowIcon: {
    marginRight: "14px",
    display: "flex",
    alignItems: "center",
  },
  rowContent: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  },
  rowTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
  },
  rowSub: {
    fontSize: "11px",
    color: "#71717a",
    marginTop: "2.5px",
  },
  arrowRight: {
    fontSize: "14px",
    color: "#71717a",
    marginLeft: "10px",
  },

  // БАК 3: РАБОТА И ВАКАНСИИ
  vacancyActionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  vacancyBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    backgroundColor: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "14px",
    padding: "16px",
    cursor: "pointer",
    textAlign: "left",
  },
  cardIconWrapper: {
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
  },
  vacancyBtnTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
  },
  vacancyBtnSub: {
    fontSize: "11px",
    color: "#71717a",
    marginTop: "3px",
  },

  // БАК 4: РЕКЛАМА (PREMIUM BANNER)
  promoAdBanner: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: "1px dashed rgba(255, 255, 255, 0.15)",
    borderRadius: "14px",
    padding: "18px 16px",
    cursor: "pointer",
    textAlign: "left",
  },
  promoBadge: {
    display: "inline-block",
    fontSize: "9px",
    fontWeight: "800",
    color: "#09090b",
    backgroundColor: "#ffffff",
    padding: "3px 8px",
    borderRadius: "4px",
    marginBottom: "10px",
    letterSpacing: "0.5px",
  },
  promoTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#ffffff",
  },
  promoDesc: {
    fontSize: "12px",
    color: "#a1a1aa",
    marginTop: "4px",
    lineHeight: "1.4",
  },
  promoLinkBtn: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "700",
    color: "#38bdf8",
    marginTop: "12px",
  },

  // ШТОРКИ И ОБЩИЕ СТИЛИ (MODALS & BOTTOM SHEETS)
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(6px)",
    zIndex: 1000,
  },
  bottomSheet: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#18181b",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "16px 20px 32px 20px",
    zIndex: 1001,
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.5)",
  },
  sheetIndicator: {
    width: "40px",
    height: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: "2px",
    alignSelf: "center",
    marginBottom: "16px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  modalLogo: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  closeModalBtn: {
    background: "none",
    border: "none",
    color: "#71717a",
    fontSize: "18px",
    cursor: "pointer",
  },
  modalBody: {
    display: "flex",
    flexDirection: "column",
    paddingTop: "16px",
    gap: "16px",
    overflowY: "auto",
  },
  subLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#71717a",
    fontWeight: "700",
    margin: 0,
  },
  packGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "10px",
  },
  packCard: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "14px",
    padding: "18px 12px",
    cursor: "pointer",
    textAlign: "center",
  },
  packName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "4px",
  },
  packPrice: {
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "600",
  },
  orderSummary: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "13px",
    color: "#a1a1aa",
  },
  modalInput: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
    padding: "14px",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  modalBtnGroup: {
    display: "flex",
    gap: "10px",
  },
  backBtn: {
    flex: 1,
    backgroundColor: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#a1a1aa",
    padding: "14px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  nextBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    border: "none",
    color: "#09090b",
    padding: "14px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  paymentCard: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "16px",
    padding: "16px",
  },
  paymentInstruction: {
    fontSize: "13px",
    color: "#a1a1aa",
    margin: "0 0 14px 0",
  },
  cardClipboardBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#18181b",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    marginBottom: "10px",
  },
  cardNumber: {
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "monospace",
    color: "#ffffff",
  },
  copyBtn: {
    backgroundColor: "#ffffff",
    border: "none",
    color: "#09090b",
    fontSize: "11px",
    fontWeight: "700",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  cardHolder: {
    fontSize: "10px",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "14px",
  },
  warningText: {
    fontSize: "11px",
    color: "#f87171",
    margin: 0,
    lineHeight: "1.4",
  },
  tabContainer: {
    display: "flex",
    gap: "6px",
    margin: "12px 0 16px 0",
    backgroundColor: "#09090b",
    padding: "4px",
    borderRadius: "10px",
  },
  tabButton: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px",
    color: "#71717a",
    padding: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  activeTab: {
    backgroundColor: "#18181b",
    color: "#ffffff",
  },
  vacancyList: {
    flexGrow: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "16px",
  },
  vacancyCard: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "12px",
    padding: "14px",
  },
  vacancyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "6px",
  },
  vacancyTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#ffffff",
  },
  vacancyBudget: {
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  vacancyDesc: {
    fontSize: "12px",
    color: "#a1a1aa",
    margin: "0 0 12px 0",
    lineHeight: "1.4",
  },
  vacancyApplyBtn: {
    backgroundColor: "#18181b",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
  },
  postAdBtn: {
    backgroundColor: "#ffffff",
    border: "none",
    color: "#09090b",
    borderRadius: "12px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center",
  },

  // MENU DRAWER
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "260px",
    backgroundColor: "#18181b",
    borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "24px 20px",
    zIndex: 1001,
    display: "flex",
    flexDirection: "column",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  drawerTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#71717a",
    fontSize: "18px",
    cursor: "pointer",
  },
  drawerNav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  navItem: {
    backgroundColor: "#09090b",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: "10px",
    color: "#ffffff",
    padding: "14px",
    textAlign: "left",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};