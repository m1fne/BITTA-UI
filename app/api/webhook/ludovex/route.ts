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

// Убираем случайные пробелы, переносы строк и кавычки вокруг секрета из переменной окружения
function normalizeSecret(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

// Проверка по правилам Ludovex: sha256=HMAC_SHA256(secret, timestamp + "." + точные байты тела),
// метка времени должна быть свежей (не старше 5 минут).
function verifySignature(
  secret: string,
  ts: string | null,
  rawBody: Buffer,
  sigHeader: string | null
): boolean {
  if (!secret || !ts || !sigHeader) return false;
  if (!/^\d{10}$/.test(ts)) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  if (!/^sha256=[a-f0-9]{64}$/.test(sigHeader)) return false;

  const expected = crypto.createHmac('sha256', secret).update(ts + '.').update(rawBody).digest();
  const received = Buffer.from(sigHeader.slice(7), 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

// Находим НАШ заказ. Ludovex в вебхуке присылает свой order_id (без нашего ключа),
// поэтому при покупке мы сохраняем его в orders.provider_order_id.
async function findOurOrderId(data: any): Promise<string | null> {
  // 1) если Ludovex когда-нибудь пришлёт наш ключ идемпотентности ("order-<uuid>")
  const key = data.idempotency_key || data.merchant_order_id;
  const m = typeof key === 'string' ? key.match(/^order-([0-9a-fA-F-]{36})$/) : null;
  if (m) return m[1];

  // 2) по ID заказа Ludovex, сохранённому при покупке
  const providerId = data.order_id ?? data.id;
  if (providerId === undefined || providerId === null || !/^\d+$/.test(String(providerId))) return null;

  const { data: row, error } = await supabase
    .from('orders')
    .select('id')
    .eq('provider_order_id', String(providerId))
    .maybeSingle();

  if (error) throw error;
  return row?.id ? String(row.id) : null;
}

export async function POST(request: Request) {
  let claimedDeliveryId: string | null = null;

  try {
    const secret = normalizeSecret(process.env.LUDOVEX_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '');

    const ts = request.headers.get('X-Ludovex-Timestamp');
    const sig = request.headers.get('X-Ludovex-Signature');
    const deliveryId = request.headers.get('X-Ludovex-Delivery-Id');

    // Читаем ТОЧНЫЕ байты тела (подпись считается именно по ним)
    const rawBody = Buffer.from(await request.arrayBuffer());
    if (rawBody.length === 0 || rawBody.length > 1_000_000) {
      return new NextResponse(null, { status: 400 });
    }

    // 1. ПОДПИСЬ: проверяем первой, для всех событий, включая тестовое.
    // Содержимое доставки в логи не пишем (требование Ludovex).
    if (!verifySignature(secret, ts, rawBody, sig)) {
      console.warn('⚠️ Неверная, просроченная или отсутствующая подпись вебхука', {
        secretSet: !!secret,
        secretLength: secret.length,
        tsPresent: !!ts,
        sigPrefix: sig ? sig.slice(0, 14) : null,
      });
      return new NextResponse(null, { status: 401 });
    }

    // 2. Тело: { event, data }
    let eventObj: any;
    try {
      eventObj = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return new NextResponse(null, { status: 400 });
    }

    if (
      !eventObj ||
      typeof eventObj.event !== 'string' ||
      !eventObj.data ||
      typeof eventObj.data !== 'object'
    ) {
      return new NextResponse(null, { status: 400 });
    }

    // 3. Подписанное тестовое событие: подтверждаем приём, ничего не меняем
    if (eventObj.event === 'test') {
      console.log('✅ Тестовый пинг принят (подпись верна)');
      return new NextResponse(null, { status: 204 });
    }

    // 4. Delivery-Id обязателен для боевых событий
    if (!deliveryId || !/^[1-9]\d{0,19}$/.test(deliveryId)) {
      return new NextResponse(null, { status: 400 });
    }

    const data = eventObj.data;
    console.log('📥 Вебхук Ludovex:', {
      event: eventObj.event,
      deliveryId,
      ludovexOrderId: data.order_id ?? data.id ?? null,
    });

    // 5. Идемпотентность: "занимаем" доставку. Если уже есть, значит обработана ранее.
    const { error: insertError } = await supabase
      .from('webhook_deliveries')
      .insert({ delivery_id: deliveryId, event: eventObj.event });

    if (insertError) {
      if (insertError.code === '23505') {
        return new NextResponse(null, { status: 204 });
      }
      console.error('Не удалось записать доставку:', insertError.message);
      return new NextResponse(null, { status: 503 });
    }
    claimedDeliveryId = deliveryId;

    // 6. Бизнес-логика
    if (eventObj.event === 'balance.low') {
      await notifyAdmin('⚠️ Баланс Ludovex заканчивается! Пополните его, иначе покупки будут падать.');
      return new NextResponse(null, { status: 204 });
    }

    if (
      eventObj.event === 'order.completed' ||
      eventObj.event === 'order.failed' ||
      eventObj.event === 'order.refunded'
    ) {
      const orderId = await findOurOrderId(data);

      if (!orderId) {
        // Возможно, вебхук пришёл раньше, чем мы успели сохранить ID заказа Ludovex.
        // Бросаем ошибку: отметка доставки снимется, Ludovex повторит отправку чуть позже.
        console.error('Наш заказ для вебхука не найден (пока):', {
          event: eventObj.event,
          ludovexOrderId: data.order_id ?? data.id ?? null,
        });
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

    // payment.succeeded и прочие события: просто подтверждаем приём
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ Ошибка обработки webhook:', error instanceof Error ? error.message : 'unknown');

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