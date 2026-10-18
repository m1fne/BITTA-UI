import { supabase } from "@/lib/db";

// Настройки (при необходимости можно переопределить переменными окружения в Vercel)
const CHANNEL = process.env.CONTEST_CHANNEL || "@bitta_hub";
const MINIAPP_LINK_BASE = process.env.MINIAPP_LINK_BASE || "https://t.me/bitta_hub_bot";

export const MAX_FRIENDS = 6;

// Подписан ли пользователь на канал. null = не удалось проверить (ошибка Telegram)
export async function isChannelMember(userId: number): Promise<boolean | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(CHANNEL)}&user_id=${userId}`
    );
    const data = await res.json();

    if (!data?.ok) {
      // «user not found» и подобное значит, что человек не в канале
      const desc = String(data?.description || "").toLowerCase();
      if (desc.includes("user not found") || desc.includes("participant")) return false;
      console.error("getChatMember error:", data?.description);
      return null;
    }

    const status = data.result?.status;
    if (status === "creator" || status === "administrator" || status === "member") return true;
    if (status === "restricted" && data.result?.is_member) return true;
    return false;
  } catch (err) {
    console.error("getChatMember failed:", err);
    return null;
  }
}

export type GrantResult = { granted: boolean; ticket_no?: number; reason?: string };

// Выдача билета через SQL-функцию (повторно один и тот же билет не выдаётся)
export async function grantTicket(
  userId: number,
  reason: "channel" | "friend" | "purchase",
  ref: string = ""
): Promise<GrantResult> {
  const { data, error } = await supabase.rpc("contest_grant_ticket", {
    p_user_id: userId,
    p_reason: reason,
    p_ref: ref,
  });

  if (error) {
    console.error("contest_grant_ticket error:", error.message);
    return { granted: false, reason: "error" };
  }

  return data as GrantResult;
}

// Регистрация приглашённого друга
export async function registerReferral(inviter: number, invitee: number): Promise<boolean> {
  const { data, error } = await supabase.rpc("contest_register_referral", {
    p_inviter: inviter,
    p_invitee: invitee,
  });

  if (error) {
    console.error("contest_register_referral error:", error.message);
    return false;
  }

  return Boolean(data);
}

// Состояние конкурса для пользователя (что показывать на экране)
export async function getContestState(userId: number) {
  const { data: contest } = await supabase
    .from("contests")
    .select("id, title, is_active, starts_at, ends_at")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!contest) return null;

  const now = Date.now();
  const isOpen =
    contest.is_active &&
    new Date(contest.starts_at).getTime() <= now &&
    (!contest.ends_at || new Date(contest.ends_at).getTime() > now);

  const { data: tickets } = await supabase
    .from("contest_tickets")
    .select("ticket_no, reason")
    .eq("contest_id", contest.id)
    .eq("user_id", userId)
    .order("ticket_no", { ascending: true });

  const { data: refs } = await supabase
    .from("contest_referrals")
    .select("invitee_id")
    .eq("contest_id", contest.id)
    .eq("inviter_id", userId);

  const list = tickets || [];
  const friendTickets = list.filter((t: any) => t.reason === "friend").length;

  return {
    contest: {
      id: contest.id,
      title: contest.title,
      is_active: isOpen,
      ends_at: contest.ends_at,
    },
    tickets: list,
    channel_done: list.some((t: any) => t.reason === "channel"),
    purchase_done: list.some((t: any) => t.reason === "purchase"),
    purchase_count: list.filter((t: any) => t.reason === "purchase").length,
    friends: {
      counted: friendTickets,
      invited: (refs || []).length,
      max: MAX_FRIENDS,
    },
    invite_link: `${MINIAPP_LINK_BASE}?startapp=ref_${userId}`,
    channel_url: `https://t.me/${CHANNEL.replace("@", "")}`,
  };
}