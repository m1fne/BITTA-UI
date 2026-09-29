import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Создание заявки на депозит
export async function createDeposit(userId: number, amount: number) {
  // Убеждаемся, что пользователь существует в базе
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

// Атомарное ОДОБРЕНИЕ депозита через Хранимую Процедуру PostgreSQL
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

// АТОМАРНОЕ СПИСАНИЕ БАЛАНСА (для оплаты услуг или товаров в приложении)
export async function deductBalance(userId: number, amount: number, description: string) {
  const { data, error } = await supabase.rpc("deduct_user_balance", {
    p_telegram_id: userId,
    p_amount: amount,
    p_desc: description,
  });

  if (error) throw new Error(error.message);
  return data;
}

// Получение реального баланса пользователя
export async function getUserBalance(userId: number): Promise<number> {
  const { data, error } = await supabase
    .from("users")
    .select("balance")
    .eq("telegram_id", userId)
    .single();

  if (error || !data) return 0;
  return Number(data.balance);
}