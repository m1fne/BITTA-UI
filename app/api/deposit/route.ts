import { NextRequest, NextResponse } from "next/server";
import { createDeposit } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text().catch(() => "");
    if (!rawBody) return NextResponse.json({ error: "Empty request" }, { status: 400 });

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { telegramId, amount, username } = body;

    if (!telegramId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // 1. Создаем депозит в базе
    const deposit = await createDeposit(Number(telegramId), Number(amount));

    // 2. Отправляем карточку админам
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const messageText = 
      `💳 <b>Новая заявка на пополнение!</b>\n\n` +
      `👤 Пользователь: ${username ? `@${username}` : telegramId}\n` +
      `🆔 Telegram ID: <code>${telegramId}</code>\n` +
      `💰 Сумма: <b>${Number(amount).toLocaleString("ru-RU")} сум</b>\n\n` +
      `📌 ID заявки: <code>${deposit.id}</code>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Одобрить", callback_data: `dep:approve:${deposit.id}` },
          { text: "❌ Отклонить", callback_data: `dep:reject:${deposit.id}` },
        ],
      ],
    };

    for (const adminId of adminIds) {
      await sendMessage(adminId, messageText, keyboard);
    }

    return NextResponse.json({ success: true, depositId: deposit.id });
  } catch (err: any) {
    console.error("Deposit Route Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}