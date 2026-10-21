import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, refundOrder, completeOrder } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const secret = process.env.LUDOVEX_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';

    const ts = request.headers.get('X-Ludovex-Timestamp');
    const sig = request.headers.get('X-Ludovex-Signature');
    const deliveryId = request.headers.get('X-Ludovex-Delivery-Id');

    const rawText = await request.text();

    console.log('📥 Входящий вебхук:', { ts, sig, deliveryId, rawText });

    let eventObj;
    try {
      eventObj = JSON.parse(rawText);
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    if (!eventObj || typeof eventObj.event !== 'string') {
      return new NextResponse(null, { status: 400 });
    }

    // 1. ТЕСТОВОЕ СОБЫТИЕ (или запрос от формы при сохранении)
    // Возвращаем 204 сразу, чтобы форма Ludovex успешно сохранилась!
    if (eventObj.event === 'test' || !deliveryId) {
      console.log('✅ Тестовый пинг успешно принят');
      return new NextResponse(null, { status: 204 });
    }

    // 2. ПРОВЕРКА ПОДПИСИ ДЛЯ БОЕВЫХ СОБЫТИЙ (если задан секрет)
    if (secret && ts && sig) {
      const rawBuffer = Buffer.from(rawText, 'utf-8');
      const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(ts + '.')
        .update(rawBuffer)
        .digest();

      const receivedHmac = Buffer.from(sig.slice(7), 'hex');

      if (
        expectedHmac.length !== receivedHmac.length ||
        !crypto.timingSafeEqual(expectedHmac, receivedHmac)
      ) {
        console.warn('⚠️ Неверная подпись HMAC для боевого события');
        return new NextResponse(null, { status: 401 });
      }
    }

    // 3. Идемпотентность через Supabase для реальных доставок
    if (!/^[1-9]\d{0,19}$/.test(deliveryId)) {
      return new NextResponse(null, { status: 400 });
    }

    const { data: existingDelivery } = await supabase
      .from('webhook_deliveries')
      .select('delivery_id')
      .eq('delivery_id', deliveryId)
      .maybeSingle();

    if (existingDelivery) {
      return new NextResponse(null, { status: 204 });
    }

    const { error: insertError } = await supabase
      .from('webhook_deliveries')
      .insert({ delivery_id: deliveryId, event: eventObj.event });

    if (insertError) {
      if (insertError.code === '23505') {
        return new NextResponse(null, { status: 204 });
      }
      return new NextResponse(null, { status: 503 });
    }

    // 4. Бизнес-логика заказов
    const data = eventObj.data || {};
    const idempotencyKey = data.idempotency_key || data.merchant_order_id;
    let orderId: number | null = null;

    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.startsWith('order-')) {
      orderId = Number(idempotencyKey.replace('order-', ''));
    } else if (data.order_id || data.id) {
      orderId = Number(data.order_id || data.id);
    }

    if (orderId && !isNaN(orderId)) {
      if (eventObj.event === 'order.completed' || data.status === 'completed') {
        await completeOrder(orderId);
      } else if (
        eventObj.event === 'order.failed' ||
        eventObj.event === 'order.refunded' ||
        data.status === 'failed' ||
        data.status === 'canceled' ||
        data.status === 'refunded'
      ) {
        try {
          await refundOrder(orderId);
        } catch (err) {
          console.error(`Ошибка возврата за заказ #${orderId}:`, err);
        }
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Критическая ошибка webhook:', error);
    return new NextResponse(null, { status: 500 });
  }
}