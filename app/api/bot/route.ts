import { NextRequest, NextResponse } from "next/server";
import { getDeposit, approveDeposit, rejectDeposit } from "@/lib/db";
import { answerCallbackQuery, editDecision, sendMessage } from "@/lib/telegram";

const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number);

// Telegram шлёт этот заголовок, только если вы указали secret_token при setWebhook —
// защищает вебхук от того, что кто-то посторонний найдёт URL и подделает апдейт.
function isFromTelegram(req: NextRequest) {
  return req.headers.get("x-telegram-bot-api-secret-token") === process.env.TELEGRAM_WEBHOOK_SECRET;
}

// POST /api/telegram/webhook — этот URL указывается в setWebhook
export async function POST(req: NextRequest) {
  if (!isFromTelegram(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const cb = update?.callback_query;

  // На прочие типы апдейтов просто отвечаем 200 — Telegram требует быстрый ответ на любой апдейт.
  if (!cb) return NextResponse.json({ ok: true });

  const fromId: number = cb.from?.id;
  const chatId: number = cb.message?.chat?.id;
  const messageId: number = cb.message?.message_id;
  const hasPhoto: boolean = Boolean(cb.message?.photo);
  const data: string = cb.data ?? "";

  if (!ADMIN_IDS.includes(fromId)) {
    await answerCallbackQuery(cb.id, "Bu tugma faqat admin uchun", true);
    return NextResponse.json({ ok: true });
  }

  const [domain, action, id] = data.split(":");
  if (domain !== "dep") return NextResponse.json({ ok: true });

  const deposit = await getDeposit(id);
  if (!deposit) {
    await answerCallbackQuery(cb.id, "So'rov topilmadi", true);
    return NextResponse.json({ ok: true });
  }

  try {
    if (action === "approve") {
      await approveDeposit(id);
      await editDecision(chatId, messageId, hasPhoto, `✅ <b>Tasdiqlandi</b>\n💰 +${deposit.amount.toLocaleString("ru-RU")} so'm`);
      await sendMessage(deposit.user_id, `✅ Balansingiz ${deposit.amount.toLocaleString("ru-RU")} so'mga to'ldirildi!`);
      await answerCallbackQuery(cb.id, "Tasdiqlandi ✅");
    } else if (action === "reject") {
      await rejectDeposit(id);
      await editDecision(chatId, messageId, hasPhoto, `❌ <b>Rad etildi</b>\n💰 ${deposit.amount.toLocaleString("ru-RU")} so'm`);
      await sendMessage(deposit.user_id, `❌ To'ldirish so'rovingiz (${deposit.amount.toLocaleString("ru-RU")} so'm) rad etildi.`);
      await answerCallbackQuery(cb.id, "Rad etildi");
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "UNKNOWN";
    // ALREADY_DECIDED — повторный клик админа (двойной тап). Не ошибка, просто сообщаем.
    await answerCallbackQuery(cb.id, message.includes("ALREADY_DECIDED") ? "Bu so'rov allaqachon ko'rib chiqilgan" : "Xatolik yuz berdi", true);
  }

  return NextResponse.json({ ok: true });
}