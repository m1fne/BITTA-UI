import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTelegramInitData } from "@/lib/telegram-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_TELEGRAM_IDS?.split(",")[0]?.trim();

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 50_000_000;
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024; // 4 МБ (лимит тела запроса на Vercel ~4.5 МБ)

// -------------------------------------------------------------
// 1. GET: баланс и статус СВОЕГО депозита
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const initDataStr = searchParams.get("initData");
    const depositId = searchParams.get("id");

    if (!initDataStr) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    // Проверка подписи Telegram (с проверкой срока действия initData)
    const tgUser = verifyTelegramInitData(initDataStr);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const telegramId = Number(tgUser.id);

    // Статус депозита: только если он принадлежит этому пользователю
    if (depositId) {
      const { data: deposit } = await supabaseAdmin
        .from("deposits")
        .select("id, user_id, amount, status, created_at, updated_at")
        .eq("id", depositId)
        .eq("user_id", telegramId)
        .maybeSingle();

      return NextResponse.json({ deposit });
    }

    // Баланс
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
// 2. POST: заявка на пополнение
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const initDataStr = formData.get("initData") as string;
    const amountStr = String(formData.get("amount") ?? "");
    const receiptFile = formData.get("receipt") as File | null;

    if (!initDataStr) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    // 1. Проверка подписи Telegram
    const tgUser = verifyTelegramInitData(initDataStr);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    // 2. Проверка суммы: только целое число в допустимых границах
    const cleanAmount = amountStr.replace(/\s/g, "");
    const amount = /^\d+$/.test(cleanAmount) ? parseInt(cleanAmount, 10) : NaN;
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT", minAmount: MIN_AMOUNT, maxAmount: MAX_AMOUNT },
        { status: 400 }
      );
    }

    // 3. Проверка размера чека
    if (receiptFile && receiptFile.size > MAX_RECEIPT_BYTES) {
      return NextResponse.json({ error: "RECEIPT_TOO_LARGE" }, { status: 413 });
    }

    const telegramId = Number(tgUser.id);
    const username = tgUser.username ? `@${tgUser.username}` : "Mavjud emas";

    // 4. Защита от спама: нет ли УЖЕ незакрытой заявки
    const { data: existingPending } = await supabaseAdmin
      .from("deposits")
      .select("id")
      .eq("user_id", telegramId)
      .eq("status", "pending")
      .limit(1);

    if (existingPending && existingPending.length > 0) {
      return NextResponse.json(
        {
          error: "PENDING_DEPOSIT_EXISTS",
          reason: "Sizda ko'rib chiqilayotgan so'rov bor. Iltimos, adminga javobini kuting!",
        },
        { status: 400 }
      );
    }

    // 5. Upsert пользователя
    await supabaseAdmin
      .from("users")
      .upsert({ telegram_id: telegramId }, { onConflict: "telegram_id" });

    // 6. Создаем запись депозита
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
      // 23505 = нарушение уникальности: две заявки одновременно
      if (depositErr?.code === "23505") {
        return NextResponse.json(
          {
            error: "PENDING_DEPOSIT_EXISTS",
            reason: "Sizda ko'rib chiqilayotgan so'rov bor. Iltimos, adminga javobini kuting!",
          },
          { status: 400 }
        );
      }
      console.error("Ошибка создания депозита:", depositErr?.message);
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    // 7. Уведомление админу в Telegram
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

      let notified = false;
      try {
        let tgRes: Response;

        if (receiptFile && receiptFile.size > 0) {
          const tgForm = new FormData();
          tgForm.append("chat_id", ADMIN_CHAT_ID);
          tgForm.append("caption", caption);
          tgForm.append("parse_mode", "HTML");
          tgForm.append("reply_markup", JSON.stringify(replyMarkup));
          tgForm.append("photo", receiptFile);

          tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: "POST",
            body: tgForm,
          });
        } else {
          tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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

        notified = tgRes.ok;
        if (!tgRes.ok) {
          console.error("Telegram не принял уведомление админу:", tgRes.status);
        }
      } catch (notifyErr) {
        console.error("Ошибка отправки уведомления админу:", notifyErr);
      }

      // Если админ не получил заявку, закрываем её, чтобы пользователь мог повторить
      if (!notified) {
        await supabaseAdmin
          .from("deposits")
          .update({ status: "rejected", updated_at: new Date().toISOString() })
          .eq("id", deposit.id)
          .eq("status", "pending");

        return NextResponse.json({ error: "NOTIFY_FAILED" }, { status: 502 });
      }
    } else {
      console.warn("Не заданы BOT_TOKEN или ADMIN_TELEGRAM_IDS: админ не уведомлён о депозите", deposit.id);
    }

    return NextResponse.json({ success: true, deposit });
  } catch (err) {
    console.error("Ошибка в POST /api/deposit:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}