import { NextRequest, NextResponse } from "next/server";
import { debugVerifyTelegramInitData } from "@/lib/telegram-auth";
import { getOrCreateUser, createDeposit, getDeposit, getBalance } from "@/lib/db";
import { sendMessage, sendPhoto, escapeHtml } from "@/lib/telegram";

const MIN_DEPOSIT = 1000; // so'm

// POST /api/deposit — multipart/form-data: initData, amount, receipt (файл, необязателен)
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "INVALID_FORM" }, { status: 400 });

  const initData = form.get("initData");
  const amountRaw = form.get("amount");
  const receipt = form.get("receipt"); // File | null

  const { user: tgUser, reason } = debugVerifyTelegramInitData(typeof initData === "string" ? initData : "");
  if (!tgUser) return NextResponse.json({ error: "UNAUTHORIZED", reason }, { status: 401 });

  const amount = typeof amountRaw === "string" ? parseInt(amountRaw.replace(/[^\d]/g, ""), 10) : NaN;
  if (!Number.isFinite(amount) || amount < MIN_DEPOSIT) {
    return NextResponse.json({ error: "INVALID_AMOUNT", minAmount: MIN_DEPOSIT }, { status: 400 });
  }

  const user = await getOrCreateUser(tgUser.id, tgUser.username ?? null);
  const deposit = await createDeposit(user.telegram_id, amount);

  const who = user.username ? "@" + escapeHtml(user.username) : `id${user.telegram_id}`;
  const caption =
    `📥 <b>Yangi to'ldirish so'rovi</b>\n` +
    `👤 Foydalanuvchi: ${who}\n` +
    `💰 Summa: ${amount.toLocaleString("ru-RU")} so'm`;
  const buttons = [
    [
      { text: `✅ Tasdiqlash (+${amount.toLocaleString("ru-RU")})`, callback_data: `dep:approve:${deposit.id}` },
      { text: "❌ Rad etish", callback_data: `dep:reject:${deposit.id}` },
    ],
  ];

  const adminChatId = Number(process.env.ADMIN_CHAT_ID);
  if (adminChatId) {
    if (receipt instanceof File && receipt.size > 0) {
      await sendPhoto(adminChatId, receipt, receipt.name || "receipt.jpg", caption, buttons);
    } else {
      await sendMessage(adminChatId, caption + "\n\n⚠️ Chek rasmi biriktirilmagan.", buttons);
    }
  }

  return NextResponse.json({ deposit });
}

// GET /api/deposit?initData=...              -> { balance }
// GET /api/deposit?initData=...&id=...        -> { deposit }  (опрос статуса конкретной заявки)
export async function GET(req: NextRequest) {
  const initData = req.nextUrl.searchParams.get("initData");
  const id = req.nextUrl.searchParams.get("id");

  const { user: tgUser, reason } = debugVerifyTelegramInitData(initData ?? "");
  if (!tgUser) return NextResponse.json({ error: "UNAUTHORIZED", reason }, { status: 401 });

  if (id) {
    const deposit = await getDeposit(id);
    if (!deposit || deposit.user_id !== tgUser.id) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ deposit });
  }

  const user = await getOrCreateUser(tgUser.id, tgUser.username ?? null);
  const balance = await getBalance(user.telegram_id);
  return NextResponse.json({ balance });
}