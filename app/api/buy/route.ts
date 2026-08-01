import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram-auth";
import { getOrCreateUser, purchaseWithBalance } from "@/lib/db";
import { sendMessage, escapeHtml } from "@/lib/telegram";

// Короткая подпись службы для номера заказа (#UC-1711, #FF-204 и т.д.) — просто для красоты,
// на логику не влияет.
const ORDER_PREFIX: Record<string, string> = {
  pubg: "UC",
  freefire: "FF",
  steam: "STM",
  premium: "TG",
};

const SERVICE_LABEL: Record<string, string> = {
  pubg: "PUBG Mobile",
  freefire: "Free Fire",
  steam: "Steam",
  premium: "Telegram Premium",
};

// POST /api/buy  { initData, service, productName, targetId, price }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const initData: string | undefined = body?.initData;
  const service: string | undefined = body?.service;
  const productName: string | undefined = body?.productName;
  const targetId: string | undefined = body?.targetId;
  const price: number | undefined = body?.price;

  const tgUser = initData ? verifyTelegramInitData(initData) : null;
  if (!tgUser) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  if (!service?.trim() || !productName?.trim() || !targetId?.trim() || typeof price !== "number" || price <= 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const user = await getOrCreateUser(tgUser.id, tgUser.username ?? null);
  const result = await purchaseWithBalance(user.telegram_id, service.trim(), productName.trim(), targetId.trim(), price);

  if (!result.ok) {
    const status = result.error === "INSUFFICIENT_BALANCE" ? 402 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  }

  const order = result.order;
  const prefix = ORDER_PREFIX[order.service] ?? "ORD";
  const serviceLabel = SERVICE_LABEL[order.service] ?? order.service;
  const who = user.username ? `@${escapeHtml(user.username)}` : "username yo'q";

  const adminChatId = Number(process.env.ADMIN_CHAT_ID);
  if (adminChatId) {
    await sendMessage(
      adminChatId,
      `📦 <b>Yangi buyurtma #${prefix}-${order.order_no}</b>\n\n` +
        `🎮 Xizmat: ${escapeHtml(serviceLabel)}\n` +
        `💎 Paket: ${escapeHtml(order.product_name)}\n` +
        `🆔 Player ID: <code>${escapeHtml(order.target_id)}</code>\n` +
        `💰 Narxi: ${order.price.toLocaleString("ru-RU")} so'm\n` +
        `👤 Mijoz: ${who}\n` +
        `🆔 Telegram ID: <code>${user.telegram_id}</code>`,
      [
        [
          { text: "✅ Bajarildi", callback_data: `ord:complete:${order.id}` },
          { text: "❌ Bekor qilish (qaytarish)", callback_data: `ord:refund:${order.id}` },
        ],
      ]
    );
  }

  return NextResponse.json({ success: true, order });
}