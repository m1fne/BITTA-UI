// app/api/auth/telegram/route.ts — вход на сайте через виджет «Войти через Telegram»
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/db";
import { signWebSession } from "@/lib/web-session";

export const dynamic = "force-dynamic";

const botToken = () => process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";

// Проверка подписи данных виджета (https://core.telegram.org/widgets/login#checking-authorization)
function verifyWidget(data: Record<string, any>): boolean {
  const { hash, ...rest } = data;
  if (!hash || typeof hash !== "string" || !botToken()) return false;

  const checkString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken()).digest();
  const expected = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const data = body?.user && typeof body.user === "object" ? body.user : {};

    if (!verifyWidget(data)) {
      return NextResponse.json({ error: "BAD_SIGNATURE" }, { status: 401 });
    }

    // данные не старше суток
    const authDate = Number(data.auth_date);
    if (!authDate || Date.now() / 1000 - authDate > 86400) {
      return NextResponse.json({ error: "EXPIRED" }, { status: 401 });
    }

    const id = Number(data.id);
    if (!id) return NextResponse.json({ error: "BAD_USER" }, { status: 400 });

    const user = {
      id,
      username: data.username ? String(data.username) : undefined,
      first_name: data.first_name ? String(data.first_name) : undefined,
      last_name: data.last_name ? String(data.last_name) : undefined,
      photo_url: data.photo_url ? String(data.photo_url) : undefined,
    };

    const token = signWebSession(user);
    if (!token) {
      console.error("SESSION_SECRET не задан в переменных Vercel");
      return NextResponse.json({ error: "SERVER_NOT_CONFIGURED" }, { status: 500 });
    }

    // пользователь должен существовать в базе (как при входе из мини-аппа)
    await supabase.from("users").upsert(
      { telegram_id: id, username: user.username ?? null, first_name: user.first_name ?? null, last_seen_at: new Date().toISOString() },
      { onConflict: "telegram_id" }
    );

    return NextResponse.json({ token, user });
  } catch (err) {
    console.error("Ошибка /api/auth/telegram:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}