"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Страховка от вылета "supabaseKey is required"
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://afjfudogvkkjvdphjdrq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder_key";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "deposit" | "purchase";
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface HistoryViewProps {
  telegramId?: number;
}

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
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("telegram_id", telegramId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTransactions(data as Transaction[]);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [telegramId]);

  // Цвета и тексты статусов
  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "approved":
        return { text: "Bajarildi", color: "#4ADE80", bg: "rgba(74, 222, 128, 0.1)" };
      case "pending":
        return { text: "Kutilmoqda", color: "#FBBF24", bg: "rgba(251, 191, 36, 0.1)" };
      case "rejected":
        return { text: "Bekor qilindi", color: "#F87171", bg: "rgba(248, 113, 113, 0.1)" };
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
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#FFF", marginBottom: "2px" }}>
                    {tx.title}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)" }}>
                    {new Date(tx.created_at).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: isDeposit ? "#4ADE80" : "#FFF",
                    marginBottom: "4px"
                  }}>
                    {isDeposit ? "+" : "-"}{tx.amount.toLocaleString()} UZS
                  </div>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: badge.color,
                    background: badge.bg,
                    padding: "2px 8px",
                    borderRadius: "8px"
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