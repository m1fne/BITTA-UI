"use client";

interface WalletViewProps {
  balance: number;
  onOpenDeposit: () => void;
}

export default function WalletView({ balance, onOpenDeposit }: WalletViewProps) {
  return (
    <div style={{ padding: "16px", paddingBottom: "90px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#FFF", marginBottom: "16px" }}>
        Mening hamyonim
      </h2>

      <div style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "20px",
        padding: "20px",
        backdropFilter: "blur(10px)"
      }}>
        <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.6)", marginBottom: "8px" }}>
          Umumiy balans
        </div>
        <div style={{ fontSize: "28px", fontWeight: "800", color: "#FFF", marginBottom: "20px" }}>
          {balance.toLocaleString("uz-UZ")} <span style={{ color: "#A855F7" }}>UZS</span>
        </div>

        {/* Нажатие открывает ту же самую модалку, что и верхний счетчик */}
        <button 
          onClick={onOpenDeposit}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
            border: "none",
            borderRadius: "14px",
            color: "#FFF",
            fontWeight: "700",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(168, 85, 247, 0.3)"
          }}
        >
          + Balansni to'ldirish
        </button>
      </div>
    </div>
  );
}