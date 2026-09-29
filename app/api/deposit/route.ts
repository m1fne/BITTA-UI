import { NextRequest, NextResponse } from "next/server";
import { createDeposit } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";

export async function GET() {
  return NextResponse.json({
    status: "online",
    message: "Эндпоинт депозитов работает.",
  });
}

export async function POST(req: NextRequest) {
  try {
    let telegramId: number | null = null;
    let username: string | null = null;
    let amount: number | null = null;

    const contentType = req.headers.get("content-type") || "";

    // 1. Если фронтенд прислал FormData (как в твоем коде)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      amount = Number(formData.get("amount"));

      // Распаковываем initData от Telegram, чтобы достать user.id и username
      const initDataStr = formData.get("initData") as string;
      if (initDataStr) {
        try {
          const urlParams = new URLSearchParams(initDataStr);
          const userJson = urlParams.get("user");
          if (userJson) {
            const user = JSON.parse(userJson);
            telegramId = Number(user.id);
            username = user.username || null;
          }
        } catch (e) {
          console.error("Ошибка парсинга initData:", e);
        }
      }

      // Прямые фоллбеки, если переданы отдельными полями
      if (!telegramId && formData.get("telegramId")) {
        telegramId = Number(formData.get("telegramId"));
      }
      if (!username && formData.get("username")) {
        username = String(formData.get("username"));
      }
    } 
    // 2. Если пришёл обычный JSON
    else {
      const body = await req.json().catch(() => null);
      if (body) {
        amount = Number(body.amount);
        telegramId = Number(body.telegramId);
        username = body.username || null;
      }
    }

    // Проверка суммы
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT", minAmount: 1000 },
        { status: 400 }
      );
    }

    // Проверка наличия Telegram ID
    if (!telegramId || isNaN(telegramId)) {
      return NextResponse.json(
        { 
          error: "AUTH_ERROR", 
          reason: "Не удалось получить Telegram ID из initData" 
        },
        { status: 400 }
      );
    }

    // Сохраняем в Supabase
    const deposit = await createDeposit(telegramId, amount);

    // Отправляем карточку админам в Telegram
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const messageText =
      `💳 <b>Новая заявка на пополнение!</b>\n\n` +
      `👤 Пользователь: ${username ? `@${username}` : telegramId}\n` +
      `🆔 Telegram ID: <code>${telegramId}</code>\n` +
      `💰 Сумма: <b>${amount.toLocaleString("ru-RU")} сум</b>\n\n` +
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

    // Возвращаем структуру, которую ждёт твой фронтенд (data.deposit.id)
    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
      },
    });
  } catch (err: any) {
    console.error("Deposit Route Error:", err);
    return NextResponse.json(
      { error: "SERVER_ERROR", reason: err?.message || "Internal Error" },
      { status: 500 }
    );
  }
}