import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  const { error } = await supabase.rpc("approve_deposit", { p_deposit_id: id });
  if (error) throw new Error(error.message);
}

export async function rejectDeposit(id: string) {
  const { error } = await supabase.rpc("reject_deposit", { p_deposit_id: id });
  if (error) throw new Error(error.message);
}