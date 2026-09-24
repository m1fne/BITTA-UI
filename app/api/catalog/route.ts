import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameKey = searchParams.get('game') || 'pubg';
  const apiKey = process.env.PAYERPIN_API_KEY || '';

  try {
    const res = await fetch(`https://api.payerpin.uz/api/v2/catalog/${encodeURIComponent(gameKey)}`, {
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store',
    });

    const data = await res.json();
    const gameData = data.data || {};
    const rawVars = gameData.variations || gameData.items || (Array.isArray(gameData) ? gameData : []);

    // Оставляем только UC, убираем Pass и подписки
    const ucPackages = Array.isArray(rawVars)
      ? rawVars
          .filter((v: any) => {
            const name = (v.name || v.title || v.label || '').toLowerCase();
            return name.includes('uc') && !name.includes('pass') && !name.includes('prime');
          })
          .map((v: any) => ({
            variation_id: v.id ?? v.variation_id ?? v.key,
            name: v.name ?? v.title ?? v.label,
            price: v.price ?? v.amount,
          }))
      : [];

    return NextResponse.json({
      game: gameKey,
      total_uc_packs: ucPackages.length,
      packages: ucPackages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}