import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function isFromTelegram(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  return req.headers.get("x-telegram-bot-api-secret-token") === secret;
}

// POST /api/bot
export async function POST(req: NextRequest) {
  if (!isFromTelegram(req)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => null);
  const cb = update?.callback_query;

  if (!cb) return NextResponse.json({ ok: true });

  // Динамический импорт: загружаем модули только при реальном запросе,
  // чтобы Next.js не пытался выполнить их во время сборки билда
  const db = await import("@/lib/db");
  const tg = await import("@/lib/telegram");

  const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);

  const fromId: number = cb.from?.id;
  const chatId: number = cb.message?.chat?.id;
  const messageId: number = cb.message?.message_id;
  const hasPhoto: boolean = Boolean(cb.message?.photo);
  const data: string = cb.data ?? "";

  if (!ADMIN_IDS.includes(fromId)) {
    await tg.answerCallbackQuery(cb.id, "Bu tugma faqat admin uchun", true);
    return NextResponse.json({ ok: true });
  }

  const [domain, action, id] = data.split(":");

  // ===== Пополнение баланса =====
  if (domain === "dep") {
    const deposit = await db.getDeposit(id);
    if (!deposit) {
      await tg.answerCallbackQuery(cb.id, "So'rov topilmadi", true);
      return NextResponse.json({ ok: true });
    }

    try {
      if (action === "approve") {
        await db.approveDeposit(id);
        await tg.editDecision(chatId, messageId, hasPhoto, `✅ <b>Tasdiqlandi</b>\n💰 +${deposit.amount.toLocaleString("ru-RU")} so'm`);
        await tg.sendMessage(deposit.user_id, `✅ Balansingiz ${deposit.amount.toLocaleString("ru-RU")} so'mga to'ldirildi!`);
        await tg.answerCallbackQuery(cb.id, "Tasdiqlandi ✅");
      } else if (action === "reject") {
        await db.rejectDeposit(id);
        await tg.editDecision(chatId, messageId, hasPhoto, `❌ <b>Rad etildi</b>\n💰 ${deposit.amount.toLocaleString("ru-RU")} so'm`);
        await tg.sendMessage(deposit.user_id, `❌ To'ldirish so'rovingiz (${deposit.amount.toLocaleString("ru-RU")} so'm) rad etildi.`);
        await tg.answerCallbackQuery(cb.id, "Rad etildi");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "UNKNOWN";
      await tg.answerCallbackQuery(cb.id, message.includes("ALREADY_DECIDED") ? "Bu so'rov allaqachon ko'rib chiqilgan" : "Xatolik yuz berdi", true);
    }

    return NextResponse.json({ ok: true });
  }

  // ===== Заказы (PUBG/Free Fire/Steam/Premium) =====
  if (domain === "ord") {
    const order = await db.getOrder(id);
    if (!order) {
      await tg.answerCallbackQuery(cb.id, "Buyurtma topilmadi", true);
      return NextResponse.json({ ok: true });
    }

    try {
      if (action === "complete") {
        await db.completeOrder(id);
        await tg.editDecision(chatId, messageId, hasPhoto, `✅ <b>Bajarildi</b> — buyurtma #${order.order_no} (${order.product_name})`);
        await tg.sendMessage(order.user_id, `✅ Buyurtmangiz (${order.product_name}) joylandi. Rahmat!`);
        await tg.answerCallbackQuery(cb.id, "Bajarildi ✅");
      } else if (action === "refund") {
        await db.refundOrder(id);
        await tg.editDecision(chatId, messageId, hasPhoto, `❌ <b>Bekor qilindi</b> — buyurtma #${order.order_no}, mablag' qaytarildi`);
        await tg.sendMessage(order.user_id, `❌ Buyurtmangiz (${order.product_name}) bekor qilindi, ${order.price.toLocaleString("ru-RU")} so'm hisobingizga qaytarildi.`);
        await tg.answerCallbackQuery(cb.id, "Bekor qilindi, pul qaytarildi");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "UNKNOWN";
      await tg.answerCallbackQuery(cb.id, message.includes("ALREADY_DECIDED") ? "Bu buyurtma allaqachon ko'rib chiqilgan" : "Xatolik yuz berdi", true);
    }

    return NextResponse.json({ ok: true });
  }

  // ===== Вакансии/резюме =====
  if (domain === "vac") {
    const vacancy = await db.getVacancy(id);
    if (!vacancy) {
      await tg.answerCallbackQuery(cb.id, "E'lon topilmadi", true);
      return NextResponse.json({ ok: true });
    }

    if (action === "archive") {
      await db.archiveVacancy(id);
      await tg.editDecision(chatId, messageId, hasPhoto, `🗑 <b>O'chirildi</b> — ${vacancy.title}`);
      await tg.answerCallbackQuery(cb.id, "O'chirildi");
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}