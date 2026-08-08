import { NextRequest, NextResponse } from "next/server";
import { debugVerifyTelegramInitData } from "@/lib/telegram-auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = "gemini-3.6-flash"; // актуальная бесплатная модель (2.5-flash сняли с раздачи новым пользователям в 2026)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT =
  "Siz BITTA AI — 'bitta' Telegram ilovasining yordamchisisiz. " +
  "Ilova orqali PUBG/Free Fire/Steam/Telegram Premium uchun donat qilish, " +
  "CEFR va GAI (pravaga) imtihonlariga tayyorgarlik, ish topish/joylashtirish va hisobni to'ldirish mumkin. " +
  "Savollarga qisqa, aniq va do'stona javob bering, asosan o'zbek tilida (agar foydalanuvchi boshqa tilda yozsa, o'sha tilda javob bering). " +
  "Agar savol ilovaga aloqasi bo'lmasa ham, oddiy foydali yordamchi sifatida javob bering.";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const initData: string | undefined = body?.initData;
  const message: string | undefined = body?.message;
  const history: ChatMessage[] = Array.isArray(body?.history) ? body.history : [];

  // Без этой проверки кто угодно мог бы дёргать эндпоинт напрямую и сжигать
  // общий бесплатный лимит Gemini в обход самой WebApp.
  const { user: tgUser, reason } = debugVerifyTelegramInitData(initData ?? "");
  if (!tgUser) {
    return NextResponse.json({ error: "UNAUTHORIZED", reason }, { status: 401 });
  }

  if (!message?.trim() || message.length > 1500) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  // Gemini использует роли "user" и "model" (не "assistant")
  const contents = [
    ...history.slice(-8).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.text).slice(0, 1500) }],
    })),
    { role: "user", parts: [{ text: message.trim() }] },
  ];

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    });

    if (res.status === 429) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Gemini error:", res.status, errText);
      return NextResponse.json({ error: "AI_ERROR", reason: `gemini_${res.status}: ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json({ error: "EMPTY_REPLY" }, { status: 502 });
    }

    return NextResponse.json({ reply: reply.trim() });
  } catch (e) {
    console.error("Gemini request failed:", e);
    return NextResponse.json({ error: "AI_ERROR", reason: "fetch_failed" }, { status: 502 });
  }
}