import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameKey = searchParams.get('game');
  const apiKey = process.env.PAYERPIN_API_KEY || '';
  const headers = { 'X-API-Key': apiKey };

  try {
    // 1. Если game не передан — отдаем полный список доступных игр
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

    // 2. Если запрашивают PUBG — опрашиваем сразу и pubg, и pubg_g2bulk
    const keysToFetch = gameKey.toLowerCase().includes('pubg')
      ? Array.from(new Set([gameKey, 'pubg', 'pubg_g2bulk']))
      : [gameKey];

    let allPackages: any[] = [];

    for (const key of keysToFetch) {
      try {
        const res = await fetch(
          `https://api.payerpin.uz/api/v2/catalog/${encodeURIComponent(key)}`,
          { headers, cache: 'no-store' }
        );

        if (!res.ok) continue;

        const json = await res.json();
        const rawData = json.data || json;

        let itemsToParse: any[] = [];

        // Разбираем любую структуру Payerpin (массивы или объекты key-value)
        if (Array.isArray(rawData)) {
          itemsToParse = rawData;
        } else if (typeof rawData === 'object' && rawData !== null) {
          const possibleArray =
            rawData.variations || rawData.items || rawData.products || rawData.packages;

          if (Array.isArray(possibleArray)) {
            itemsToParse = possibleArray;
          } else if (typeof possibleArray === 'object' && possibleArray !== null) {
            itemsToParse = Object.entries(possibleArray).map(([k, v]: [string, any]) => ({
              key: k,
              ...(typeof v === 'object' ? v : { name: k, price: v }),
            }));
          } else {
            itemsToParse = Object.entries(rawData).map(([k, v]: [string, any]) => ({
              key: k,
              ...(typeof v === 'object' ? v : { name: k, price: v }),
            }));
          }
        }

        // Преобразуем каждую позицию в чистый формат
        for (const item of itemsToParse) {
          const id = item.id ?? item.variation_id ?? item.key ?? item.code;
          const name = item.name ?? item.title ?? item.label ?? item.key ?? id;
          const price = item.price ?? item.amount ?? item.cost ?? 0;

          if (id) {
            allPackages.push({
              variation_id: String(id),
              name: String(name),
              price: Number(price) || 0,
            });
          }
        }
      } catch (e) {
        // Игнорируем ошибки отдельного ключа
      }
    }

    // Удаляем дубликаты
    const uniquePackages = Array.from(
      new Map(allPackages.map((item) => [item.variation_id, item])).values()
    );

    return NextResponse.json({
      game: gameKey,
      total_packs: uniquePackages.length,
      packages: uniquePackages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}