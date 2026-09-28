import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  "https://placeholder.supabase.co";

const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- ПОЛЬЗОВАТЕЛИ И БАЛАНС ---

export async function getOrCreateUser(telegramId: number, username?: string | null) {
  const tgId = Number(telegramId);
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", tgId)
    .single();

  if (user) return user;

  const { data: newUser, error } = await supabase
    .from("users")
    .insert([{ telegram_id: tgId, username }])
    .select()
    .single();

  if (error) throw error;
  return newUser;
}

export async function getBalance(telegramId: number) {
  const tgId = Number(telegramId);
  const { data, error } = await supabase
    .from("users")
    .select("balance")
    .eq("telegram_id", tgId)
    .single();

  if (error) {
    console.error("❌ Ошибка getBalance:", error);
    return 0;
  }

  return Number(data?.balance ?? 0);
}

// --- ДЕПОЗИТЫ ---

export async function createDeposit(telegramId: number, amount: number) {
  const tgId = Number(telegramId);
  await getOrCreateUser(tgId);

  const { data, error } = await supabase
    .from("deposits")
    .insert([{ user_id: tgId, amount: Number(amount), status: "pending" }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDeposit(id: string) {
  const { data } = await supabase.from("deposits").select("*").eq("id", id).single();
  return data;
}

export async function approveDeposit(id: string) {
  const deposit = await getDeposit(id);
  if (!deposit || deposit.status !== "pending") throw new Error("ALREADY_DECIDED");

  const tgId = Number(deposit.user_id);
  const user = await getOrCreateUser(tgId);

  // Переводим статус депозита в approved
  const { error: depError } = await supabase
    .from("deposits")
    .update({ status: "approved" })
    .eq("id", id);

  if (depError) throw depError;

  // Безопасное начисление баланса без перезаписи
  const { data: updatedUsers, error: updateError } = await supabase
    .from("users")
    .update({ balance: Number(user.balance ?? 0) + Number(deposit.amount) })
    .eq("telegram_id", tgId)
    .select();

  if (updateError || !updatedUsers?.length) {
    console.error("❌ Ошибка при пополнении баланса:", updateError);
    throw new Error("USER_BALANCE_UPDATE_FAILED");
  }
}

export async function rejectDeposit(id: string) {
  const deposit = await getDeposit(id);
  if (!deposit || deposit.status !== "pending") throw new Error("ALREADY_DECIDED");

  await supabase.from("deposits").update({ status: "rejected" }).eq("id", id);
}

// --- ЗАКАЗЫ (ИСПОЛЬЗУЕМ АТОМАРНЫЕ SQL-ФУНКЦИИ) ---

/**
 * Атомарная покупка (списание денег + создание заказа) через SQL-функцию
 */
export async function purchaseWithBalance(
  userId: number,
  service: string,
  productName: string,
  targetId: string,
  price: number
) {
  const { data, error } = await supabase.rpc("purchase_with_balance", {
    p_user_id: Number(userId),
    p_service: service,
    p_product_name: productName,
    p_target_id: targetId,
    p_price: Number(price),
  });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Отметка заказа выполненным
 */
export async function completeOrder(orderId: string) {
  const { error } = await supabase.rpc("complete_order", {
    p_order_id: orderId,
  });

  if (error) throw new Error(error.message);
}

/**
 * Возврат средств за заказ обратно на баланс
 */
export async function refundOrder(orderId: string) {
  const { error } = await supabase.rpc("refund_order", {
    p_order_id: orderId,
  });

  if (error) throw new Error(error.message);
}

export async function getOrder(id: string) {
  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  return data;
}

// --- ВАКАНСИИ ---

export async function getVacancy(id: string) {
  const { data } = await supabase.from("vacancies").select("*").eq("id", id).single();
  return data;
}

export async function archiveVacancy(id: string) {
  await supabase.from("vacancies").update({ status: "archived" }).eq("id", id);
}