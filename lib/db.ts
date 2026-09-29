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
  const { data, error } = await supabase.from("deposits").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

// Вызываем вашу SQL-функцию approve_deposit(p_deposit_id)
export async function approveDeposit(id: string) {
  const { error } = await supabase.rpc("approve_deposit", {
    p_deposit_id: id,
  });

  if (error) throw new Error(error.message);
}

// Вызываем вашу SQL-функцию reject_deposit(p_deposit_id)
export async function rejectDeposit(id: string) {
  const { error } = await supabase.rpc("reject_deposit", {
    p_deposit_id: id,
  });

  if (error) throw new Error(error.message);
}

// --- ЗАКАЗЫ И ВАКАНСИИ ---

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

export async function completeOrder(orderId: string) {
  const { error } = await supabase.rpc("complete_order", {
    p_order_id: orderId,
  });

  if (error) throw new Error(error.message);
}

export async function refundOrder(orderId: string) {
  const { error } = await supabase.rpc("refund_order", {
    p_order_id: orderId,
  });

  if (error) throw new Error(error.message);
}

export async function getOrder(id: string) {
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function getVacancy(id: string) {
  const { data, error } = await supabase.from("vacancies").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function archiveVacancy(id: string) {
  const { error } = await supabase.from("vacancies").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
}