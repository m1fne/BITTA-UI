import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, refundOrder, completeOrder } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const secret = process.env.LUDOVEX_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';
    if (!secret) {
      console.error('❌ WEBHOOK_SECRET не задан в переменных окружения');
      return new NextResponse(null, { status: 500 });
    }

    // 1. Извлекаем заголовки
    const ts = request.headers.get('X-Ludovex-Timestamp');
    const sig = request.headers.get('X-Ludovex-Signature');
    const deliveryId = request.headers.get('X-Ludovex-Delivery-Id');

    // 2. Читаем исходные байты (raw body) для точного подсчета HMAC
    const rawText = await request.text();
    const rawBuffer = Buffer.from(rawText, 'utf-8');

    // 3. Проверка timestamp (отклоняем устаревшие или неверные метки времени > 300 секунд)
    if (
      !ts ||
      !/^\d{10}$/.test(ts) ||
      Math.abs(Date.now() / 1000 - Number(ts)) > 300
    ) {
      console.warn('⚠️ Webhook отклонен: неверный или устаревший timestamp');
      return new NextResponse(null, { status: 401 });
    }

    // 4. Проверка формата подписи (sha256=...)
    if (!sig || !/^sha256=[a-f0-9]{64}$/.test(sig)) {
      console.warn('⚠️ Webhook отклонен: неверный формат подписи');
      return new NextResponse(null, { status: 401 });
    }

    // 5. Проверка HMAC-SHA256 за постоянное время (timingSafeEqual)
    // Формула из доки: timestamp + "." + rawBody
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
      console.warn('⚠️ Webhook отклонен: несовпадение подписи HMAC');
      return new NextResponse(null, { status: 401 });
    }

    // 6. Парсинг JSON
    let eventObj;
    try {
      eventObj = JSON.parse(rawText);
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    if (!eventObj || typeof eventObj.event !== 'string' || !eventObj.data || typeof eventObj.data !== 'object') {
      return new NextResponse(null, { status: 400 });
    }

    const eventName = eventObj.event;
    const data = eventObj.data;

    // 7. Обработка тестового события (не содержит delivery-ID или event === 'test')
    if (eventName === 'test' || !deliveryId) {
      console.log('✅ Получено тестовое событие Ludovex. Подпись верна.');
      return new NextResponse(null, { status: 204 });
    }

    // Проверка формата Delivery-Id
    if (!/^[1-9]\d{0,19}$/.test(deliveryId)) {
      return new NextResponse(null, { status: 400 });
    }

    // 8. Идемпотентность и защита через общую таблицу Supabase (вместо локального SQLite)
    // Перед выполнением бизнес-логики проверяем, не обрабатывали ли мы этот delivery_id ранее
    const { data: existingDelivery } = await supabase
      .from('webhook_deliveries')
      .select('delivery_id')
      .eq('delivery_id', deliveryId)
      .maybeSingle();

    if (existingDelivery) {
      // Событие уже было обработано — возвращаем 204 для идемпотентности
      return new NextResponse(null, { status: 204 });
    }

    // Фиксируем delivery_id в базе данных ДО выполнения бизнес-логики
    const { error: insertError } = await supabase
      .from('webhook_deliveries')
      .insert({ delivery_id: deliveryId, event: eventName });

    if (insertError) {
      // Если сработал уникальный индекс (дублирующий запрос прилетел одновременно)
      if (insertError.code === '23505') {
        return new NextResponse(null, { status: 204 });
      }
      console.error('❌ Ошибка сохранения delivery_id в базу:', insertError);
      return new NextResponse(null, { status: 503 });
    }

    // 9. Бизнес-логика обработки событий
    const idempotencyKey = data.idempotency_key || data.merchant_order_id;
    let orderId: number | null = null;

    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.startsWith('order-')) {
      orderId = Number(idempotencyKey.replace('order-', ''));
    } else if (data.order_id || data.id) {
      orderId = Number(data.order_id || data.id);
    }

    if (orderId && !isNaN(orderId)) {
      if (eventName === 'order.completed' || data.status === 'completed') {
        console.log(`✅ Заказ #${orderId} успешно выполнен в Ludovex`);
        await completeOrder(orderId);
      } else if (
        eventName === 'order.failed' ||
        eventName === 'order.refunded' ||
        data.status === 'failed' ||
        data.status === 'canceled' ||
        data.status === 'refunded'
      ) {
        console.log(`❌ Заказ #${orderId} отменён/возвращен в Ludovex. Возврат средств...`);
        try {
          await refundOrder(orderId);
        } catch (refundErr) {
          console.error(`Ошибка возврата средств за заказ #${orderId}:`, refundErr);
        }
      }
    }

    if (eventName === 'payment.succeeded') {
      console.log('💳 Подтверждено пополнение баланса:', data);
      // Здесь можно добавить логику пополнения баланса, если требуется
    }

    // Возвращаем 204 No Content по стандарту Ludovex
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Критическая ошибка в Webhook Ludovex:', error);
    return new NextResponse(null, { status: 500 });
  }
}