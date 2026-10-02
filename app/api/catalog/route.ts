import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameKey = searchParams.get('game');
  const apiKey = process.env.PAYERPIN_API_KEY || '';
  const headers = { 'X-API-Key': apiKey };

  try {
    if (!gameKey) {
      const res = await fetch('https://api.payerpin.uz/api/v2/catalog', {
        headers,
        cache: 'no-store',
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Запрашиваем сырые данные по конкретному ключу
    const res = await fetch(`https://api.payerpin.uz/api/v2/catalog/${encodeURIComponent(gameKey)}`, {
      headers,
      cache: 'no-store',
    });

    const rawData = await res.json();

    // Возвращаем как есть, чтобы увидеть настоящие поля
    return NextResponse.json({
      gameKey,
      status: res.status,
      raw_payerpin_response: rawData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}