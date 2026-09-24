import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function getTelegramUser(initData?: string) {
  if (!initData) return null;
  try {
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initData, service, productName, targetId, price } = body;

    if (!targetId || !service || !productName || price === undefined) {
      return NextResponse.json({ success: false, error: "MISSING_FIELDS" }, { status: 400 });
    }

    // 1. Извлекаем Telegram ID из initData
    const tgUser = getTelegramUser(initData);
    if (!tgUser || !tgUser.id) {
      return NextResponse.json({ success: false, error: "NO_TELEGRAM_ID" }, { status: 400 });
    }

    const tgId = Number(tgUser.id);
    const numericPrice = Number(price);

    // 2. Вызываем атомарную функцию Supabase для проверки и списания баланса
    const { data: order, error: rpcError } = await supabase.rpc("purchase_with_balance", {
      p_user_id: tgId,
      p_service: service,
      p_product_name: productName,
      p_target_id: String(targetId),
      p_price: numericPrice,
    });

    if (rpcError) {
      console.error("❌ Ошибка Supabase RPC:", rpcError);
      
      if (rpcError.message?.includes("INSUFFICIENT_BALANCE")) {
        return NextResponse.json({ success: false, error: "INSUFFICIENT_BALANCE" }, { status: 400 });
      }
      if (rpcError.message?.includes("USER_NOT_FOUND")) {
        return NextResponse.json({ success: false, error: "USER_NOT_FOUND" }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: rpcError.message }, { status: 400 });
    }

    // 3. Сопоставляем тариф для Payerpin (B2B)
    const variationMap: Record<string, string> = {
      "60 UC": "v1",
      "325 UC": "v2",
      "660 UC": "v3",
      "1800 UC": "v4",
      "3850 UC": "v5",
      "8100 UC": "v6",
    };

    const variationId = variationMap[productName] || "v1";
    const idempotencyKey = `buy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 4. Отправляем запрос в Payerpin
    if (process.env.PAYERPIN_API_KEY) {
      try {
        const response = await fetch("https://api.payerpin.uz/api/v2/order", {
          method: "POST",
          headers: {
            "X-API-Key": process.env.PAYERPIN_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            game_key: service,
            variation_id: variationId,
            player_id: String(targetId),
            idempotency_key: idempotencyKey,
          }),
        });

        const payerpinData = await response.json();

        if (!response.ok || !payerpinData.ok) {
          console.error("⚠️ Ошибка Payerpin API, запускаем возврат:", payerpinData);
          
          // Если Payerpin откланил заказ, вызываем функцию возврата средств refund_order
          if (order?.id) {
            await supabase.rpc("refund_order", { p_order_id: order.id });
          }

          return NextResponse.json(
            { success: false, error: "PROVIDER_ERROR", details: payerpinData },
            { status: 400 }
          );
        }
      } catch (payerpinErr) {
        console.error("⚠️ Не удалось связаться с Payerpin API:", payerpinErr);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error("❌ Ошибка в POST /api/buy:", err);
    return NextResponse.json({ success: false, error: err.message || "SERVER_ERROR" }, { status: 500 });
  }
}