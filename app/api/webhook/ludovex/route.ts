import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, refundOrder, completeOrder } from '@/lib/db';

// Проверка секретной подписи от Ludovex (безопасность)
function verifyLudovexSignature(payload: string, signature: string | null, secret: string) {
  if (!signature || !secret) return true; // Если секрет не задан в .env, пропускаем проверку

  try {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch (err) {
    console.error('Ошибка проверки подписи Webhook:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-ludovex-signature') || request.headers.get('x-signature');
    const secret = process.env.LUDOVEX_WEBHOOK_SECRET || '';

    // 1. Проверяем подпись (если задан секрет)
    if (secret && !verifyLudovexSignature(rawBody, signature, secret)) {
      console.warn('⚠️ Webhook отклонён: неверная подпись');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('📥 Получен Webhook от Ludovex:', JSON.stringify(body));

    // Ludovex присылает событие (event) и данные (data)
    const event = body.event || body.type;
    const data = body.data || body;

    // В качестве idempotency_key или external_id мы передавали "order-{createdOrder.id}"
    const idempotencyKey = data.idempotency_key || data.merchant_order_id;
    let orderId: number | string | null = null;

    if (idempotencyKey && typeof idempotencyKey === 'string' && idempotencyKey.startsWith('order-')) {
      orderId = idempotencyKey.replace('order-', '');
    } else if (data.order_id || data.id) {
      orderId = data.order_id || data.id;
    }

    if (!orderId) {
      console.warn('⚠️ Webhook получен, но ID заказа не найден');
      return NextResponse.json({ success: true, message: 'No order ID found' }, { status: 200 });
    }

    // 2. Обработка успешного выполнения заказа
    if (event === 'order.completed' || data.status === 'completed' || data.status === 'success') {
      console.log(`✅ Заказ #${orderId} успешно выполнен в Ludovex`);
      await completeOrder(Number(orderId));
    }

    // 3. Обработка отмены/ошибки (возврат средств пользователю)
    if (
      event === 'order.failed' ||
      event === 'order.refunded' ||
      data.status === 'failed' ||
      data.status === 'canceled' ||
      data.status === 'refunded'
    ) {
      console.log(`❌ Заказ #${orderId} отменён в Ludovex. Возвращаем средства...`);
      try {
        await refundOrder(Number(orderId));
      } catch (refundErr) {
        console.error(`Ошибка возврата средств за заказ #${orderId}:`, refundErr);
      }
    }

    // Обязательно отвечать 200 OK, чтобы Ludovex понял, что событие обработано
    return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Ошибка в Webhook Ludovex:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}