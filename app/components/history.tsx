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
        const res = await fetch(`/api/history?telegramId=${telegramId}`);
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
                {/* Иконка типа */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: isDeposit ? "rgba(74, 222, 128, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0
                }}>
                  {isDeposit ? "💳" : "🎮"}
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
                    {tx.target_id ? `ID: ${tx.target_id} • ` : ''}
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