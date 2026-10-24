import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('game')?.toLowerCase() || '';
  const apiKey = process.env.LUDOVEX_API_KEY || '';
  
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

    // Если передали поиск (например, ?game=blood или ?game=mlbb) — ищем совпадения
    const games = rawData.map((g: any) => ({
      game_key: g.game_key, // Тот самый длинный ключ для запроса пакетов
      base_game_key: g.base_game_key,
      name: g.name,         // Нормальное человеческое название (например, "Mobile Legends (Malaysia)")
      region: g.region_label,
      currency: g.currency,
      from_price: g.from_price
    }));

    // Если в строке запроса что-то передали, фильтруем по названию
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