import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { verifyTelegramInitData } from "@/lib/telegram-auth";
import { getContestState, registerReferral } from "@/lib/contest";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = String(body?.initData || "");

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const userId = Number(tgUser.id);

    // Реферальная ссылка: startapp=ref_ID пригласившего
    const startParam = new URLSearchParams(initData).get("start_param") || "";
    const match = startParam.match(/^ref_(\d{3,15})$/);
    if (match) {
      const inviter = Number(match[1]);
      if (inviter && inviter !== userId) {
        // Сначала регистрируем приглашение (пока человек ещё «новый»)
        await registerReferral(inviter, userId);
      }
    }

    // Пользователь должен существовать в базе, чтобы его могли пригласить и выдать билеты
    await supabase.from("users").upsert({ telegram_id: userId }, { onConflict: "telegram_id", ignoreDuplicates: true });

    const state = await getContestState(userId);
    if (!state) {
      return NextResponse.json({ contest: null });
    }

    return NextResponse.json(state);
  } catch (err) {
    console.error("Ошибка в POST /api/contest/state:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}