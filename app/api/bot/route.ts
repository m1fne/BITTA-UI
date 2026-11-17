import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDeposit, approveDeposit, rejectDeposit } from "@/lib/db";
import { answerCallbackQuery, editMessageText, sendMessage } from "@/lib/telegram";
import { supabase } from "@/lib/db";
import { isValidStars, starsToUzs, tgApi } from "@/lib/stars";

export const dynamic = "force-dynamic";

// Проверяем, что запрос действительно прислал Telegram (секрет задаётся в setWebhook)
function isFromTelegram(req: NextRequest): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const received = req.headers.get("x-telegram-bot-api-secret-token") || "";

  if (!expected || !received) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Выполняет второстепенное действие (уведомления) и не ломает основной процесс при ошибке
async function safe(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`Некритичная ошибка (${label}):`, err);
  }
}


// ===================== ОПЛАТА TELEGRAM STARS =====================

// Payload счёта: "stars:<telegramId>:<stars>"
function parseStarsPayload(payload: string): { userId: number; stars: number } | null {
  const m = /^stars:(\d{3,15}):(\d{1,6})$/.exec(payload || "");
  if (!m) return null;
  return { userId: Number(m[1]), stars: Number(m[2]) };
}

// Telegram спрашивает «можно принять платёж?» — отвечать нужно за 10 секунд
async function handlePreCheckout(q: any) {
  const p = parseStarsPayload(String(q.invoice_payload || ""));
  const valid =
    !!p &&
    q.currency === "XTR" &&
    Number(q.total_amount) === p.stars &&
    isValidStars(p.stars) &&
    Number(q.from?.id) === p.userId;

  await tgApi("answerPreCheckoutQuery", valid
    ? { pre_checkout_query_id: q.id, ok: true }
    : { pre_checkout_query_id: q.id, ok: false, error_message: "To'lov ma'lumotlari noto'g'ri" });
}

// Деньги списаны — зачисляем баланс. Возвращает false, если нужно повторить (Telegram пришлёт ещё раз).
async function handleStarsPaid(message: any): Promise<boolean> {
  const sp = message.successful_payment;
  const p = parseStarsPayload(String(sp?.invoice_payload || ""));
  const chargeId = String(sp?.telegram_payment_charge_id || "");

  if (!p || sp.currency !== "XTR" || Number(sp.total_amount) !== p.stars || !chargeId || Number(message.from?.id) !== p.userId) {
    console.error("Stars: странный платёж", JSON.stringify(sp).slice(0, 300));
    const admin = (process.env.ADMIN_TELEGRAM_IDS || "").split(",")[0]?.trim();
    if (admin) await safe("stars-admin-weird", () => sendMessage(Number(admin), `⚠️ Странный платёж Stars (проверьте вручную). charge_id: <code>${chargeId}</code>`));
    return true; // повторять нет смысла
  }

  const uzs = starsToUzs(p.stars);
  const { data, error } = await supabase.rpc("credit_stars_payment", {
    p_user_id: p.userId,
    p_charge_id: chargeId,
    p_stars: p.stars,
    p_amount: uzs,
  });

  if (error) {
    console.error("Stars: не удалось зачислить:", error.message);
    const admin = (process.env.ADMIN_TELEGRAM_IDS || "").split(",")[0]?.trim();
    if (admin) {
      await safe("stars-admin-fail", () =>
        sendMessage(Number(admin), `🚨 Stars оплачены, но баланс НЕ зачислен!\nПользователь: <code>${p.userId}</code>\n⭐ ${p.stars} = ${uzs} UZS\ncharge_id: <code>${chargeId}</code>\n${error.message}`)
      );
    }
    return false;
  }

  if (data === true) {
    await safe("stars-notify-user", () =>
      sendMessage(p.userId, `⭐ <b>Hisobingiz to'ldirildi!</b>\n\n💰 Qo'shildi: <b>${uzs.toLocaleString("uz-UZ")} so'm</b> (${p.stars} ⭐)`)
    );
  }
  return true; // data === false: платёж уже был зачислен раньше
}

