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


// Находим НАШ заказ. Ludovex в вебхуке присылает свой order_id (без нашего ключа),
// поэтому при покупке мы сохраняем его в orders.provider_order_id.
async function findOurOrderId(data: any): Promise<number | null> {
  // 1) если Ludovex когда-нибудь пришлёт наш ключ идемпотентности
  const key = data.idempotency_key || data.merchant_order_id;
  const m = typeof key === 'string' ? key.match(/^order-(\d+)$/) : null;
  if (m) return Number(m[1]);

  // 2) по ID заказа Ludovex, сохранённому при покупке
  const providerId = data.order_id ?? data.id;
  if (providerId === undefined || providerId === null || !/^\d+$/.test(String(providerId))) return null;

  const { data: row, error } = await supabase
    .from('orders')
    .select('id')
    .eq('provider_order_id', String(providerId))
    .maybeSingle();

  if (error) throw error;
  return row?.id ?? null;
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
      console.warn('⚠️ Неверная или отсутствующая подпись вебхука', {
        secretSet: !!secret,
        secretLength: secret.length,
        tsPresent: !!ts,
        sigPrefix: sig ? sig.slice(0, 14) : null,
      });
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
      const orderId = await findOurOrderId(data);

      if (!orderId || !Number.isSafeInteger(orderId) || orderId <= 0) {
        // Возможно, вебхук пришёл раньше, чем мы успели сохранить ID заказа Ludovex.
        // Бросаем ошибку: отметка доставки снимется, Ludovex повторит отправку чуть позже.
        console.error('Наш заказ для вебхука не найден (пока):', rawText.slice(0, 800));
        if (eventObj.event !== 'order.completed') {
          await notifyAdmin(
            `⚠️ Вебхук ${eventObj.event}: наш заказ не найден (Ludovex order_id: ${data.order_id ?? data.id ?? '?'}). Проверьте вручную.`
          );
        }
        throw new Error('our order not found for webhook');
      }

      if (eventObj.event === 'order.completed') {
        await completeOrder(orderId);
      } else {
        // Смотрим статус заказа ДО возврата: refund_order срабатывает только для заказа в статусе processing.
        let statusBefore: string | null = null;
        try {
          const { data: orderRow } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .maybeSingle();
          statusBefore = orderRow?.status ?? null;
        } catch {
          statusBefore = null;
        }

        const refunded = await refundOrder(orderId);

        if (refunded) {
          await notifyAdmin(`✅ Ludovex: ${eventObj.event} по заказу #${orderId}. Деньги клиенту возвращены автоматически.`);
        } else if (statusBefore && /refund|cancel|reject/i.test(statusBefore)) {
          console.log(`Заказ #${orderId} уже возвращён ранее, ничего не делаем.`);
        } else {
          await notifyAdmin(
            `🚨 Ludovex: ${eventObj.event} по заказу #${orderId}, но автоматический возврат НЕ выполнен (статус заказа: ${statusBefore ?? 'неизвестен'}). Если клиент не получил товар, верните деньги вручную.`
          );
        }
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