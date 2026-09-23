import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  "https://placeholder.supabase.co";

const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

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

export async function createDeposit(telegramId: number, amount: number) {
  const tgId = Number(telegramId);
  
  // Гарантируем, что пользователь создан перед подачей заявки
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

  // 1. Гарантируем наличие пользователя в таблице users
  const user = await getOrCreateUser(tgId);

  // 2. Рассчитываем и обновляем баланс
  const currentBalance = Number(user?.balance ?? 0);
  const newBalance = currentBalance + Number(deposit.amount);

  // 3. Переводим статус депозита в approved
  await supabase.from("deposits").update({ status: "approved" }).eq("id", id);

  // 4. Записываем новый баланс и проверяем, что запись действительно изменилась
  const { data: updatedUsers, error: updateError } = await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("telegram_id", tgId)
    .select();

  if (updateError) {
    console.error("❌ Ошибка при обновлении баланса в approveDeposit:", updateError);
    throw updateError;
  }

  if (!updatedUsers || updatedUsers.length === 0) {
    console.error(`❌ Ошибка: пользователь с telegram_id=${tgId} не был обновлен`);
    throw new Error("USER_BALANCE_UPDATE_FAILED");
  }
}

export async function rejectDeposit(id: string) {
  const deposit = await getDeposit(id);
  if (!deposit || deposit.status !== "pending") throw new Error("ALREADY_DECIDED");

  await supabase.from("deposits").update({ status: "rejected" }).eq("id", id);
}

export async function getOrder(id: string) {
  const { data } = await supabase.from("orders").select("*").eq("id", id).single();
  return data;
}

export async function completeOrder(id: string) {
  const order = await getOrder(id);
  if (!order || order.status !== "pending") throw new Error("ALREADY_DECIDED");
  await supabase.from("orders").update({ status: "completed" }).eq("id", id);
}

export async function refundOrder(id: string) {
  const order = await getOrder(id);
  if (!order || order.status !== "pending") throw new Error("ALREADY_DECIDED");

  const tgId = Number(order.user_id);
  const user = await getOrCreateUser(tgId);

  await supabase.from("orders").update({ status: "refunded" }).eq("id", id);

  const currentBalance = Number(user?.balance ?? 0);
  const newBalance = currentBalance + Number(order.price);

  await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("telegram_id", tgId);
}

export async function getVacancy(id: string) {
  const { data } = await supabase.from("vacancies").select("*").eq("id", id).single();
  return data;
}

export async function archiveVacancy(id: string) {
  await supabase.from("vacancies").update({ status: "archived" }).eq("id", id);
}