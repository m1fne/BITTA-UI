import { NextRequest, NextResponse } from "next/server";
import { createDeposit } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";

// 💡 ДОБАВЛЯЕМ ЭТОТ БЛОК: Защита для показа в браузере
export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "Эндпоинт депозитов работает. Отправляйте POST-запрос из Mini App.",
  });
}

// Ваш основной обработчик платежей
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Данные не переданы или формат не JSON" },
        { status: 400 }
      );
    }

    const { telegramId, amount, username, service } = body;

    if (!telegramId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Заполните сумму и Telegram ID" },
        { status: 400 }
      );
    }

    const deposit = await createDeposit(Number(telegramId), Number(amount));

    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const messageText =
      `🎮 <b>Новая заявка на пополнение!</b>\n\n` +
      `👤 Игрок: ${username ? `@${username}` : telegramId}\n` +
      `🆔 Telegram ID: <code>${telegramId}</code>\n` +
      `🎯 Сервис: <b>${service || "Пополнение баланса"}</b>\n` +
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
    return NextResponse.json({ error: "Ошибка на сервере" }, { status: 500 });
  }
}