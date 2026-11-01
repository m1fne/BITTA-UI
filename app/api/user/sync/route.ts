import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { verifyTelegramInitData } from "@/lib/telegram-auth";

export const dynamic = "force-dynamic";

// Сохраняет ник и имя пользователя при каждом входе в приложение,
// чтобы потом можно было найти человека (победители, рейтинг и т.д.).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = String(body?.initData || "");

    // Подлинность данных проверяем так же, как в других маршрутах
    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const userId = Number(tgUser.id);
    if (!userId || isNaN(userId)) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    // Ник и имя берём из уже проверенных данных Telegram
    let parsed: any = {};
    try {
      parsed = JSON.parse(new URLSearchParams(initData).get("user") || "{}");
    } catch {
      parsed = {};
    }

    // upsert меняет только перечисленные поля: баланс и дата создания не трогаются
    const { error } = await supabase.from("users").upsert(
      {
        telegram_id: userId,
        username: typeof parsed.username === "string" ? parsed.username : null,
        first_name: typeof parsed.first_name === "string" ? parsed.first_name : null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "telegram_id" }
    );

    if (error) {
      console.error("Синхронизация пользователя: ошибка:", error.message);
      return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Ошибка в POST /api/user/sync:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}