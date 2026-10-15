import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTelegramInitData } from "@/lib/telegram-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 3_000_000; // на старте ограничиваем сумму одного пополнения
const TTL_MINUTES = 20;

// -------------------------------------------------------------
// 1. GET: баланс и статус СВОЕГО депозита
// -------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const initDataStr = searchParams.get("initData");
    const depositId = searchParams.get("id");

    if (!initDataStr) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    const tgUser = verifyTelegramInitData(initDataStr);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    const telegramId = Number(tgUser.id);

    if (depositId) {
      const { data: deposit } = await supabaseAdmin
        .from("deposits")
        .select("id, user_id, amount, pay_amount, status, expires_at, created_at, updated_at")
        .eq("id", depositId)
        .eq("user_id", telegramId)
        .maybeSingle();

      return NextResponse.json({ deposit });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("balance")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ balance: 0 });
    }

    return NextResponse.json({
      balance: Number(user.balance || 0),
    });
  } catch (err) {
    console.error("Ошибка в GET /api/deposit:", err);
    return NextResponse.json({ balance: 0 }, { status: 500 });
  }
}

// -------------------------------------------------------------
// 2. POST: создаём заявку на автопополнение с уникальной суммой
// -------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const initDataStr = formData.get("initData") as string;
    const amountStr = String(formData.get("amount") ?? "");

    if (!initDataStr) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    const tgUser = verifyTelegramInitData(initDataStr);
    if (!tgUser) {
      return NextResponse.json({ error: "UNAUTHORIZED_INIT_DATA" }, { status: 401 });
    }

    // Сумма: только целое число в допустимых границах
    const cleanAmount = amountStr.replace(/\s/g, "");
    const amount = /^\d+$/.test(cleanAmount) ? parseInt(cleanAmount, 10) : NaN;
    if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: "INVALID_AMOUNT", minAmount: MIN_AMOUNT, maxAmount: MAX_AMOUNT },
        { status: 400 }
      );
    }

    const telegramId = Number(tgUser.id);

    const { data, error } = await supabaseAdmin.rpc("create_auto_deposit", {
      p_user_id: telegramId,
      p_amount: amount,
      p_ttl_minutes: TTL_MINUTES,
    });

    if (error) {
      const msg = error.message || "";

      if (msg.includes("TOO_BUSY")) {
        return NextResponse.json({ error: "TOO_BUSY" }, { status: 503 });
      }
      if (msg.includes("PENDING_EXISTS")) {
        return NextResponse.json(
          {
            error: "PENDING_DEPOSIT_EXISTS",
            reason: "Sizda ko'rib chiqilayotgan so'rov bor. Iltimos, adminga javobini kuting!",
          },
          { status: 400 }
        );
      }
      if (msg.includes("BAD_AMOUNT")) {
        return NextResponse.json(
          { error: "INVALID_AMOUNT", minAmount: MIN_AMOUNT, maxAmount: MAX_AMOUNT },
          { status: 400 }
        );
      }

      console.error("Ошибка create_auto_deposit:", msg);
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    const deposit: any = data;
    if (!deposit?.id) {
      console.error("create_auto_deposit не вернула заявку:", data);
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deposit: {
        id: deposit.id,
        user_id: deposit.user_id,
        amount: Number(deposit.amount),
        pay_amount: Number(deposit.pay_amount),
        status: deposit.status,
        expires_at: deposit.expires_at,
      },
    });
  } catch (err) {
    console.error("Ошибка в POST /api/deposit:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}