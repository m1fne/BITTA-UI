import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Получаем ключ игры (pubg, freefire, mlbb и т.д.) прямо с фронтенда
    const { gameKey, playerId, variationId, zoneId, orderId } = await request.json();

    if (!gameKey || !playerId || !variationId) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      );
    }

    const idempotencyKey = orderId || `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Собираем тело запроса в Payerpin
    const payload: Record<string, any> = {
      game_key: gameKey,
      variation_id: variationId,
      player_id: String(playerId),
      idempotency_key: idempotencyKey,
    };

    // Для Mobile Legends передаем zone_id, если он указан
    if (zoneId) {
      payload.zone_id = String(zoneId);
    }

    const response = await fetch('https://api.payerpin.uz/api/v2/order', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.PAYERPIN_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return NextResponse.json(
        { error: 'Ошибка при выполнении заказа', details: data },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}