import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, refundOrder, completeOrder } from '@/lib/db';

export const runtime = 'nodejs';

// Уведомление админа в Telegram
async function notifyAdmin(text: string) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    const chatId = process.env.ADMIN_TELEGRAM_IDS?.split(',')[0]?.trim();
    if (!token || !chatId) return;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error('Не удалось уведомить админа:', err);
  }
}

// Проверка подписи Ludovex: HMAC-SHA256 от "<timestamp>.<тело>"
function verifySignature(
  secret: string,
  ts: string | null,
  rawText: string,
  sigHeader: string | null
): boolean {
  if (!secret || !ts || !sigHeader) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${rawText}`)
    .digest('hex');

  const received = sigHeader.replace(/^sha256=/, '');
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let claimedDeliveryId: string | null = null;

  try {
    const secret = process.env.LUDOVEX_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';

    const ts = request.headers.get('X-Ludovex-Timestamp');
    const sig = request.headers.get('X-Ludovex-Signature');
    const deliveryId = request.headers.get('X-Ludovex-Delivery-Id');

    const rawText = await request.text();

    console.log('📥 Входящий вебхук:', { ts, deliveryId, hasSig: !!sig, rawText: rawText.slice(0, 1500) });

    let eventObj: any;
    try {
      eventObj = JSON.parse(rawText);
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    if (!eventObj || typeof eventObj.event !== 'string') {
      return new NextResponse(null, { status: 400 });
    }

    // 1. Тестовый пинг (кнопка "Отправить тест" / сохранение формы): ничего не меняет, просто 204
    if (eventObj.event === 'test' || !deliveryId) {
      console.log('✅ Тестовый пинг принят');
      return new NextResponse(null, { status: 204 });
    }

    // 2. ПОДПИСЬ ОБЯЗАТЕЛЬНА для всех боевых событий.
    // Если секрета нет или подпись не совпала, событие отклоняется (раньше проверка пропускалась).
    if (!verifySignature(secret, ts, rawText, sig)) {
      console.warn('⚠️ Неверная или отсутствующая подпись вебхука');
      return new NextResponse(null, { status: 401 });
    }

    // 3. Формат Delivery-Id
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(deliveryId)) {
      return new NextResponse(null, { status: 400 });
    }

    // 4. Идемпотентность: "занимаем" доставку. Если уже есть, значит обработана ранее.
    const { error: insertError } = await supabase
      .from('webhook_deliveries')
      .insert({ delivery_id: deliveryId, event: eventObj.event });

    if (insertError) {
      if (insertError.code === '23505') {
        return new NextResponse(null, { status: 204 });
      }
      console.error('Не удалось записать доставку:', insertError);
      return new NextResponse(null, { status: 503 });
    }
    claimedDeliveryId = deliveryId;

    // 5. Бизнес-логика
    const data = eventObj.data || {};

    if (eventObj.event === 'balance.low') {
      await notifyAdmin(`⚠️ Баланс Ludovex заканчивается!\n${JSON.stringify(data).slice(0, 500)}`);
      return new NextResponse(null, { status: 204 });
    }

    if (eventObj.event === 'order.completed' || eventObj.event === 'order.failed' || eventObj.event === 'order.refunded') {
      // Наш заказ определяем ТОЛЬКО по нашему ключу идемпотентности "order-<id>".
      // ID заказа самого Ludovex с нашим не путаем.
      const key = data.idempotency_key || data.merchant_order_id;
      const match = typeof key === 'string' ? key.match(/^order-(\d+)$/) : null;
      const orderId = match ? Number(match[1]) : null;

      if (!orderId || !Number.isSafeInteger(orderId) || orderId <= 0) {
        console.error('Вебхук без нашего order-ключа:', rawText.slice(0, 1000));
        if (eventObj.event !== 'order.completed') {
          await notifyAdmin(
            `⚠️ Вебхук ${eventObj.event} без нашего ключа заказа. Проверьте вручную.\n${rawText.slice(0, 600)}`
          );
        }
        return new NextResponse(null, { status: 204 });
      }

      if (eventObj.event === 'order.completed') {
        await completeOrder(orderId);
      } else {
        const refunded = await refundOrder(orderId);
        await notifyAdmin(
          `ℹ️ Ludovex: ${eventObj.event} по заказу #${orderId}. Возврат ${refunded ? 'выполнен' : 'не потребовался (уже возвращён или заказ не в нужном статусе)'}.`
        );
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error);

    // Не удалось обработать: снимаем отметку о доставке, чтобы повторная отправка от Ludovex
    // обработалась заново, а не была пропущена как "уже обработанная".
    if (claimedDeliveryId) {
      try {
        await supabase.from('webhook_deliveries').delete().eq('delivery_id', claimedDeliveryId);
      } catch (releaseErr) {
        console.error('Не удалось снять отметку доставки:', releaseErr);
      }
    }

    return new NextResponse(null, { status: 500 });
  }
}