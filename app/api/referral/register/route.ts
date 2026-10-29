import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { verifyTelegramInitData } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

// Записывает приглашение (кто кого пригласил) в постоянную таблицу referrals.
// Не зависит от конкурса: работает и после его окончания.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = String(body?.initData || "");

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const userId = Number(tgUser.id);

    // Ссылка вида t.me/bitta_hub_bot?startapp=ref_<ID пригласившего>
    const startParam = new URLSearchParams(initData).get("start_param") || "";
    const match = startParam.match(/^ref_(\d{3,15})$/);
    if (!match) {
      return NextResponse.json({ ok: true, registered: false });
    }

    const inviter = Number(match[1]);
    if (!inviter || inviter === userId) {
      return NextResponse.json({ ok: true, registered: false });
    }

    // Пользователь должен существовать в базе
    await supabase
      .from("users")
      .upsert({ telegram_id: userId }, { onConflict: "telegram_id", ignoreDuplicates: true });

    // 1. Пригласивший должен существовать
    const { data: inviterRow } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("telegram_id", inviter)
      .maybeSingle();

    if (!inviterRow) {
      return NextResponse.json({ ok: true, registered: false });
    }

    // 2. Приглашённый должен быть НОВЫМ: аккаунт создан не больше часа назад и покупок ещё нет.
    // Так существующие клиенты не смогут "стать чьим-то другом" по ссылке.
    const { data: me } = await supabase
      .from("users")
      .select("created_at")
      .eq("telegram_id", userId)
      .maybeSingle();

    if (me?.created_at) {
      const ageMs = Date.now() - new Date(me.created_at).getTime();
      if (ageMs > 60 * 60 * 1000) {
        return NextResponse.json({ ok: true, registered: false });
      }
    }

    const { count: ordersCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((ordersCount || 0) > 0) {
      return NextResponse.json({ ok: true, registered: false });
    }

    // 3. Записываем (один друг приглашается один раз и навсегда)
    const { error } = await supabase
      .from("referrals")
      .insert({ invitee_id: userId, inviter_id: inviter });

    if (error && error.code !== "23505") {
      console.error("Реферал: ошибка записи:", error.message);
      return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, registered: !error });
  } catch (err) {
    console.error("Ошибка в POST /api/referral/register:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}