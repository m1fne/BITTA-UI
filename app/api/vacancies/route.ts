import { NextRequest, NextResponse } from "next/server";
import { debugVerifyTelegramInitData } from "@/lib/telegram-auth";
import { getOrCreateUser, createVacancy, listVacancies } from "@/lib/db";
import { sendMessage, escapeHtml } from "@/lib/telegram";

// GET /api/vacancies?type=job|worker
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  if (type !== "job" && type !== "worker") {
    return NextResponse.json({ error: "INVALID_TYPE" }, { status: 400 });
  }
  const vacancies = await listVacancies(type);
  return NextResponse.json({ vacancies });
}

// POST /api/vacancies  { initData, type, title, budget, description, contact }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const initData: string | undefined = body?.initData;
  const type: string | undefined = body?.type;
  const title: string | undefined = body?.title;
  const budget: string | undefined = body?.budget;
  const description: string | undefined = body?.description;
  const contact: string | undefined = body?.contact;

  // Временно: debugVerifyTelegramInitData вместо verifyTelegramInitData — чтобы увидеть
  // ТОЧНУЮ причину отказа (reason), а не просто "не прошло". Убрать после отладки.
  const { user: tgUser, reason } = debugVerifyTelegramInitData(initData ?? "");
  if (!tgUser) return NextResponse.json({ error: "UNAUTHORIZED", reason }, { status: 401 });

  if ((type !== "job" && type !== "worker") || !title?.trim() || !budget?.trim() || !description?.trim() || !contact?.trim()) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const user = await getOrCreateUser(tgUser.id, tgUser.username ?? null);
  const vacancy = await createVacancy({
    userId: user.telegram_id,
    type,
    title: title.trim(),
    budget: budget.trim(),
    description: description.trim(),
    contact: contact.trim(),
  });

  const adminChatId = Number(process.env.ADMIN_CHAT_ID);
  if (adminChatId) {
    await sendMessage(
      adminChatId,
      `📋 <b>Yangi e'lon</b> (${type === "job" ? "Ish taklifi" : "Ish qidiruvi"})\n\n` +
        `📝 ${escapeHtml(vacancy.title)}\n` +
        `💰 ${escapeHtml(vacancy.budget)}\n` +
        `${escapeHtml(vacancy.description)}\n\n` +
        `📞 ${escapeHtml(vacancy.contact)}`,
      [[{ text: "🗑 O'chirish", callback_data: `vac:archive:${vacancy.id}` }]]
    );
  }

  return NextResponse.json({ success: true, vacancy });
}