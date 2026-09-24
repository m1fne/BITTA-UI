import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // По умолчанию загружаем pubg, если параметр не передан
  const gameKey = searchParams.get('game') || 'pubg';

  const apiKey = process.env.PAYERPIN_API_KEY || '';

  try {
    const res = await fetch(`https://api.payerpin.uz/api/v2/catalog/${encodeURIComponent(gameKey)}`, {
      headers: {
        'X-API-Key': apiKey,
      },
      cache: 'no-store',
    });

    const data = await res.json();

    return NextResponse.json({
      requested_game: gameKey,
      payerpin_response: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}