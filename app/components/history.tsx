"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "deposit" | "purchase";
  status: "pending" | "approved" | "rejected";
  target_id?: string;
  created_at: string;
}

interface HistoryViewProps {
  telegramId?: number;
}

// 🔹 Форматирование денег: 13000 -> "13 000 UZS"
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat("ru-RU").format(Math.round(amount)) + " UZS";
};

// 🔹 Форматирование даты: "01.10.2026, 18:30"
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 🔹 Функция для выбора логотипа игры по названию
const getGameLogo = (title: string, type: string) => {
  if (type === "deposit") return null; // Для пополнения используем эмодзи/иконку кошелька
  
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("pubg")) return "/pubg_mobile.jpg";
  if (lowerTitle.includes("bloodstrike") || lowerTitle.includes("blood strike")) return "/bloodstrike.jpg";
  if (lowerTitle.includes("freefire") || lowerTitle.includes("free fire") || lowerTitle.includes("ff")) return "/ff_diamonds.jpg";
  if (lowerTitle.includes("mobile legends") || lowerTitle.includes("mlbb")) return "/mobile_legends.jpg";
  if (lowerTitle.includes("telegram") || lowerTitle.includes("premium")) return "/telegram_premium.jpg";
  
  return null; // Дефолт (если игра не распозналась)
};

export default function HistoryView({ telegramId }: HistoryViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!telegramId) {
      setLoading(false);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      try {
        // Безопасный запрос с передачей initData в заголовках
        const initData = window.Telegram?.WebApp?.initData ?? "";
        const res = await fetch(`/api/history?telegramId=${telegramId}`, {
          headers: { "x-telegram-init-data": initData },
        });
        const data = await res.json();
        if (data.success && data.history) {
          setTransactions(data.history);
        }
      } catch (err) {
        console.error("Ошибка загрузки истории:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [telegramId]);

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "approved":
        return { text: "Bajarildi", color: "#4ADE80", bg: "rgba(74, 222, 128, 0.12)" };
      case "pending":
        return { text: "Kutilmoqda", color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)" };
      case "rejected":
        return { text: "Bekor qilindi", color: "#F87171", bg: "rgba(248, 113, 113, 0.12)" };
      default:
        return { text: "Kutilmoqda", color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)" };
    }
  };

  return (
    <div style={{ padding: "16px", paddingBottom: "90px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFF", marginBottom: "16px" }}>
        Tranzaksiyalar tarixi
      </h2>

      {loading ? (
        <div style={{ color: "rgba(255, 255, 255, 0.5)", textAlign: "center", padding: "40px 0" }}>
          Yuklanmoqda...
        </div>
      ) : transactions.length === 0 ? (
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "30px",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.5)"
        }}>
          Hali hech qanday tranzaksiya mavjud emas
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {transactions.map((tx) => {
            const badge = getStatusBadge(tx.status);
            const isDeposit = tx.type === "deposit";
            const logoUrl = getGameLogo(tx.title, tx.type);

            return (
              <div
                key={tx.id}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px"
                }}
              >
                {/* Иконка или логотип игры */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: isDeposit ? "rgba(74, 222, 128, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                  overflow: "hidden"
                }}>
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={tx.title} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    isDeposit ? "💳" : "🎮"
                  )}
                </div>

                {/* Описание и дата */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#FFF",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {tx.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginTop: "2px" }}>
                    {tx.target_id ? `ID: ${tx.target_id} • ` : ""}
                    {formatDate(tx.created_at)}
                  </div>
                </div>

                {/* Красивая сумма и статус */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: isDeposit ? "#4ADE80" : "#FFF",
                    marginBottom: "4px"
                  }}>
                    {isDeposit ? "+" : "-"}{formatMoney(tx.amount)}
                  </div>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: badge.color,
                    background: badge.bg,
                    padding: "3px 8px",
                    borderRadius: "8px",
                    display: "inline-block"
                  }}>
                    {badge.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}