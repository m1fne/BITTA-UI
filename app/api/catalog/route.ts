import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.PAYERPIN_API_KEY || '';
  const headers = { 'X-API-Key': apiKey };

  try {
    const mainRes = await fetch('https://api.payerpin.uz/api/v2/catalog', {
      headers,
      cache: 'no-store',
    });
    const mainJson = await mainRes.json();

    if (!mainJson.ok || !Array.isArray(mainJson.data)) {
      return new Response(`<h1>Ошибка Payerpin API: ${JSON.stringify(mainJson)}</h1>`, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Каталог Payerpin</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #121212; color: #fff; padding: 15px; margin: 0; }
          .card { background: #1e1e1e; border: 1px solid #333; border-radius: 12px; padding: 15px; margin-bottom: 20px; }
          h2 { color: #3b82f6; margin-top: 0; font-size: 18px; word-break: break-all; }
          ul { list-style: none; padding: 0; margin: 0; }
          li { background: #2a2a2a; padding: 10px 12px; margin-bottom: 8px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
          .id-badge { background: #f59e0b; color: #000; font-weight: bold; padding: 4px 8px; border-radius: 6px; font-size: 13px; }
          .price { color: #10b981; font-weight: bold; font-size: 13px; }
          pre { background: #000; padding: 10px; border-radius: 6px; font-size: 11px; overflow-x: auto; max-height: 250px; color: #a7f3d0; white-space: pre-wrap; word-break: break-all; }
        </style>
      </head>
      <body>
        <h1 style="font-size: 20px; text-align: center; margin-bottom: 20px;">Каталог Payerpin</h1>
    `;

    for (const item of mainJson.data) {
      const key = item.game_key;
      const gameName = item.name || key;

      // 1. Ищем массив пакетов прямо в объекте игры
      let vars: any[] = item.variations || item.items || item.products || item.packages || item.offers || [];

      let detailRaw: any = null;

      // 2. Если в основном объекте пусто — запрашиваем детальный эндпоинт
      if (!Array.isArray(vars) || vars.length === 0) {
        try {
          const detailRes = await fetch(`https://api.payerpin.uz/api/v2/catalog/${encodeURIComponent(key)}`, {
            headers,
            cache: 'no-store',
          });
          detailRaw = await detailRes.json();

          if (detailRaw) {
            const dataObj = detailRaw.data ?? detailRaw;
            if (Array.isArray(dataObj)) {
              vars = dataObj;
            } else if (Array.isArray(dataObj.variations)) {
              vars = dataObj.variations;
            } else if (Array.isArray(dataObj.items)) {
              vars = dataObj.items;
            } else if (Array.isArray(dataObj.packages)) {
              vars = dataObj.packages;
            } else if (typeof dataObj === 'object') {
              vars = Object.values(dataObj).filter((v: any) => typeof v === 'object' && v !== null);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      html += `
        <div class="card">
          <h2>${gameName} <br><small style="font-size: 12px; color: #888;">game_key: ${key}</small></h2>
          <ul>
      `;

      if (Array.isArray(vars) && vars.length > 0) {
        vars.forEach((v: any) => {
          if (typeof v === 'object' && v !== null) {
            const id = v.id ?? v.variation_id ?? v.key ?? v.code ?? v.package_id ?? 'N/A';
            const title = v.name ?? v.title ?? v.label ?? v.name_ru ?? v.package_name ?? 'Пакет';
            const price = v.price ? `${v.price} USDT` : (v.amount ? `${v.amount}` : '');
            html += `
              <li>
                <div>
                  <div style="font-weight: 500; font-size: 14px;">${title}</div>
                  <div class="price">${price}</div>
                </div>
                <span class="id-badge">ID: ${id}</span>
              </li>
            `;
          }
        });
      } else {
        html += `
          <li style="color: #ef4444; flex-direction: column; align-items: flex-start;">
            <div style="font-size: 12px; margin-bottom: 5px;">Структура ответа Payerpin:</div>
            <pre>${JSON.stringify(detailRaw || item, null, 2)}</pre>
          </li>
        `;
      }

      html += `</ul></div>`;
    }

    html += `</body></html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error: any) {
    return new Response(`<h1>Ошибка сервера: ${error.message}</h1>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}