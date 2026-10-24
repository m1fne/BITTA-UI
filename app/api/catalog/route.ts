import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('game')?.toLowerCase() || '';
  
  // Проверяем и новый, и старый вариант переменной окружения
  const apiKey = process.env.LUDOVEX_API_KEY || process.env.PAYERPIN_API_KEY || '';
  
  const headers = { 
    'X-API-Key': apiKey,
    'Accept': 'application/json'
  };

  try {
    const res = await fetch('https://api.ludovex.org/api/v2/catalog', {
      headers,
      cache: 'no-store',
    });
    
    const json = await res.json();
    const rawData = json.data || json;

    if (!Array.isArray(rawData)) {
      return NextResponse.json({ error: "Не удалось получить список от Ludovex", raw: json }, { status: 500 });
    }

    const games = rawData.map((g: any) => ({
      game_key: g.game_key,
      base_game_key: g.base_game_key,
      name: g.name,
      region: g.region_label,
      currency: g.currency,
      from_price: g.from_price
    }));

    const filtered = query 
      ? games.filter((g: any) => g.name.toLowerCase().includes(query))
      : games;

    return NextResponse.json({
      total: filtered.length,
      instruction: 'Используйте ?game=часть_названия для поиска (например, /api/catalog?game=mobile или /api/catalog?game=blood)',
      games: filtered,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}