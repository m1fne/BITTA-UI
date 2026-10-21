import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { refundOrder, completeOrder } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const secret = process.env.LUDOVEX_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';

    // 1. Получаем заголовки от Ludovex
    const ts = request.headers.get('X-Ludovex-Timestamp') || request.headers.get('x-ludovex-timestamp');
    const sig = request.headers.get('X-Ludovex-Signature') || request.headers.get('x-ludovex-signature');
    const deliveryId = request.headers.get('X-Ludovex-Delivery-Id') || request.headers.get('x-ludovex-delivery-id');

    // Читаем сырое тело запроса (Buffer/text)
    const rawText = await request.text();
    const rawBuffer = Buffer.from(rawText, 'utf-8');

    // 2. Валидация заголовков и штампа времени (не более 300 секунд разницы)
    if (
      !/^\d{10}$/.test(ts ?? '') ||
      Math.abs(Date.now() / 1000 - Number(ts)) > 300 ||
      !/^sha256=[a-f0-9]{64}$/.test(sig ?? '')
    ) {
      console.warn('⚠️ Ludovex Webhook: Неверные заголовки или истёк timestamp');
      return new NextResponse(null, { status: 401 });
    }

    // 3. Проверка HMAC-SHA256 подписи
    if (secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(ts + '.')
        .update(rawBuffer)
        .digest();

      const received = Buffer.from((sig ?? '').slice(7), 'hex');

      if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
        console.warn('⚠️ Ludovex Webhook: Неверная подпись');
        return new NextResponse(null, { status: 401 });
      }
    }

    // 4. Парсинг JSON
    let event: any;
    try {
      event = JSON.parse(rawText);
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    if (!event || typeof event.event !== 'string' || !event.data || typeof event.data !== 'object') {
      return new NextResponse(null, { status: 400 });
    }

    // 5. ТЕСТОВОЕ СОБЫТИЕ LUDOVEX (Возвращаем статус 204 No Content!)
    if (event.event === 'test') {
      console.log('✅ Получен успешный тестовый вебхук от Ludovex');
      return new NextResponse(null, { status: 204 });
    }

    // Проверка Delivery-Id для реальных событий
    if (!/^[1-9]\d{0,19}$/.test(deliveryId ?? '')) {
      return new NextResponse(null, { status: 400 });
    }

    // 6. Обработка боевых событий заказа
    const eventName = event.event;
    const data = event.data;

    const idempotencyKey = data.idempotency_key || data.merchant_order_id;
    let orderId: number | string | null = null;

    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.startsWith('order-')) {
      orderId = idempotencyKey.replace('order-', '');
    } else if (data.order_id || data.id) {
      orderId = data.order_id || data.id;
    }

    if (orderId) {
      // Успешный заказ
      if (eventName === 'order.completed' || data.status === 'completed') {
        console.log(`✅ Заказ #${orderId} успешно выполнен в Ludovex`);
        await completeOrder(Number(orderId));
      }

      // Отмена / возврат
      if (
        eventName === 'order.failed' ||
        eventName === 'order.refunded' ||
        data.status === 'failed' ||
        data.status === 'canceled'
      ) {
        console.log(`❌ Заказ #${orderId} отменён в Ludovex. Возврат средств...`);
        try {
          await refundOrder(Number(orderId));
        } catch (refundErr) {
          console.error(`Ошибка возврата за заказ #${orderId}:`, refundErr);
        }
      }
    }

    // На все боевые события Ludovex ожидает 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Ошибка обработки Webhook Ludovex:', error);
    return new NextResponse(null, { status: 500 });
  }
}