import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Используем admin-ключ для работы с базой без ограничений RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_IDS?.split(",")[0]?.trim();

// -------------------------------------------------------------
// 1. GET: Получение баланса пользователя или статуса депозита
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const initDataStr = searchParams.get("initData");
    const depositId = searchParams.get("id");

    if (!initDataStr) {
      return NextResponse.json({ balance: 0 }, { status: 400 });
    }

    const urlParams = new URLSearchParams(initDataStr);
    const userJson = urlParams.get("user");
    if (!userJson) {
      return NextResponse.json({ balance: 0 }, { status: 400 });
    }

    const tgUser = JSON.parse(userJson);
    const telegramId = Number(tgUser.id);

    // Проверка конкретного депозита (для интервала в useEffect)
    if (depositId) {
      const { data: deposit } = await supabaseAdmin
        .from("deposits")
        .select("*")
        .eq("id", depositId)
        .maybeSingle();

      return NextResponse.json({ deposit });
    }

    // Чтение текущего баланса
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
// 2. POST: Создание новой заявки на пополнение (Депозит)
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const initDataStr = formData.get("initData") as string;
    const amountStr = formData.get("amount") as string;
    const receiptFile = formData.get("receipt") as File | null;

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT", minAmount: 1000 }, { status: 400 });
    }

    if (!initDataStr) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    const urlParams = new URLSearchParams(initDataStr);
    const userJson = urlParams.get("user");
    if (!userJson) {
      return NextResponse.json({ error: "INVALID_USER" }, { status: 400 });
    }

    const tgUser = JSON.parse(userJson);
    const telegramId = Number(tgUser.id);
    const username = tgUser.username ? `@${tgUser.username}` : "Mavjud emas";

    // 1. Создаем пользователя в таблице users, если его ещё нет
    await supabaseAdmin
      .from("users")
      .upsert({ telegram_id: telegramId }, { onConflict: "telegram_id" });

    // 2. Создаем заявку в таблице deposits
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
      console.error("Ошибка записи депозита:", depositErr);
      return NextResponse.json({ error: "DB_ERROR", reason: depositErr?.message }, { status: 500 });
    }

    // 3. Отправляем уведомление админу в Telegram
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

      // Если прикреплен чек-скриншот
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
        // Текстовое сообщение без фото
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