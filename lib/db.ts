import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

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
// 2. ПОКУПКИ И PAYERPIN (СНИТИЕ / ВОЗВРАТ)
// ==========================================

// Атомарное списание баланса и создание заказа
export async function purchaseWithBalance(
  userId: number,
  service: string,
  productName: string,
  targetId: string,
  price: number
) {
  // 1. Списываем деньги через SQL-процедуру (deduct_user_balance)
  const { data: balanceData, error: balanceErr } = await supabase.rpc("deduct_user_balance", {
    p_telegram_id: userId,
    p_amount: price,
    p_desc: `Покупка ${service}: ${productName}`,
  });

  if (balanceErr) {
    if (balanceErr.message?.includes("INSUFFICIENT_BALANCE") || balanceErr.message?.includes("недостаточно")) {
      throw new Error("INSUFFICIENT_BALANCE");
    }
    throw new Error(balanceErr.message);
  }

  // 2. Создаем запись о покупке в таблице orders
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      service: service,
      product_name: productName,
      target_id: targetId,
      price: price,
      status: "pending",
    })
    .select()
    .single();

  if (orderErr) {
    // Если запись заказа не создалась — возвращаем деньги обратно пользователю
    await supabase.rpc("deduct_user_balance", {
      p_telegram_id: userId,
      p_amount: -price,
      p_desc: "Отмена: ошибка создания заказа",
    });
    throw new Error(orderErr.message);
  }

  return order;
}

// Автоматический возврат денег, если PayerPin вернул ошибку
export async function refundOrder(orderId: string | number) {
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return;

  // Меням статус заказа на 'failed'
  await supabase
    .from("orders")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  // Возвращаем средства на баланс (передаем отрицательную сумму в deduct_user_balance)
  if (order.price > 0) {
    await supabase.rpc("deduct_user_balance", {
      p_telegram_id: order.user_id,
      p_amount: -Math.abs(order.price),
      p_desc: `Возврат за заказ #${orderId}`,
    });
  }
}

// Завершение заказа при успешной выдаче товара в PayerPin
export async function completeOrder(orderId: string | number) {
  await supabase
    .from("orders")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", orderId);
}