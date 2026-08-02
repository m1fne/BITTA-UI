import { createClient } from "@supabase/supabase-js";

// Service Role Key — только на сервере, обходит RLS. Никогда не должен
// попадать во фронтенд (и тем более в переменную с префиксом NEXT_PUBLIC_).
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export interface User {
  telegram_id: number;
  username: string | null;
  balance: number;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: number;
  amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export async function getOrCreateUser(telegramId: number, username?: string | null): Promise<User> {
  const { data: existing, error: findErr } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (findErr) throw findErr;
  if (existing) return existing as User;

  const { data: created, error: insErr } = await supabase
    .from("users")
    .insert({ telegram_id: telegramId, username: username ?? null })
    .select()
    .single();

  if (insErr) throw insErr;
  return created as User;
}

export async function getBalance(telegramId: number): Promise<number> {
  const { data, error } = await supabase.from("users").select("balance").eq("telegram_id", telegramId).single();
  if (error) throw error;
  return Number(data.balance);
}

export async function createDeposit(userId: number, amount: number): Promise<Deposit> {
  const { data, error } = await supabase
    .from("deposits")
    .insert({ user_id: userId, amount, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data as Deposit;
}

export async function getDeposit(id: string): Promise<Deposit | null> {
  const { data, error } = await supabase.from("deposits").select("*").eq("id", id).single();
  if (error) return null;
  return data as Deposit;
}

export async function approveDeposit(depositId: string): Promise<void> {
  const { error } = await supabase.rpc("approve_deposit", { p_deposit_id: depositId });
  if (error) throw error;
}

export async function rejectDeposit(depositId: string): Promise<void> {
  const { error } = await supabase.rpc("reject_deposit", { p_deposit_id: depositId });
  if (error) throw error;
}// ===== Добавить в конец существующего lib/db.ts =====

export interface Order {
  id: string;
  order_no: number;
  user_id: number;
  service: string;
  product_name: string;
  target_id: string;
  price: number;
  status: "processing" | "completed" | "refunded";
  created_at: string;
}

export type PurchaseResult =
  | { ok: true; order: Order }
  | { ok: false; error: "INSUFFICIENT_BALANCE" | "USER_NOT_FOUND" | "UNKNOWN" };

// Проверка баланса и списание — одной атомарной транзакцией в БД (purchase_with_balance),
// поэтому здесь не нужно вручную проверять баланс заранее.
export async function purchaseWithBalance(
  userId: number,
  service: string,
  productName: string,
  targetId: string,
  price: number
): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc("purchase_with_balance", {
    p_user_id: userId,
    p_service: service,
    p_product_name: productName,
    p_target_id: targetId,
    p_price: price,
  });

  if (error) {
    if (error.message.includes("INSUFFICIENT_BALANCE")) return { ok: false, error: "INSUFFICIENT_BALANCE" };
    if (error.message.includes("USER_NOT_FOUND")) return { ok: false, error: "USER_NOT_FOUND" };
    return { ok: false, error: "UNKNOWN" };
  }

  return { ok: true, order: data as Order };
}

export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
  if (error) return null;
  return data as Order;
}

export async function completeOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_order", { p_order_id: orderId });
  if (error) throw error;
}

export async function refundOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc("refund_order", { p_order_id: orderId });
  if (error) throw error;
}// ===== Добавить в конец существующего lib/db.ts =====

export interface Vacancy {
  id: string;
  user_id: number;
  type: "job" | "worker";
  title: string;
  budget: string;
  description: string;
  contact: string;
  status: "active" | "archived";
  created_at: string;
}

export async function createVacancy(input: {
  userId: number;
  type: "job" | "worker";
  title: string;
  budget: string;
  description: string;
  contact: string;
}): Promise<Vacancy> {
  const { data, error } = await supabase
    .from("vacancies")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      budget: input.budget,
      description: input.description,
      contact: input.contact,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Vacancy;
}

export async function listVacancies(type: "job" | "worker", limit = 30): Promise<Vacancy[]> {
  const { data, error } = await supabase
    .from("vacancies")
    .select("*")
    .eq("type", type)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Vacancy[];
}

export async function getVacancy(id: string): Promise<Vacancy | null> {
  const { data, error } = await supabase.from("vacancies").select("*").eq("id", id).single();
  if (error) return null;
  return data as Vacancy;
}

export async function archiveVacancy(id: string): Promise<void> {
  const { error } = await supabase.from("vacancies").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
}