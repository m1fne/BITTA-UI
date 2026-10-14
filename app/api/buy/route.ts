import { NextResponse } from 'next/server';
import { purchaseWithBalance, refundOrder, completeOrder } from '@/lib/db';
import { debugVerifyTelegramInitData } from '@/lib/telegram-auth';

type PayerpinParams = { game_key: string; variation_id: string };

// Определяем товар. Если товар не распознан, возвращаем null (запрос будет отклонён).
function getPayerpinParams(
  serviceRaw: unknown,
  productNameRaw: unknown,
  packageIdRaw: unknown
): PayerpinParams | null {
  const service = String(serviceRaw || '').toLowerCase().trim();
  const product = String(productNameRaw || packageIdRaw || '').toLowerCase().trim();

  if (service.includes('pubg')) {
    let variation_id: string | null = null;
    if (product.includes('8100')) variation_id = 'fzr_topup__pubg_mobile_auto__8100_uc';
    else if (product.includes('3850')) variation_id = 'fzr_topup__pubg_mobile_auto__3850_uc';
    else if (product.includes('1800')) variation_id = 'fzr_topup__pubg_mobile_auto__1800_uc';
    else if (product.includes('660')) variation_id = 'fzr_topup__pubg_mobile_auto__660_uc';
    else if (product.includes('325')) variation_id = 'fzr_topup__pubg_mobile_auto__325_uc';
    else if (product.includes('60')) variation_id = 'fzr_topup__pubg_mobile_auto__60_uc';

    // --- PRIME ---
    else if (product.includes('prime') && product.includes('12')) variation_id = 'fzr_topup__pubg_mobile_auto__prime_12_months';
    else if (product.includes('prime') && product.includes('6')) variation_id = 'fzr_topup__pubg_mobile_auto__prime_6_months';
    else if (product.includes('prime') && product.includes('3')) variation_id = 'fzr_topup__pubg_mobile_auto__prime_3_months';
    else if (product.includes('prime')) variation_id = 'fzr_topup__pubg_mobile_auto__prime_1_month';

    // --- СПЕЦИАЛЬНЫЕ ПАКИ И ЭМБЛЕМЫ ---
    else if (product.includes('first purchase')) variation_id = 'fzr_topup__pubg_mobile_auto__first_purchase_pack';
    else if (product.includes('weekly deal') && product.includes('1')) variation_id = 'fzr_topup__pubg_mobile_auto__weekly_deal_pack_1';
    else if (product.includes('weekly deal') && product.includes('2')) variation_id = 'fzr_topup__pubg_mobile_auto__weekly_deal_pack_2';
    else if (product.includes('mythic emblem') && product.includes('weekly')) variation_id = 'fzr_topup__pubg_mobile_auto__weekly_mythic_emblem_value_pack';
    else if (product.includes('mythic emblem')) variation_id = 'fzr_topup__pubg_mobile_auto__mythic_emblem_pack';
    else if (product.includes('firearm')) variation_id = 'fzr_topup__pubg_mobile_auto__upgradable_firearm_materials_pack';

    return variation_id ? { game_key: 'pubg', variation_id } : null;
  }

  if (service.includes('free') || service.includes('ff')) {
    let variation_id: string | null = null;
    if (product.includes('6160')) variation_id = 'fzr_topup__free_fire_cis__6160_diamonds';
    else if (product.includes('2398')) variation_id = 'fzr_topup__free_fire_cis__2398_diamonds';
    else if (product.includes('1166')) variation_id = 'fzr_topup__free_fire_cis__1166_diamonds';
    else if (product.includes('572')) variation_id = 'fzr_topup__free_fire_cis__572_diamonds';
    else if (product.includes('341')) variation_id = 'fzr_topup__free_fire_cis__341_diamonds';
    else if (product.includes('110')) variation_id = 'fzr_topup__free_fire_cis__110_diamonds';
    else if (product.includes('weekly') || product.includes('haftalik')) variation_id = 'fzr_topup__free_fire_cis__weekly_membership';
    else if (product.includes('monthly') || product.includes('oylik')) variation_id = 'fzr_topup__free_fire_cis__monthly_membership';

    return variation_id ? { game_key: 'free-fire', variation_id } : null;
  }

  if (service.includes('mlbb') || service.includes('legend')) {
    let variation_id: string | null = null;
    if (product.includes('3688')) variation_id = 'fzr_topup__mobile_legends_global__3688_diamonds';
    else if (product.includes('1084')) variation_id = 'fzr_topup__mobile_legends_global__1084_diamonds';
    else if (product.includes('706')) variation_id = 'fzr_topup__mobile_legends_global__706_diamonds';
    else if (product.includes('284')) variation_id = 'fzr_topup__mobile_legends_global__284_diamonds';
    else if (product.includes('170')) variation_id = 'fzr_topup__mobile_legends_global__170_diamonds';
    else if (product.includes('42')) variation_id = 'fzr_topup__mobile_legends_global__42_diamonds';
    else if (product.includes('14')) variation_id = 'fzr_topup__mobile_legends_global__14_diamonds';
    else if (product.includes('weekly') || product.includes('pass')) variation_id = 'fzr_topup__mobile_legends_global__weekly_pass';

    return variation_id ? { game_key: 'mlbb', variation_id } : null;
  }

  if (service.includes('tg') || service.includes('telegram')) {
    let variation_id: string | null = null;
    if (product.includes('12')) variation_id = 'premium_12';
    else if (product.includes('6')) variation_id = 'premium_6';
    else if (product.includes('3')) variation_id = 'premium_3';

    return variation_id ? { game_key: 'telegram-premium', variation_id } : null;
  }

  return null;
}

