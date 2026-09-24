import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PAYERPIN_API_KEY || '';
  const games = ['pubg', 'freefire', 'mlbb'];
  const catalogData: Record<string, any> = {};

  for (const game of games) {
    try {
      const res = await fetch(`https://api.payerpin.uz/api/v2/catalog/${game}`, {
        headers: { 'X-API-Key': apiKey },
        cache: 'no-store',
      });
      const data = await res.json();
      
      if (data.ok && data.data) {
        catalogData[game] = {
          name: data.data.name,
          variations: data.data.variations?.map((v: any) => ({
            id: v.id || v.variation_id || v.key,
            name: v.name || v.title,
            price: v.price,
          })) || data.data.variations,
        };
      } else {
        catalogData[game] = data;
      }
    } catch (err: any) {
      catalogData[game] = { error: err.message };
    }
  }

  return NextResponse.json(catalogData);
}