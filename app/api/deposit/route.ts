import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET; // Секретный ключ вебхука
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || "")
  .split(",")
  .map((id) => id.trim());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Регулярное выражение для проверки UUID (защита от мусорных данных)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text,
      show_alert: showAlert,
    }),
  });
}

async function editMessageCaptionOrText(chatId: number, messageId: number, newText: string, isPhoto: boolean) {
  const method = isPhoto ? "editMessageCaption" : "editMessageText";
  const bodyKey = isPhoto ? "caption" : "text";

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      [bodyKey]: newText,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: [] },
    }),
  });
}

export async function POST(req: Request) {
  try {
    // 🛡️ УРОВЕНЬ ЗАЩИТЫ 1: Проверка секретного заголовка от Telegram
    const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (WEBHOOK_SECRET && incomingSecret !== WEBHOOK_SECRET) {
      console.warn("🚨 [SECURITY ALERT] Несанкционированная попытка вызова /api/bot!");
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();

    if (body.callback_query) {
      const callback = body.callback_query;
      const callbackId = callback.id;
      const data = String(callback.data || "");
      const userId = String(callback.from?.id || "");
      const chatId = callback.message?.chat?.id;
      const messageId = callback.message?.message_id;
      const isPhoto = !!callback.message?.photo;
      const originalText = callback.message?.caption || callback.message?.text || "";

      // 🛡️ УРОВЕНЬ ЗАЩИТЫ 2: Проверка прав Админа
      if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(userId)) {
        console.warn(`🚨 [SECURITY ALERT] Пользователь ${userId} попытался нажать админ-кнопку!`);
        await answerCallbackQuery(callbackId, "⛔ Sizda ushbu amalni bajarish uchun huquq yo'q!", true);
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("dep:approve:") || data.startsWith("dep:reject:")) {
        const [_, action, depositId] = data.split(":");

        // 🛡️ УРОВЕНЬ ЗАЩИТЫ 3: Проверка формата UUID
        if (!depositId || !UUID_REGEX.test(depositId)) {
          await answerCallbackQuery(callbackId, "❌ Noto'g'ri ID формати!", true);
          return NextResponse.json({ ok: true });
        }

        if (action === "approve") {
          // 🛡️ УРОВЕНЬ ЗАЩИТЫ 4: Вызов атомарной функции PostgreSQL (FOR UPDATE)
          const { error } = await supabase.rpc("approve_deposit", {
            p_deposit_id: depositId,
          });

          if (error) {
            console.error("❌ Ошибка одобрения депозита:", error);
            const isAlreadyDecided = error.message.includes("DEPOSIT_ALREADY_DECIDED");
            const alertText = isAlreadyDecided
              ? "⚠️ Bu so'rov allaqachon ko'rib chiqilgan!"
              : "❌ Xatolik yuz berdi!";
            await answerCallbackQuery(callbackId, alertText, true);
            return NextResponse.json({ ok: true });
          }

          await answerCallbackQuery(callbackId, "✅ To'lov tasdiqlandi va balans to'ldirildi!");
          const updatedCaption = `${originalText}\n\n<b>✅ TASDIQLANDI</b>`;
          await editMessageCaptionOrText(chatId, messageId, updatedCaption, isPhoto);

        } else if (action === "reject") {
          const { error } = await supabase.rpc("reject_deposit", {
            p_deposit_id: depositId,
          });

          if (error) {
            console.error("❌ Ошибка отклонения депозита:", error);
            const isAlreadyDecided = error.message.includes("DEPOSIT_ALREADY_DECIDED");
            const alertText = isAlreadyDecided
              ? "⚠️ Bu so'rov allaqachon ko'rib chiqilgan!"
              : "❌ Xatolik yuz berdi!";
            await answerCallbackQuery(callbackId, alertText, true);
            return NextResponse.json({ ok: true });
          }

          await answerCallbackQuery(callbackId, "❌ So'rov rad etildi!");
          const updatedCaption = `${originalText}\n\n<b>❌ RAD ETILDI</b>`;
          await editMessageCaptionOrText(chatId, messageId, updatedCaption, isPhoto);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Ошибка в bot/route.ts:", err);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}