// 🛡️ Строгий серверный справочник цен (клиент не может их подделать)
const SERVER_PRICES: Record<string, number> = {
  'fzr_topup__pubg_mobile_auto__60_uc': 13000,
  'fzr_topup__pubg_mobile_auto__325_uc': 58000,
  'fzr_topup__pubg_mobile_auto__660_uc': 115000,
  'fzr_topup__pubg_mobile_auto__1800_uc': 285000,
  'fzr_topup__pubg_mobile_auto__3850_uc': 560000,
  'fzr_topup__pubg_mobile_auto__8100_uc': 1130000,
  'fzr_topup__pubg_mobile_auto__prime_1_month': 14000,
  'fzr_topup__pubg_mobile_auto__prime_3_months': 36000,
  'fzr_topup__pubg_mobile_auto__prime_6_months': 70000,
  'fzr_topup__pubg_mobile_auto__prime_12_months': 135000,
  'fzr_topup__pubg_mobile_auto__first_purchase_pack': 15000,
  'fzr_topup__pubg_mobile_auto__weekly_deal_pack_1': 15000,
  'fzr_topup__pubg_mobile_auto__weekly_deal_pack_2': 36000,
  'fzr_topup__pubg_mobile_auto__weekly_mythic_emblem_value_pack': 36000,
  'fzr_topup__pubg_mobile_auto__mythic_emblem_pack': 60000,
  'fzr_topup__pubg_mobile_auto__upgradable_firearm_materials_pack': 36000,

  'fzr_topup__free_fire_cis__110_diamonds': 12000,
  'fzr_topup__free_fire_cis__341_diamonds': 32000,
  'fzr_topup__free_fire_cis__572_diamonds': 53000,
  'fzr_topup__free_fire_cis__1166_diamonds': 101000,
  'fzr_topup__free_fire_cis__2398_diamonds': 199000,
  'fzr_topup__free_fire_cis__6160_diamonds': 495000,

  'fzr_topup__mobile_legends_global__14_diamonds': 5000,
  'fzr_topup__mobile_legends_global__42_diamonds': 11000,
  'fzr_topup__mobile_legends_global__170_diamonds': 38000,
  'fzr_topup__mobile_legends_global__284_diamonds': 62000,
  'fzr_topup__mobile_legends_global__706_diamonds': 115000,
  'fzr_topup__mobile_legends_global__1084_diamonds': 220000,
  'fzr_topup__mobile_legends_global__3688_diamonds': 590000,

  'premium_3': 160000,
  'premium_6': 220000,
  'premium_12': 390000,
};

function getServerPrice(variationId: string): number | null {
  if (!Object.prototype.hasOwnProperty.call(SERVER_PRICES, variationId)) return null;
  const price = SERVER_PRICES[variationId];
  return typeof price === 'number' && price > 0 ? price : null;
}

// Уведомление админа в Telegram (если что-то требует ручной проверки)
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

