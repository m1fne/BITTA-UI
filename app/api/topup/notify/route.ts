import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Последние 4 цифры карты, на которую принимаем платежи (как в сообщении: HUMOCARD *4445)
const EXPECTED_CARD_LAST4 = process.env.PAYMENT_CARD_LAST4 || "4445";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Проверка секрета: запрос должен идти только от вашего телефона
function secretOk(req: NextRequest): boolean {
  const expected = process.env.TOPUP_NOTIFY_SECRET || "";
  const received = req.headers.get("x-topup-secret") || "";

  if (!expected || !received) return false;

  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function notifyAdmin(text: string) {
  try {
    const adminId = Number((process.env.ADMIN_TELEGRAM_IDS || "").split(",")[0]?.trim());
    if (!adminId) return;
    await sendMessage(adminId, text);
  } catch (err) {
    console.error("Не удалось уведомить админа:", err);
  }
}

// Достаём текст сообщения из тела запроса (JSON, форма или просто текст)
async function extractText(req: NextRequest): Promise<string> {
  const contentType = req.headers.get("content-type") || "";
  const raw = await req.text();

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const p = new URLSearchParams(raw);
    return p.get("text") || p.get("message") || raw;
  }

  try {
    const j = JSON.parse(raw);
    if (j && typeof j === "object") {
      return String(j.text ?? j.message ?? j.body ?? j.content ?? "");
    }
  } catch {
    // не JSON, используем как есть
  }

  return raw;
}

type Parsed = {
  direction: "in" | "out" | "unknown";
  amountTiyin: number | null;
  last4: string | null;
};

// Разбор сообщения Humo Card.
// Формат: "🎉 To'ldirish ➕ 274.809,17 UZS 📍 ... 💳 HUMOCARD *4445 🕓 ... 💰 баланс UZS"
function parseHumoMessage(text: string): Parsed {
  const hasIn = text.includes("➕") || /to.{0,2}ldirish/i.test(text);
  const hasOut = text.includes("➖") || /to.{0,2}lov/i.test(text);

  let direction: Parsed["direction"] = "unknown";
  if (hasIn && !hasOut) direction = "in";
  else if (hasOut && !hasIn) direction = "out";

  // Первая сумма в сообщении = сумма операции (баланс идёт позже)
  const amountMatch = text.match(/([0-9][0-9.\s\u00A0]*(?:,[0-9]{1,2})?)\s*UZS/i);
  let amountTiyin: number | null = null;

  if (amountMatch) {
    const normalized = amountMatch[1].replace(/[\s\u00A0.]/g, "").replace(",", ".");
    const value = Number(normalized);
    if (Number.isFinite(value) && value > 0) {
      amountTiyin = Math.round(value * 100);
    }
  }

  const cardMatch = text.match(/\*\s?(\d{4})/);

  return { direction, amountTiyin, last4: cardMatch ? cardMatch[1] : null };
}

export async function POST(req: NextRequest) {
  try {
    if (!secretOk(req)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const rawText = (await extractText(req)).slice(0, 2000);
    const text = rawText.trim();
    if (!text) {
      return NextResponse.json({ ok: true, result: "empty" });
    }

    const parsed = parseHumoMessage(text);

    // Зачисляем только поступления на нашу карту
    let direction: string = parsed.direction;
    if (direction === "in" && parsed.last4 !== EXPECTED_CARD_LAST4) {
      direction = "other_card";
    }
    if (parsed.amountTiyin === null && direction === "in") {
      direction = "unknown";
    }

    const hash = crypto
      .createHash("sha256")
      .update(text.replace(/\s+/g, " "))
      .digest("hex");

    const { data, error } = await supabase.rpc("credit_deposit_by_amount", {
      p_msg_hash: hash,
      p_raw: text,
      p_direction: direction,
      p_amount_tiyin: parsed.amountTiyin,
      p_card_last4: parsed.last4,
    });

    if (error) {
      console.error("Ошибка credit_deposit_by_amount:", error.message);
      await notifyAdmin(
        `❌ Ошибка автопополнения: не удалось обработать сообщение банка.\n\n${escapeHtml(text)}`
      );
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const result = (data as any)?.result;

    if (result === "credited") {
      const amount = Number((data as any).amount);
      const userId = Number((data as any).user_id);
      const formatted = amount.toLocaleString("uz-UZ");

      try {
        await sendMessage(
          userId,
          `🎉 <b>Hisobingiz muvaffaqiyatli to'ldirildi!</b>\n\n💰 Qo'shildi: <b>${formatted} so'm</b>`
        );
      } catch (err) {
        console.error("Не удалось уведомить пользователя:", err);
      }
    } else if (result === "no_match" && parsed.direction === "in") {
      await notifyAdmin(
        `⚠️ Пришёл платёж, но подходящей заявки нет.\n\n${escapeHtml(text)}\n\nПроверьте вручную.`
      );
    } else if (result === "ignored" && direction === "unknown" && /UZS/i.test(text)) {
      // Похоже на сообщение банка, но разобрать не удалось
      await notifyAdmin(
        `⚠️ Не удалось разобрать сообщение банка:\n\n${escapeHtml(text)}`
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Ошибка в POST /api/topup/notify:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}