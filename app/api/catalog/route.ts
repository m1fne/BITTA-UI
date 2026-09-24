import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PAYERPIN_API_KEY || '';
  const headers = { 'X-API-Key': apiKey };

  try {
    const res = await fetch('https://api.payerpin.uz/api/v2/catalog', {
      headers,
      cache: 'no-store',
    });
    const json = await res.json();

    if (!json.ok || !Array.isArray(json.data)) {
      return new Response(`<h1>Ошибка Payerpin API: ${JSON.stringify(json)}</h1>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Собираем нужные ключи игр и сервисов
    const targetKeys: string[] = ['pubg', 'freefire'];
    
    json.data.forEach((item: any) => {
      const k = item.game_key?.toLowerCase() || '';
      const n = item.name?.toLowerCase() || '';
      if (k.includes('mlbb') || k.includes('telegram') || n.includes('telegram') || n.includes('mobile legends')) {
        if (!targetKeys.includes(item.game_key)) {
          targetKeys.push(item.game_key);
        }
      }
    });

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Каталог Payerpin</title>
        <style>
          body { font-family: -apple-system, sans-serif; background: #121212; color: #fff; padding: 15px; margin: 0; }
          .card { background: #1e1e1e; border: 1px solid #333; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
          h2 { color: #3b82f6; margin-top: 0; font-size: 20px; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { background: #2a2a2a; padding: 10px 12px; margin-bottom: 8px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
          .id-badge { background: #f59e0b; color: #000; font-weight: bold; padding: 4px 8px; border-radius: 6px; font-size: 14px; }
          .price { color: #10b981; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1 style="font-size: 22px; text-align: center;">Список ID товаров Payerpin</h1>
    `;

    for (const key of targetKeys) {
      try {
        const detailRes = await fetch(`https://api.payerpin.uz/api/v2/catalog/${key}`, {
          headers,
          cache: 'no-store',
        });
        const detailJson = await detailRes.json();
        const gameData = detailJson.data || {};
        const name = gameData.name || key;
        const variations = gameData.variations || [];

        html += `
          <div class="card">
            <h2>${name} <br><small style="font-size: 12px; color: #888;">game_key: ${key}</small></h2>
            <ul>
        `;

        if (Array.isArray(variations) && variations.length > 0) {
          variations.forEach((v: any) => {
            const id = v.id ?? v.variation_id ?? v.key;
            const title = v.name ?? v.title ?? 'Пакет';
            const price = v.price ? `${v.price} USDT` : '';
            html += `
              <li>
                <div>
                  <div style="font-weight: 500;">${title}</div>
                  <div class="price">${price}</div>
                </div>
                <span class="id-badge">ID: ${id}</span>
              </li>
            `;
          });
        } else {
          html += `<li style="color: #ef4444;">Нет доступных вариантов</li>`;
        }

        html += `</ul></div>`;
      } catch (err: any) {
        html += `<div class="card"><h2 style="color:red">${key}</h2><p>${err.message}</p></div>`;
      }
    }

    html += `</body></html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    return new Response(`<h1>Ошибка: ${error.message}</h1>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}