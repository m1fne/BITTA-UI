import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameKey = searchParams.get('game');
  const apiKey = process.env.PAYERPIN_API_KEY || '';
  const headers = { 'X-API-Key': apiKey };

  try {
    // Если параметр game НЕ передан, отдаем полный список всех категорий/игр
    if (!gameKey) {
      const res = await fetch('https://api.payerpin.uz/api/v2/catalog', {
        headers,
        cache: 'no-store',
      });
      const data = await res.json();
      
      const games = Array.isArray(data.data)
        ? data.data.map((g: any) => ({
            game_key: g.game_key,
            name: g.name,
          }))
        : [];

      return NextResponse.json({
        instruction: 'Откройте ?game=game_key для просмотра пакетов конкретной игры',
        available_games: games,
      });
    }

    // Если передан ?game=..., запрашиваем конкретную игру
    const res = await fetch(`https://api.payerpin.uz/api/v2/catalog/${encodeURIComponent(gameKey)}`, {
      headers,
      cache: 'no-store',
    });

    const data = await res.json();
    const gameData = data.data || {};
    const rawVars = gameData.variations || gameData.items || (Array.isArray(gameData) ? gameData : []);

    const packages = Array.isArray(rawVars)
      ? rawVars.map((v: any) => ({
          variation_id: v.id ?? v.variation_id ?? v.key,
          name: v.name ?? v.title ?? v.label,
          price: v.price ?? v.amount,
        }))
      : [];

    return NextResponse.json({
      game: gameKey,
      total_packs: packages.length,
      packages: packages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}