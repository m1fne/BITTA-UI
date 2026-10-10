import { NextResponse } from 'next/server';
import { purchaseWithBalance, refundOrder, completeOrder } from '@/lib/db';
import { debugVerifyTelegramInitData } from '@/lib/telegram-auth';

function getPayerpinParams(serviceRaw: string, productNameRaw: string, packageIdRaw: string) {
  const service = (serviceRaw || '').toLowerCase().trim();
  const product = (productNameRaw || packageIdRaw || '').toLowerCase().trim();

  if (service.includes('pubg')) {
    let variation_id = 'fzr_topup__pubg_mobile_auto__60_uc';
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

    return { game_key: 'pubg', variation_id };
  }
  

  if (service.includes('free') || service.includes('ff')) {
    let variation_id = 'fzr_topup__free_fire_cis__110_diamonds';
    if (product.includes('6160')) variation_id = 'fzr_topup__free_fire_cis__6160_diamonds';
    else if (product.includes('2398')) variation_id = 'fzr_topup__free_fire_cis__2398_diamonds';
    else if (product.includes('1166')) variation_id = 'fzr_topup__free_fire_cis__1166_diamonds';
    else if (product.includes('572')) variation_id = 'fzr_topup__free_fire_cis__572_diamonds';
    else if (product.includes('341')) variation_id = 'fzr_topup__free_fire_cis__341_diamonds';
    else if (product.includes('110')) variation_id = 'fzr_topup__free_fire_cis__110_diamonds';
    else if (product.includes('weekly') || product.includes('haftalik')) variation_id = 'fzr_topup__free_fire_cis__weekly_membership';
    else if (product.includes('monthly') || product.includes('oylik')) variation_id = 'fzr_topup__free_fire_cis__monthly_membership';

    return { game_key: 'free-fire', variation_id };
  }

  if (service.includes('mlbb') || service.includes('legend')) {
    let variation_id = 'fzr_topup__mobile_legends_global__14_diamonds';
    if (product.includes('3688')) variation_id = 'fzr_topup__mobile_legends_global__3688_diamonds';
    else if (product.includes('1084')) variation_id = 'fzr_topup__mobile_legends_global__1084_diamonds';
    else if (product.includes('706')) variation_id = 'fzr_topup__mobile_legends_global__706_diamonds';
    else if (product.includes('284')) variation_id = 'fzr_topup__mobile_legends_global__284_diamonds';
    else if (product.includes('170')) variation_id = 'fzr_topup__mobile_legends_global__170_diamonds';
    else if (product.includes('42')) variation_id = 'fzr_topup__mobile_legends_global__42_diamonds';
    else if (product.includes('14')) variation_id = 'fzr_topup__mobile_legends_global__14_diamonds';
    else if (product.includes('weekly') || product.includes('pass')) variation_id = 'fzr_topup__mobile_legends_global__weekly_pass';

    return { game_key: 'mlbb', variation_id };
  }

  if (service.includes('tg') || service.includes('telegram')) {
    let variation_id = 'premium_3';
    if (product.includes('12')) variation_id = 'premium_12';
    else if (product.includes('6')) variation_id = 'premium_6';
    else if (product.includes('3')) variation_id = 'premium_3';

    return { game_key: 'telegram-premium', variation_id };
  }

  return {
    game_key: service || 'pubg',
    variation_id: packageIdRaw || productNameRaw,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Проверка подлинности Telegram initData
    const { initData } = body;
    const authResult = debugVerifyTelegramInitData(initData);

    if (!authResult.user) {
      return NextResponse.json(
        { error: `Ошибка авторизации: ${authResult.reason}` },
        { status: 401 }
      );
    }

    const telegramId = Number(authResult.user.id);

    // 🛑 1.1 ПРОВЕРКА TELEGRAM ID (Защита от NULL в базе)
    if (!telegramId || isNaN(telegramId)) {
      return NextResponse.json(
        { error: 'Telegram ID topilmadi. Iltimos, ilovani Telegram оркали қайта очинг.' },
        { status: 401 }
      );
    }

    const playerIdRaw = body.targetId || body.playerId || body.player_id || body.username;
    const playerId = String(playerIdRaw || '').trim();

    if (!playerId) {
      return NextResponse.json({ error: 'Укажите Player ID' }, { status: 400 });
    }

    const price = Number(body.price || 0);

    // 🛑 ЗАЩИТА: Если цена <= 0 или не указана
    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Noto\'g\'ri summa (Цена должна быть больше 0)' }, { status: 400 });
    }

    const service = body.service || '';
    const productName = body.productName || '';
    const packageId = body.packageId || body.package_id || body.variation_id || body.id;

    // 2. АТОМАРНОЕ СПИСАНИЕ В SUPABASE
    let createdOrder: any = null;

    try {
      createdOrder = await purchaseWithBalance(telegramId, service, productName, playerId, price);
    } catch (dbErr: any) {
      const msg = dbErr.message || '';
      if (
        msg.includes('INSUFFICIENT') ||
        msg.includes('недостаточно') ||
        msg.includes('yetarli emas')
      ) {
        return NextResponse.json({ error: 'Balansingiz yetarli emas.' }, { status: 400 });
      }
      return NextResponse.json({ error: `Xatolik: ${dbErr.message}` }, { status: 400 });
    }

    // 🛑 АВТО-ПАРСИНГ ZONE_ID ИЗ PLAYER_ID (Если юзер ввел все в одно поле)
    let finalPlayerId = playerId;
    let finalServerId = body.serverId || body.server_id || body.zoneId || body.zone_id;

    if (!finalServerId && playerId.includes('(')) {
      const match = playerId.match(/(\d+)[\s\(_-]+(\d+)\)?/);
      if (match) {
        finalPlayerId = match[1];
        finalServerId = match[2];
      }
    }
    

    // 3. ОТПРАВКА ЗАПРОСА В PAYERPIN
    const { game_key, variation_id } = getPayerpinParams(service, productName, packageId);
    const serverId = body.serverId || body.server_id || body.zoneId || body.zone_id;

    const payerpinPayload: Record<string, any> = {
      game_key,
      variation_id,
      player_id: playerId,
    };

    if (serverId) {
      payerpinPayload.server_id = String(serverId).trim();
      payerpinPayload.zone_id = String(serverId).trim();
    }

    const apiKey = process.env.PAYERPIN_API_KEY || '';
    const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    console.log("🚀 ОТПРАВЛЯЕМ В PAYERPIN API:", JSON.stringify(payerpinPayload, null, 2));

    const response = await fetch('https://api.payerpin.uz/api/v2/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payerpinPayload),
    });

    const data = await response.json();

    // 4. ВОЗВРАТ СРЕДСТВ ПРИ ОШИБКЕ PAYERPIN
    if (!response.ok || data.ok === false) {
      if (createdOrder?.id) {
        await refundOrder(createdOrder.id);
      }
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return NextResponse.json(
        { error: `Ошибка Payerpin: ${errMsg}. Pulingiz qaytarildi.` },
        { status: response.status || 400 }
      );
    }

    // 5. УСПЕХ
    if (createdOrder?.id) {
      await completeOrder(createdOrder.id);
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}