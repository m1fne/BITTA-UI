import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PAYERPIN_API_KEY || '';
  const headers = { 'X-API-Key': apiKey };

  try {
    // 1. Получаем список всех доступных сервисов Payerpin
    const mainRes = await fetch('https://api.payerpin.uz/api/v2/catalog', {
      headers,
      cache: 'no-store',
    });
    const mainData = await mainRes.json();

    const gamesList = Array.isArray(mainData.data) 
      ? mainData.data.map((g: any) => ({ game_key: g.game_key, name: g.name }))
      : [];

    // Целевые ключи для твоих 4 категорий
    const targetKeys = ['pubg', 'freefire', 'mlbb~global'];
    
    // Ищем Telegram в каталоге, если он там есть
    const tgGame = gamesList.find((g: any) => 
      g.game_key.includes('telegram') || g.name.toLowerCase().includes('telegram')
    );
    if (tgGame) {
      targetKeys.push(tgGame.game_key);
    }

    const variationsResult: Record<string, any> = {};

    // 2. Вытягиваем список пакетов (UC/Алмазов) для каждой игры
    for (const key of targetKeys) {
      try {
        const gameRes = await fetch(`https://api.payerpin.uz/api/v2/catalog/${key}`, {
          headers,
          cache: 'no-store',
        });
        const gameData = await gameRes.json();
        
        const rawVars = gameData.data?.variations || gameData.data || [];
        
        if (Array.isArray(rawVars)) {
          variationsResult[key] = rawVars.map((v: any) => ({
            variation_id: v.id ?? v.variation_id ?? v.key,
            name: v.name ?? v.title ?? v.label,
            price: v.price,
          }));
        } else {
          variationsResult[key] = rawVars;
        }
      } catch (e: any) {
        variationsResult[key] = { error: e.message };
      }
    }

    return NextResponse.json({
      target_variations: variationsResult,
      all_available_games: gamesList,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}