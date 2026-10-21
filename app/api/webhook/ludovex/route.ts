import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const rawText = await request.text();
    console.log('🛡️ Временный перехватчик Ludovex:', rawText);

    // Отвечаем 204 No Content на абсолютно любой запрос от их панели,
    // чтобы их валидация моментально пропустила сохранение URL.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse(null, { status: 204 });
  }
}