export async function POST(req: NextRequest) {
  try {
    // 0. Запрос должен прийти от Telegram с верным секретом
    if (!isFromTelegram(req)) {
      console.warn("Webhook: неверный или отсутствующий секретный заголовок");
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const rawBody = await req.text().catch(() => "");
    if (!rawBody) return NextResponse.json({ ok: true });

    let update: any;
    try {
      update = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: true });
    }

    // --- Telegram Stars ---
    if (update?.pre_checkout_query) {
      await safe("pre-checkout", () => handlePreCheckout(update.pre_checkout_query));
      return NextResponse.json({ ok: true });
    }
    if (update?.message?.successful_payment) {
      const done = await handleStarsPaid(update.message);
      // 500 => Telegram повторит доставку; повторное зачисление невозможно (защита charge_id)
      return NextResponse.json({ ok: done }, { status: done ? 200 : 500 });
    }

    const cb = update?.callback_query;
    if (!cb) return NextResponse.json({ ok: true });

    const data = String(cb.data || "");
    const callbackId = cb.id;
    const chatId = cb.message?.chat?.id;
    const messageId = cb.message?.message_id;
    const fromId = Number(cb.from?.id);

    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean);

    // 1. Только админы. Если список админов пуст, не разрешаем никому.
    if (!fromId || !adminIds.includes(fromId)) {
      await safe("answer-not-admin", () =>
        answerCallbackQuery(callbackId, "⛔ Sizda admin huquqi yo'q!", true)
      );
      return NextResponse.json({ ok: true });
    }

    if (data.startsWith("dep:")) {
      const [, action, depositId] = data.split(":");

      try {
        const deposit = await getDeposit(depositId);

        if (!deposit) {
          await safe("answer-not-found", () =>
            answerCallbackQuery(callbackId, "So'rov topilmadi!", true)
          );
          return NextResponse.json({ ok: true });
        }

        // Уже обработанная заявка
        if (deposit.status !== "pending") {
          await safe("answer-already", () =>
            answerCallbackQuery(callbackId, "Bu so'rov allaqachon ko'rib chiqilgan!", true)
          );
          return NextResponse.json({ ok: true });
        }

        const formattedAmount = Number(deposit.amount).toLocaleString("uz-UZ");

        if (action === "approve") {
          // Критичное действие: зачисление денег
          await approveDeposit(depositId);

          // Остальное не должно мешать друг другу
          await safe("edit-message", () =>
            editMessageText(
              chatId,
              messageId,
              `✅ <b>TASDIQLANDI</b>\n💰 Summa: <b>${formattedAmount} so'm</b>\n🆔 ID: <code>${deposit.user_id}</code>`
            )
          );

          await safe("notify-user", () =>
            sendMessage(
              deposit.user_id,
              `🎉 <b>Hisobingiz muvaffaqiyatli to'ldirildi!</b>\n\n💰 Qo'shildi: <b>${formattedAmount} so'm</b>`
            )
          );

          await safe("answer-approve", () =>
            answerCallbackQuery(callbackId, "To'lov tasdiqlandi ✅")
          );
        } else if (action === "reject") {
          await rejectDeposit(depositId);

          await safe("edit-message", () =>
            editMessageText(
              chatId,
              messageId,
              `❌ <b>RAD ETILDI</b>\n💰 Summa: <b>${formattedAmount} so'm</b>\n🆔 ID: <code>${deposit.user_id}</code>`
            )
          );

          await safe("notify-user", () =>
            sendMessage(
              deposit.user_id,
              `❌ <b>To'lov so'rovingiz rad etildi (${formattedAmount} so'm).</b>`
            )
          );

          await safe("answer-reject", () =>
            answerCallbackQuery(callbackId, "So'rov rad etildi ❌")
          );
        }
      } catch (err: any) {
        console.error("ОШИБКА ОБРАБОТКИ ДЕПОЗИТА:", err);

        const msg = err?.message || "";
        const isProcessed =
          msg.includes("ALREADY_PROCESSED") || msg.includes("DEPOSIT_ALREADY_DECIDED");

        await safe("answer-error", () =>
          answerCallbackQuery(
            callbackId,
            isProcessed ? "Bu so'rov allaqachon ko'rib chiqilgan!" : `Xatolik: ${msg || "Baza xatosi"}`,
            true
          )
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ОШИБКА ВЕБХУКА БОТА:", err);
    return NextResponse.json({ ok: true });
  }
}