// Запрос в Payerpin. Возвращает null, если ответа вообще не было (сеть/таймаут).
async function callPayerpin(payload: Record<string, any>, idempotencyKey: string) {
  try {
    const response = await fetch('https://api.payerpin.uz/api/v2/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PAYERPIN_API_KEY || '',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    return { httpOk: response.ok, status: response.status, data };
  } catch (err) {
    console.error('❌ Payerpin недоступен:', err);
    return null;
  }
}

export async function POST(request: Request) {
  // Объявляем снаружи, чтобы знать про заказ, даже если что-то упадёт позже
  let createdOrder: any = null;

  try {
    const body = await request.json();

    // 1. Проверка подлинности Telegram initData
    const { initData } = body;
    const authResult = debugVerifyTelegramInitData(initData);

    if (!authResult.user) {
      console.warn('Авторизация не прошла:', authResult.reason);
      return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 401 });
    }

    const telegramId = Number(authResult.user.id);

    if (!telegramId || isNaN(telegramId)) {
      return NextResponse.json(
        { error: 'Telegram ID topilmadi. Iltimos, ilovani Telegram орқали қайта очинг.' },
        { status: 401 }
      );
    }

    // 2. Player ID: проверка формата и длины
    const playerIdRaw = body.targetId || body.playerId || body.player_id || body.username;
    const playerId = String(playerIdRaw || '').trim();

    if (!playerId) {
      return NextResponse.json({ error: 'Укажите Player ID' }, { status: 400 });
    }

    if (!/^[A-Za-z0-9_@().\-\s]{1,64}$/.test(playerId)) {
      return NextResponse.json({ error: "Player ID noto'g'ri formatda" }, { status: 400 });
    }

    const service = String(body.service || '').slice(0, 100);
    const productName = String(body.productName || '').slice(0, 100);
    const packageId = body.packageId || body.package_id || body.variation_id || body.id;

    // 3. Определяем товар и цену НА СЕРВЕРЕ
    const params = getPayerpinParams(service, productName, packageId);
    if (!params) {
      return NextResponse.json({ error: 'Bunday mahsulot topilmadi' }, { status: 400 });
    }

    const { game_key, variation_id } = params;
    const price = getServerPrice(variation_id);

    if (!price) {
      return NextResponse.json({ error: "Bunday mahsulot topilmadi yoki narxi noto'g'ri" }, { status: 400 });
    }

    // 4. АТОМАРНОЕ СПИСАНИЕ И СОЗДАНИЕ ЗАКАЗА В SUPABASE
    try {
      createdOrder = await purchaseWithBalance(telegramId, service, productName, playerId, price);
    } catch (dbErr: any) {
      const msg = dbErr?.message || '';
      if (
        msg.includes('INSUFFICIENT') ||
        msg.includes('недостаточно') ||
        msg.includes('yetarli emas')
      ) {
        return NextResponse.json({ error: 'Balansingiz yetarli emas.' }, { status: 400 });
      }
      console.error('Ошибка списания:', msg);
      return NextResponse.json({ error: 'Xatolik yuz berdi. Qayta urinib ko‘ring.' }, { status: 400 });
    }

    // 5. АВТО-ПАРСИНГ ZONE_ID ИЗ PLAYER_ID (если игрок ввёл всё в одно поле)
    let finalPlayerId = playerId;
    let finalServerId = body.serverId || body.server_id || body.zoneId || body.zone_id;

    if (!finalServerId && playerId.includes('(')) {
      const match = playerId.match(/(\d+)[\s\(_-]+(\d+)\)?/);
      if (match) {
        finalPlayerId = match[1];
        finalServerId = match[2];
      }
    }

    const payerpinPayload: Record<string, any> = {
      game_key,
      variation_id,
      player_id: finalPlayerId,
    };

    if (finalServerId) {
      payerpinPayload.server_id = String(finalServerId).trim();
      payerpinPayload.zone_id = String(finalServerId).trim();
    }

    // Ключ идемпотентности = ID заказа: повторный запрос не создаст второй заказ у Payerpin
    const idempotencyKey = `order-${createdOrder.id}`;

    console.log('🚀 ОТПРАВЛЯЕМ В PAYERPIN API:', JSON.stringify(payerpinPayload));

    const result = await callPayerpin(payerpinPayload, idempotencyKey);

    // 6. НЕИЗВЕСТНЫЙ РЕЗУЛЬТАТ: нет ответа, ошибка сервера Payerpin или ответ не JSON.
    // Заказ мог пройти, поэтому деньги автоматически НЕ возвращаем: нужна ручная проверка.
    if (!result || !result.data || result.status >= 500) {
      console.error('⚠️ Неизвестный результат Payerpin для заказа', createdOrder.id, result?.status);
      await notifyAdmin(
        `⚠️ Заказ требует проверки!\nЗаказ: ${createdOrder.order_no ?? createdOrder.id}\nID заказа: ${createdOrder.id}\nПользователь: ${telegramId}\nТовар: ${variation_id}\nСумма: ${price}\nPayerpin не дал внятного ответа (статус: ${result?.status ?? 'нет ответа'}). Статус заказа оставлен processing, деньги не возвращены.`
      );
      return NextResponse.json(
        { error: "Buyurtma holati tekshirilmoqda. Pulingiz yo'qolmaydi, admin tez orada hal qiladi." },
        { status: 502 }
      );
    }

    const { data } = result;

    // 7. ЧЁТКИЙ ОТКАЗ PAYERPIN: возврат средств
    if (!result.httpOk || data.ok === false) {
      let refunded = false;
      try {
        refunded = await refundOrder(createdOrder.id);
      } catch (refundErr) {
        console.error('❌ Не удалось вернуть деньги за заказ', createdOrder.id, refundErr);
        await notifyAdmin(
          `❌ Не удалось автоматически вернуть деньги!\nID заказа: ${createdOrder.id}\nПользователь: ${telegramId}\nСумма: ${price}`
        );
      }

      const errMsg = String(data.error?.message || data.message || 'Xatolik').slice(0, 150);
      console.error('Payerpin отказал:', JSON.stringify(data).slice(0, 500));

      return NextResponse.json(
        { error: `Ошибка Payerpin: ${errMsg}.${refunded ? ' Pulingiz qaytarildi.' : ''}` },
        { status: result.status || 400 }
      );
    }

    // 8. УСПЕХ
    await completeOrder(createdOrder.id);

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Ошибка в POST /api/buy:', error);

    // Если упали уже после списания, сообщаем админу: заказ нужно проверить вручную
    if (createdOrder?.id) {
      await notifyAdmin(
        `⚠️ Сбой после списания!\nID заказа: ${createdOrder.id}\nПользователь: ${createdOrder.user_id}\nСумма: ${createdOrder.price}\nПроверьте заказ вручную.`
      );
    }

    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}