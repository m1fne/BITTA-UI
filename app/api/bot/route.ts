import { NextRequest, NextResponse } from "next/server";
import { getDeposit, approveDeposit, rejectDeposit } from "@/lib/db";
import { answerCallbackQuery, editMessageText, sendMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text().catch(() => "");
    if (!rawBody) return NextResponse.json({ ok: true });

    let update: any;
    try {
      update = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ ok: true });
    }

    const cb = update?.callback_query;
    if (!cb) return NextResponse.json({ ok: true });

    const data = String(cb.data || "");
    const callbackId = cb.id;
    const chatId = cb.message?.chat?.id;
    const messageId = cb.message?.message_id;
    const fromId = Number(cb.from?.id);

    // Проверка прав админа
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean);

    if (adminIds.length > 0 && !adminIds.includes(fromId)) {
      await answerCallbackQuery(callbackId, "⛔ Sizda admin huquqi yo'q!", true);
      return NextResponse.json({ ok: true });
    }

    if (data.startsWith("dep:")) {
      const [_, action, depositId] = data.split(":");

      try {
        const deposit = await getDeposit(depositId);

        if (!deposit) {
          await answerCallbackQuery(callbackId, "So'rov topilmadi!", true);
          return NextResponse.json({ ok: true });
        }

        const formattedAmount = Number(deposit.amount).toLocaleString("uz-UZ");

        if (action === "approve") {
          // 1. Атомарное зачисление средств в PostgreSQL
          await approveDeposit(depositId);

          // 2. Обновление карточки админа
          await editMessageText(
            chatId,
            messageId,
            `✅ <b>TASDIQLANDI</b>\n💰 Summa: <b>${formattedAmount} so'm</b>\n🆔 ID: <code>${deposit.user_id}</code>`
          );

          // 3. Сообщение пользователю в личку на узбекском
          await sendMessage(
            deposit.user_id,
            `🎉 <b>Hisobingiz muvaffaqiyatli to'ldirildi!</b>\n\n💰 Qo'shildi: <b>${formattedAmount} so'm</b>`
          );

          await answerCallbackQuery(callbackId, "To'lov tasdiqlandi ✅");
        } else if (action === "reject") {
          // 1. Отклонение в базе
          await rejectDeposit(depositId);

          // 2. Обновление карточки админа
          await editMessageText(
            chatId,
            messageId,
            `❌ <b>RAD ETILDI</b>\n💰 Summa: <b>${formattedAmount} so'm</b>\n🆔 ID: <code>${deposit.user_id}</code>`
          );

          // 3. Сообщение пользователю
          await sendMessage(
            deposit.user_id,
            `❌ <b>To'lov so'rovingiz rad etildi (${formattedAmount} so'm).</b>`
          );

          await answerCallbackQuery(callbackId, "So'rov rad etildi ❌");
        }
      } catch (err: any) {
        const msg = err?.message || "";
        const isProcessed = msg.includes("ALREADY_PROCESSED") || msg.includes("DEPOSIT_ALREADY_DECIDED");
        await answerCallbackQuery(
          callbackId,
          isProcessed ? "Bu so'rov allaqachon ko'rib chiqilgan!" : "Xatolik yuz berdi",
          true
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bot Webhook Error:", err);
    return NextResponse.json({ ok: true });
  }
}