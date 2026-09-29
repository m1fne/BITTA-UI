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
    const fromId = cb.from?.id;

    // Проверка прав админа
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean);

    if (adminIds.length > 0 && !adminIds.includes(fromId)) {
      await answerCallbackQuery(callbackId, "⛔ У вас нет прав!", true);
      return NextResponse.json({ ok: true });
    }

    // Обработка кнопок пополнения
    if (data.startsWith("dep:")) {
      const [_, action, depositId] = data.split(":");
      
      try {
        const deposit = await getDeposit(depositId);

        if (!deposit) {
          await answerCallbackQuery(callbackId, "Заявка не найдена!", true);
          return NextResponse.json({ ok: true });
        }

        const formattedAmount = Number(deposit.amount).toLocaleString("ru-RU");

        if (action === "approve") {
          await approveDeposit(depositId);

          // Обновляем сообщение у админа
          await editMessageText(
            chatId,
            messageId,
            `✅ <b>ОДОБРЕНО</b>\n💰 Сумма: <b>${formattedAmount} сум</b>\n🆔 Игрок: <code>${deposit.user_id}</code>`
          );

          // Пишем пользователю
          await sendMessage(
            deposit.user_id,
            `🎉 <b>Ваш баланс пополнен на ${formattedAmount} сум!</b>`
          );

          await answerCallbackQuery(callbackId, "Успешно одобрено ✅");
        } else if (action === "reject") {
          await rejectDeposit(depositId);

          // Обновляем сообщение у админа
          await editMessageText(
            chatId,
            messageId,
            `❌ <b>ОТКЛОНЕНО</b>\n💰 Сумма: <b>${formattedAmount} сум</b>\n🆔 Игрок: <code>${deposit.user_id}</code>`
          );

          // Пишем пользователю
          await sendMessage(
            deposit.user_id,
            `❌ <b>Заявка на пополнение (${formattedAmount} сум) отклонена.</b>`
          );

          await answerCallbackQuery(callbackId, "Заявка отклонена ❌");
        }
      } catch (err: any) {
        const msg = err?.message || "";
        const isProcessed = msg.includes("ALREADY_PROCESSED");
        await answerCallbackQuery(
          callbackId,
          isProcessed ? "Заявка уже обработана!" : "Ошибка БД",
          true
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Bot Route Error:", err);
    // САМОЕ ГЛАВНОЕ: Telegram ВСЕГДА получает 200 OK!
    return NextResponse.json({ ok: true });
  }
}