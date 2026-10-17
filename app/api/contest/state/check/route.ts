import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { verifyTelegramInitData } from "@/lib/telegram-auth";
import { getContestState, grantTicket, isChannelMember, MAX_FRIENDS } from "@/lib/contest";

export const dynamic = "force-dynamic";

// Простая защита от частых нажатий (на уровне одного экземпляра сервера)
const lastCheck = new Map<number, number>();
const COOLDOWN_MS = 3000;

// Сколько приглашённых друзей проверяем за одно нажатие
const MAX_FRIEND_CHECKS = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = String(body?.initData || "");

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const userId = Number(tgUser.id);

    const now = Date.now();
    const last = lastCheck.get(userId) || 0;
    if (now - last < COOLDOWN_MS) {
      return NextResponse.json({ error: "TOO_FAST", message: "Biroz kuting va qayta urinib ko'ring" }, { status: 429 });
    }
    lastCheck.set(userId, now);

    const state0 = await getContestState(userId);
    if (!state0 || !state0.contest.is_active) {
      return NextResponse.json({
        ...(state0 || { contest: null }),
        message: "Konkurs yakunlangan",
        granted: 0,
      });
    }

    const contestId = state0.contest.id;
    const messages: string[] = [];
    let granted = 0;

    // 1. Подписка на канал
    if (!state0.channel_done) {
      const member = await isChannelMember(userId);

      if (member === null) {
        messages.push("Tekshirib bo'lmadi, birozdan keyin qayta urinib ko'ring");
      } else if (member) {
        const g = await grantTicket(userId, "channel");
        if (g.granted) {
          granted++;
          messages.push("Kanalga a'zolik tasdiqlandi: +1 chipta");
        }
      } else {
        messages.push("Siz hali kanalga a'zo emassiz");
      }
    }

    // 2. Приглашённые друзья: засчитываем тех, кто подписан на канал
    let friendsCounted = state0.friends.counted;

    if (friendsCounted < MAX_FRIENDS) {
      const { data: refs } = await supabase
        .from("contest_referrals")
        .select("invitee_id")
        .eq("contest_id", contestId)
        .eq("inviter_id", userId)
        .order("created_at", { ascending: true });

      const { data: friendTickets } = await supabase
        .from("contest_tickets")
        .select("ref")
        .eq("contest_id", contestId)
        .eq("user_id", userId)
        .eq("reason", "friend");

      const done = new Set((friendTickets || []).map((t: any) => String(t.ref)));
      const pending = (refs || [])
        .filter((r: any) => !done.has(String(r.invitee_id)))
        .slice(0, MAX_FRIEND_CHECKS);

      let friendGranted = 0;

      for (const r of pending) {
        if (friendsCounted >= MAX_FRIENDS) break;

        const member = await isChannelMember(Number(r.invitee_id));
        if (member) {
          const g = await grantTicket(userId, "friend", String(r.invitee_id));
          if (g.granted) {
            friendGranted++;
            friendsCounted++;
            granted++;
          }
        }
      }

      if (friendGranted > 0) {
        messages.push(`Do'stlar uchun +${friendGranted} chipta`);
      } else if (pending.length > 0) {
        messages.push("Taklif qilingan do'stlaringiz hali kanalga a'zo bo'lmagan");
      }
    }

    const state = await getContestState(userId);

    return NextResponse.json({
      ...(state || { contest: null }),
      message: messages.length > 0 ? messages.join(". ") : "Yangi chipta yo'q",
      granted,
    });
  } catch (err) {
    console.error("Ошибка в POST /api/contest/check:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}