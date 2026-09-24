import { NextResponse } from 'next/server';

// Определение game_key и variation_id на основе данных фронтенда
function getPayerpinParams(serviceRaw: string, productNameRaw: string, packageIdRaw: string) {
  const service = (serviceRaw || '').toLowerCase().trim();
  const product = (productNameRaw || packageIdRaw || '').toLowerCase().trim();

  // 1. PUBG MOBILE
  if (service.includes('pubg')) {
    let variation_id = 'fzr_topup__pubg_mobile_auto__60_uc';
    if (product.includes('8100')) variation_id = 'fzr_topup__pubg_mobile_auto__8100_uc';
    else if (product.includes('3850')) variation_id = 'fzr_topup__pubg_mobile_auto__3850_uc';
    else if (product.includes('1800')) variation_id = 'fzr_topup__pubg_mobile_auto__1800_uc';
    else if (product.includes('660')) variation_id = 'fzr_topup__pubg_mobile_auto__660_uc';
    else if (product.includes('325')) variation_id = 'fzr_topup__pubg_mobile_auto__325_uc';
    else if (product.includes('60')) variation_id = 'fzr_topup__pubg_mobile_auto__60_uc';

    return { game_key: 'pubg', variation_id };
  }

  // 2. FREE FIRE
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

  // 3. MOBILE LEGENDS
  if (service.includes('mlbb') || service.includes('legend')) {
    let variation_id = 'fzr_topup__mobile_legends_global__78_8_diamonds';
    if (product.includes('706') || product.includes('625')) variation_id = 'fzr_topup__mobile_legends_global__625_81_diamonds';
    else if (product.includes('565') || product.includes('500')) variation_id = 'fzr_topup__mobile_legends_global__500_65_diamonds_first_top_up_bonus';
    else if (product.includes('275') || product.includes('250')) variation_id = 'fzr_topup__mobile_legends_global__250_25_diamonds_first_top_up_bonus';
    else if (product.includes('257') || product.includes('234')) variation_id = 'fzr_topup__mobile_legends_global__234_23_diamonds';
    else if (product.includes('172') || product.includes('156')) variation_id = 'fzr_topup__mobile_legends_global__156_16_diamonds';
    else if (product.includes('165') || product.includes('150')) variation_id = 'fzr_topup__mobile_legends_global__150_15_diamonds_first_top_up_bonus';
    else if (product.includes('86') || product.includes('78')) variation_id = 'fzr_topup__mobile_legends_global__78_8_diamonds';
    else if (product.includes('55') || product.includes('50')) variation_id = 'fzr_topup__mobile_legends_global__50_5_diamonds_first_top_up_bonus';
    else if (product.includes('weekly') || product.includes('pass')) variation_id = 'fzr_topup__mobile_legends_global__weekly_pass';

    return { game_key: 'mlbb', variation_id };
  }

  // 4. TELEGRAM PREMIUM
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

    const playerIdRaw = body.targetId || body.playerId || body.player_id || body.username || body.userId || body.user_id;
    const playerId = String(playerIdRaw || '').trim();

    if (!playerId) {
      return NextResponse.json({ error: 'Укажите Player ID' }, { status: 400 });
    }

    const service = body.service || '';
    const productName = body.productName || '';
    const packageId = body.packageId || body.package_id || body.variation_id || body.id;

    const { game_key, variation_id } = getPayerpinParams(service, productName, packageId);

    const serverId = body.serverId || body.server_id || body.zoneId || body.zone_id;

    // Формируем payload по ровному маркеру API v2
    const payerpinPayload: Record<string, any> = {
      game_key: game_key,
      variation_id: variation_id,
      player_id: playerId,
    };

    if (serverId) {
      payerpinPayload.server_id = String(serverId).trim();
      payerpinPayload.zone_id = String(serverId).trim();
    }

    const apiKey = process.env.PAYERPIN_API_KEY || '';
    const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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

    if (!response.ok || data.ok === false) {
      const errMsg = data.error?.message || data.message || JSON.stringify(data);
      return NextResponse.json(
        { error: `Ошибка Payerpin: ${errMsg}` },
        { status: response.status || 400 }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}