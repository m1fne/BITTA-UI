import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Инициализируем клиент Supabase с правами администратора
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { initData, service, productName, targetId, price, telegramId } = await request.json();

    if (!targetId || !service || !productName || !price) {
      return NextResponse.json({ success: false, error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // Временный или реальный Telegram ID
    const userTgId = telegramId || 12345678; // сюда передаем telegram_id пользователя

    // 1. ПРОВЕРКА БАЛАНСА В SUPABASE
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('telegram_id', userTgId)
      .single();

    if (userError || !user) {
      // Если юзера еще нет в базе, можно вернуть ошибку или создать с 0 балансом
      return NextResponse.json({ success: false, error: 'INSUFFICIENT_BALANCE' }, { status: 400 });
    }

    if (user.balance < price) {
      return NextResponse.json({ success: false, error: 'INSUFFICIENT_BALANCE' }, { status: 400 });
    }

    // 2. СОПОСТАВЛЕНИЕ ПАКЕТОВ С PAYERPIN
    const variationMap: Record<string, string> = {
      '60 UC': 'v1',
      '325 UC': 'v2',
      '660 UC': 'v3',
      '1800 UC': 'v4',
      '3850 UC': 'v5',
      '8100 UC': 'v6',
    };

    const variationId = variationMap[productName] || 'v1';
    const idempotencyKey = `buy_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 3. ОТПРАВКА ЗАКАЗА В PAYERPIN
    const response = await fetch('https://api.payerpin.uz/api/v2/order', {
      method: 'POST',
      headers: {
        'X-API-Key': process.env.PAYERPIN_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        game_key: service,
        variation_id: variationId,
        player_id: String(targetId),
        idempotency_key: idempotencyKey,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      // Сохраняем неудачный заказ в историю
      await supabase.from('orders').insert({
        telegram_id: userTgId,
        player_id: targetId,
        game_key: service,
        product_name: productName,
        price: price,
        status: 'failed',
      });

      return NextResponse.json(
        { success: false, error: 'PROVIDER_ERROR', details: data },
        { status: 400 }
      );
    }

    // 4. ЕСЛИ PAYERPIN ПРИНЯЛ ЗАКАЗ — СПИСЫВАЕМ БАЛАНС И СОХРАНЯЕМ ЧЕК
    const newBalance = user.balance - price;
    await supabase.from('users').update({ balance: newBalance }).eq('telegram_id', userTgId);

    await supabase.from('orders').insert({
      telegram_id: userTgId,
      player_id: targetId,
      game_key: service,
      product_name: productName,
      price: price,
      status: 'success',
    });

    return NextResponse.json({ success: true, newBalance, order: data });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}