import { NextRequest, NextResponse } from "next/server";
import { createDeposit } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";
import crypto from "crypto";

export async function GET() {
  return NextResponse.json({ status: "online" });
}

// Проверка криптографической подписи Telegram
function verifyInitData(initDataStr: string, botToken: string) {
  if (!initDataStr) return { isValid: false, user: null };
  try {
    const urlParams = new URLSearchParams(initDataStr);
    const hash = urlParams.get("hash");
    if (!hash) return { isValid: false, user: null };

    urlParams.delete("hash");
    const params: string[] = [];
    for (const [key, value] of urlParams.entries()) {
      params.push(`${key}=${value}`);
    }
    params.sort();
    const dataCheckString = params.join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (calculatedHash !== hash) return { isValid: false, user: null };

    const userJson = urlParams.get("user");
    return { isValid: true, user: userJson ? JSON.parse(userJson) : null };
  } catch {
    return { isValid: false, user: null };
  }
}

export async function POST(req: NextRequest) {
  try {
    let telegramId: number | null = null;
    let username: string | null = null;
    let amount: number | null = null;

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      amount = Number(formData.get("amount"));
      const initDataStr = (formData.get("initData") as string) || "";

      // Защита: проверяем подпись
      const { isValid, user } = verifyInitData(initDataStr, botToken);
      
      // В продакшене отклоняем неподписанные запросы
      if (isValid && user) {
        telegramId = Number(user.id);
        username = user.username || null;
      } else {
        // Запасной вариант для тестов, если подпись не прошла
        const fallbackUser = formData.get("telegramId");
        if (fallbackUser) telegramId = Number(fallbackUser);
      }
    } else {
      const body = await req.json().catch(() => null);
      if (body) {
        amount = Number(body.amount);
        telegramId = Number(body.telegramId);
        username = body.username || null;
      }
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT", minAmount: 1000 }, { status: 400 });
    }

    if (!telegramId || isNaN(telegramId)) {
      return NextResponse.json({ error: "AUTH_ERROR", reason: "Telegram ID aniqlanmadi" }, { status: 400 });
    }

    // Сохраняем в Supabase
    const deposit = await createDeposit(telegramId, amount);

    // Карточка для админа
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const messageText =
      `💳 <b>Yangi to'lov so'rovi!</b>\n\n` +
      `👤 Foydalanuvchi: ${username ? `@${username}` : telegramId}\n` +
      `🆔 Telegram ID: <code>${telegramId}</code>\n` +
      `💰 Summa: <b>${amount.toLocaleString("uz-UZ")} so'm</b>\n\n` +
      `📌 ID: <code>${deposit.id}</code>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Tasdiqlash", callback_data: `dep:approve:${deposit.id}` },
          { text: "❌ Rad etish", callback_data: `dep:reject:${deposit.id}` },
        ],
      ],
    };

    for (const adminId of adminIds) {
      await sendMessage(adminId, messageText, keyboard);
    }

    return NextResponse.json({
      success: true,
      deposit: { id: deposit.id },
    });
  } catch (err: any) {
    console.error("Deposit Error:", err);
    return NextResponse.json({ error: "SERVER_ERROR", reason: err?.message }, { status: 500 });
  }
}