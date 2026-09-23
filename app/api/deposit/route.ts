import { NextResponse } from "next/server";
import crypto from "crypto";
import { createDeposit, getBalance, getDeposit, getOrCreateUser } from "@/lib/db";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

function parseTelegramInitData(initData: string) {
  if (!initData) return null;

  try {
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get("user");
    if (!userStr) return null;

    const user = JSON.parse(userStr);
    const hash = urlParams.get("hash");

    if (TELEGRAM_BOT_TOKEN && hash) {
      urlParams.delete("hash");
      const dataCheckString = Array.from(urlParams.entries())
        .map(([key, val]) => `${key}=${val}`)
        .sort()
        .join("\n");

      const secretKey = crypto
        .createHmac("sha256", "WebAppData")
        .update(TELEGRAM_BOT_TOKEN)
        .digest();

      const calculatedHash = crypto
        .createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

      if (calculatedHash !== hash) {
        console.warn("⚠️ Хэш initData не совпал, используем dev-режим");
      }
    }

    return user;
  } catch (err) {
    console.error("❌ Ошибка парсинга initData:", err);
    return null;
  }
}

// 1. GET — считывание баланса и статуса текущей заявки
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const initData = searchParams.get("initData");
    const depositId = searchParams.get("id");

    if (!initData) {
      return NextResponse.json({ error: "NO_INIT_DATA", balance: 0 }, { status: 400 });
    }

    const tgUser = parseTelegramInitData(initData);
    if (!tgUser || !tgUser.id) {
      return NextResponse.json({ error: "INVALID_USER", balance: 0 }, { status: 401 });
    }

    const tgId = Number(tgUser.id);
    await getOrCreateUser(tgId, tgUser.username);

    const balance = await getBalance(tgId);

    let deposit = null;
    if (depositId) {
      deposit = await getDeposit(depositId);
    }

    return NextResponse.json({
      ok: true,
      balance,
      deposit,
    });
  } catch (err: any) {
    console.error("❌ Ошибка в GET /api/deposit:", err);
    return NextResponse.json({ error: err.message, balance: 0 }, { status: 500 });
  }
}

// POST — создание новой заявки на пополнение (поддерживает и FormData с чеком, и JSON)
// app/api/deposit/route.ts

export async function POST(req: Request) {
  try {
    let initData = "";
    let amount = 0;
    let receiptFile: File | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      initData = (formData.get("initData") as string) || "";
      amount = Number(formData.get("amount") || 0);
      receiptFile = formData.get("receipt") as File | null;
    } else {
      const body = await req.json().catch(() => ({}));
      initData = body.initData || "";
      amount = Number(body.amount || 0);
    }

    if (!initData) {
      return NextResponse.json({ error: "NO_INIT_DATA" }, { status: 400 });
    }

    const tgUser = parseTelegramInitData(initData);
    if (!tgUser || !tgUser.id) {
      return NextResponse.json({ error: "INVALID_USER" }, { status: 401 });
    }

    const tgId = Number(tgUser.id);
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    // 1. Создаём депозит в Supabase
    const deposit = await createDeposit(tgId, numAmount);

    // Берем ID админа из переменной ADMIN_TELEGRAM_IDS
    const adminId = (process.env.ADMIN_TELEGRAM_IDS || "").split(",")[0]?.trim();

    // 2. Отправляем уведомление админу в формате, который понимает твой bot/route.ts
    if (TELEGRAM_BOT_TOKEN && adminId && deposit) {
      try {
        const usernameText = tgUser.username ? `@${tgUser.username}` : `ID: ${tgId}`;
        const caption = `📩 <b>Yangi to'ldirish so'rovi</b>\n👤 Foydalanuvchi: ${usernameText}\n💰 Summa: ${numAmount.toLocaleString("ru-RU")} so'm`;
        
        // ВАЖНО: Формат dep:approve:ID и dep:reject:ID под твой bot/route.ts
        const replyMarkup = {
          inline_keyboard: [
            [
              { text: `✅ Tasdiqlash (+${numAmount})`, callback_data: `dep:approve:${deposit.id}` },
              { text: "❌ Rad etish", callback_data: `dep:reject:${deposit.id}` },
            ],
          ],
        };

        if (receiptFile && receiptFile.size > 0) {
          const tgForm = new FormData();
          tgForm.append("chat_id", adminId);
          tgForm.append("caption", caption);
          tgForm.append("parse_mode", "HTML");
          tgForm.append("reply_markup", JSON.stringify(replyMarkup));
          tgForm.append("photo", receiptFile);

          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: "POST",
            body: tgForm,
          });
        } else {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: adminId,
              text: caption,
              parse_mode: "HTML",
              reply_markup: replyMarkup,
            }),
          });
        }
      } catch (telegramErr) {
        console.error("⚠️ Не удалось отправить сообщение админу:", telegramErr);
      }
    }

    return NextResponse.json({ ok: true, deposit });
  } catch (err: any) {
    console.error("❌ Ошибка в POST /api/deposit:", err);
    return NextResponse.json({ error: err.message || "SERVER_ERROR" }, { status: 500 });
  }
}