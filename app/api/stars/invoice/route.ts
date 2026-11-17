// app/api/stars/invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram-auth";
import { STAR_PACKS, starRate, starsToUzs, isValidStars, tgApi } from "@/lib/stars";

export const dynamic = "force-dynamic";

// Список пакетов для экрана (пересчёт в UZS делает сервер)
export async function GET() {
  return NextResponse.json({
    rate: starRate(),
    packs: STAR_PACKS.map((stars) => ({ stars, uzs: starsToUzs(stars) })),
  });
}

// Создаёт ссылку на счёт в звёздах
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tgUser = verifyTelegramInitData(String(body?.initData || ""));
    if (!tgUser) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const stars = Number(body?.stars);
    if (!isValidStars(stars)) return NextResponse.json({ error: "BAD_PACK" }, { status: 400 });

    const userId = Number(tgUser.id);
    const uzs = starsToUzs(stars);

    const { ok, data } = await tgApi("createInvoiceLink", {
      title: "Bitta hamyon",
      description: `Hamyonni to'ldirish: ${uzs.toLocaleString("ru-RU")} UZS`,
      payload: `stars:${userId}:${stars}`,
      currency: "XTR",
      prices: [{ label: "Balans", amount: stars }],
    });

    if (!ok || !data.result) {
      console.error("createInvoiceLink не удался:", JSON.stringify(data).slice(0, 300));
      return NextResponse.json({ error: "INVOICE_FAILED" }, { status: 502 });
    }

    return NextResponse.json({ link: data.result, uzs });
  } catch (err) {
    console.error("Ошибка /api/stars/invoice:", err);
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}