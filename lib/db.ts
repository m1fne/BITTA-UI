import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("⚠️ SUPABASE_SERVICE_ROLE_KEY не задан в окружении: база будет работать через публичный ключ и операции с балансом не пройдут.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. ДЕПОЗИТЫ (ПОПОЛНЕНИЕ)
// ==========================================

// Создание заявки на депозит
export async function createDeposit(userId: number, amount: number) {
  await supabase.from("users").upsert({ telegram_id: userId }, { onConflict: "telegram_id" });

  const { data, error } = await supabase
    .from("deposits")
    .insert({
      user_id: userId,
      amount: amount,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Получение информации о депозите
export async function getDeposit(depositId: string) {
  const { data, error } = await supabase
    .from("deposits")
    .select("*")
    .eq("id", depositId)
    .single();

  if (error) return null;
  return data;
}

// Атомарное ОДОБРЕНИЕ депозита
export async function approveDeposit(depositId: string) {
  const { data, error } = await supabase.rpc("approve_deposit_transaction", {
    deposit_uuid: depositId,
  });

  if (error) throw new Error(error.message);
  return data;
}

// Атомарное ОТКЛОНЕНИЕ депозита
export async function rejectDeposit(depositId: string) {
  const { data, error } = await supabase
    .from("deposits")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", depositId)
    .eq("status", "pending")
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Получение баланса
export async function getUserBalance(userId: number): Promise<number> {
  const { data, error } = await supabase
    .from("users")
    .select("balance")
    .eq("telegram_id", userId)
    .single();

  if (error || !data) return 0;
  return Number(data.balance);
}

// ==========================================
// 2. ПОКУПКИ И PAYERPIN (СПИСАНИЕ / ВОЗВРАТ)
// Все три операции идут через SQL-функции Supabase, которые
// блокируют строку и проверяют статус внутри одной транзакции.
// ==========================================

// Атомарное списание баланса и создание заказа (статус 'processing')
export async function purchaseWithBalance(
  userId: number,
  service: string,
  productName: string,
  targetId: string,
  price: number
) {
  if (!userId || isNaN(Number(userId))) {
    throw new Error("Foydalanuvchi Telegram ID topilmadi (userId is null/undefined)");
  }

  // Защита: цена должна быть конечным числом больше нуля
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new Error("BAD_PRICE");
  }

  const { data, error } = await supabase.rpc("purchase_with_balance", {
    p_user_id: Number(userId),
    p_service: service,
    p_product_name: productName,
    p_target_id: targetId,
    p_price: price,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("INSUFFICIENT")) {
      throw new Error("INSUFFICIENT_FUNDS");
    }
    throw new Error(msg);
  }

  if (!data || !(data as any).id) {
    console.error("❌ purchase_with_balance не вернула заказ:", data);
    throw new Error("ORDER_NOT_RETURNED");
  }

  return data;
}

// Возврат денег, если PayerPin вернул ошибку.
// Сработает только один раз и только для заказа в статусе 'processing'.
export async function refundOrder(orderId: string | number) {
  const { error } = await supabase.rpc("refund_order", {
    p_order_id: String(orderId),
  });

  if (error) {
    if ((error.message || "").includes("ORDER_ALREADY_DECIDED")) {
      return false; // заказ уже обработан, повторный возврат не делаем
    }
    console.error("❌ Ошибка возврата заказа:", orderId, error.message);
    throw new Error(error.message);
  }

  return true;
}

// Завершение заказа при успешной выдаче товара в PayerPin
export async function completeOrder(orderId: string | number) {
  const { error } = await supabase.rpc("complete_order", {
    p_order_id: String(orderId),
  });

  if (error && !(error.message || "").includes("ORDER_ALREADY_DECIDED")) {
    console.error("❌ Ошибка завершения заказа:", orderId, error.message);
  }
}