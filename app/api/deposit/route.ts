import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_IDS?.split(",")[0]?.trim();

/**
 * Проверка подлинности initData от Telegram
 */
function verifyTelegramInitData(initDataStr: string): boolean {
  if (!initDataStr || !BOT_TOKEN) return false;

  try {
    const urlParams = new URLSearchParams(initDataStr);
    const hash = urlParams.get("hash");
    if (!hash) return false;

    urlParams.delete("hash");

    // Сортируем параметры в алфавитном порядке
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    // Вычисляем секретный ключ HMAC-SHA256
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(BOT_TOKEN)
      .digest();

    // Считаем хэш данных
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(sortedParams)
      .digest("hex");

    return calculatedHash === hash;
  } catch (err) {
    console.error("Ошибка валидации initData:", err);
    return false;
  }
}

// -------------------------------------------------------------
// 1. GET: Безопасное получение баланса
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const initDataStr = searchParams.get("initData");
    const depositId = searchParams.get("id");

    if (!initDataStr) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    // ВАЛИДАЦИЯ: Проверяем, что запрос действительно отправлен из Telegram
    const isValid = verifyTelegramInitData(initDataStr);
    if (!isValid) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const urlParams = new URLSearchParams(initDataStr);
    const userJson = urlParams.get("user");
    if (!userJson) {
      return NextResponse.json({ error: "INVALID_USER" }, { status: 400 });
    }

    const tgUser = JSON.parse(userJson);
    const telegramId = Number(tgUser.id);

    // Проверка статуса депозита
    if (depositId) {
      const { data: deposit } = await supabaseAdmin
        .from("deposits")
        .select("*")
        .eq("id", depositId)
        .maybeSingle();

      return NextResponse.json({ deposit });
    }

    // Чтение баланса
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("balance")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ balance: 0 });
    }

    return NextResponse.json({
      balance: Number(user.balance || 0),
    });
  } catch (err) {
    console.error("Ошибка в GET /api/deposit:", err);
    return NextResponse.json({ balance: 0 }, { status: 500 });
  }
}

// -------------------------------------------------------------
// 2. POST: Безопасная отправка заявки
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const initDataStr = formData.get("initData") as string;
    const amountStr = formData.get("amount") as string;
    const receiptFile = formData.get("receipt") as File | null;

    if (!initDataStr) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    // ВАЛИДАЦИЯ: Проверяем подлинность подписи
    if (!verifyTelegramInitData(initDataStr)) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0 || amount < 1000) {
      return NextResponse.json({ error: "INVALID_AMOUNT", minAmount: 1000 }, { status: 400 });
    }

    const urlParams = new URLSearchParams(initDataStr);
    const userJson = urlParams.get("user");
    if (!userJson) {
      return NextResponse.json({ error: "INVALID_USER" }, { status: 400 });
    }

    const tgUser = JSON.parse(userJson);
    const telegramId = Number(tgUser.id);
    const username = tgUser.username ? `@${tgUser.username}` : "Mavjud emas";

    // Upsert пользователя
    await supabaseAdmin
      .from("users")
      .upsert({ telegram_id: telegramId }, { onConflict: "telegram_id" });

    // Создаем запись депозита
    const { data: deposit, error: depositErr } = await supabaseAdmin
      .from("deposits")
      .insert({
        user_id: telegramId,
        amount: amount,
        status: "pending",
      })
      .select()
      .single();

    if (depositErr || !deposit) {
      return NextResponse.json({ error: "DB_ERROR", reason: depositErr?.message }, { status: 500 });
    }

    // Отправка уведомления админу в Telegram
    if (BOT_TOKEN && ADMIN_CHAT_ID) {
      const formattedAmount = amount.toLocaleString("uz-UZ");
      const caption =
        `💳 <b>Yangi to'lov so'rovi!</b>\n\n` +
        `👤 Foydalanuvchi: ${username}\n` +
        `🆔 Telegram ID: <code>${telegramId}</code>\n` +
        `💰 Summa: <b>${formattedAmount} so'm</b>\n\n` +
        `📌 ID: <code>${deposit.id}</code>`;

      const replyMarkup = {
        inline_keyboard: [
          [
            { text: "✅ Tasdiqlash", callback_data: `dep:approve:${deposit.id}` },
            { text: "❌ Rad etish", callback_data: `dep:reject:${deposit.id}` },
          ],
        ],
      };

      if (receiptFile && receiptFile.size > 0) {
        const tgForm = new FormData();
        tgForm.append("chat_id", ADMIN_CHAT_ID);
        tgForm.append("caption", caption);
        tgForm.append("parse_mode", "HTML");
        tgForm.append("reply_markup", JSON.stringify(replyMarkup));
        tgForm.append("photo", receiptFile);

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: "POST",
          body: tgForm,
        });
      } else {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text: caption,
            parse_mode: "HTML",
            reply_markup: replyMarkup,
          }),
        });
      }
    }

    return NextResponse.json({ success: true, deposit });
  } catch (err: any) {
    console.error("Ошибка в POST /api/deposit:", err);
    return NextResponse.json({ error: "SERVER_ERROR", reason: err?.message }, { status: 500 });
  }
}