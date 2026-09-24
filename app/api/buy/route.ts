import { NextResponse } from 'next/server';

// Точные карты для сервисов и названий
function getVariationId(serviceRaw: string, productNameRaw: string, packageIdRaw: string): string | null {
  const service = (serviceRaw || '').toLowerCase().trim();
  const product = (productNameRaw || packageIdRaw || '').toLowerCase().trim();

  // 1. ПРЯМАЯ ПРОВЕРКА ДЛЯ PUBG MOBILE
  if (service.includes('pubg')) {
    if (product.includes('60')) return 'fzr_topup__pubg_mobile_auto__60_uc';
    if (product.includes('325')) return 'fzr_topup__pubg_mobile_auto__325_uc';
    if (product.includes('660')) return 'fzr_topup__pubg_mobile_auto__660_uc';
    if (product.includes('1800')) return 'fzr_topup__pubg_mobile_auto__1800_uc';
    if (product.includes('3850')) return 'fzr_topup__pubg_mobile_auto__3850_uc';
    if (product.includes('8100')) return 'fzr_topup__pubg_mobile_auto__8100_uc';
  }

  // 2. ПРЯМАЯ ПРОВЕРКА ДЛЯ FREE FIRE
  if (service.includes('free') || service.includes('ff')) {
    if (product.includes('110')) return 'fzr_topup__free_fire_cis__110_diamonds';
    if (product.includes('341')) return 'fzr_topup__free_fire_cis__341_diamonds';
    if (product.includes('572')) return 'fzr_topup__free_fire_cis__572_diamonds';
    if (product.includes('1166')) return 'fzr_topup__free_fire_cis__1166_diamonds';
    if (product.includes('2398')) return 'fzr_topup__free_fire_cis__2398_diamonds';
    if (product.includes('6160')) return 'fzr_topup__free_fire_cis__6160_diamonds';
    if (product.includes('weekly') || product.includes('haftalik')) return 'fzr_topup__free_fire_cis__weekly_membership';
    if (product.includes('monthly') || product.includes('oylik')) return 'fzr_topup__free_fire_cis__monthly_membership';
  }

  // 3. ПРЯМАЯ ПРОВЕРКА ДЛЯ MOBILE LEGENDS
  if (service.includes('mlbb') || service.includes('legend')) {
    if (product.includes('55') || product.includes('50')) return 'fzr_topup__mobile_legends_global__50_5_diamonds_first_top_up_bonus';
    if (product.includes('165') || product.includes('150')) return 'fzr_topup__mobile_legends_global__150_15_diamonds_first_top_up_bonus';
    if (product.includes('275') || product.includes('250')) return 'fzr_topup__mobile_legends_global__250_25_diamonds_first_top_up_bonus';
    if (product.includes('565') || product.includes('500')) return 'fzr_topup__mobile_legends_global__500_65_diamonds_first_top_up_bonus';
    if (product.includes('86') || product.includes('78')) return 'fzr_topup__mobile_legends_global__78_8_diamonds';
    if (product.includes('172') || product.includes('156')) return 'fzr_topup__mobile_legends_global__156_16_diamonds';
    if (product.includes('257') || product.includes('234')) return 'fzr_topup__mobile_legends_global__234_23_diamonds';
    if (product.includes('706') || product.includes('625')) return 'fzr_topup__mobile_legends_global__625_81_diamonds';
    if (product.includes('weekly') || product.includes('pass')) return 'fzr_topup__mobile_legends_global__weekly_pass';
  }

  // 4. ПРЯМАЯ ПРОВЕРКА ДЛЯ TELEGRAM PREMIUM
  if (service.includes('tg') || service.includes('telegram')) {
    if (product.includes('3')) return 'premium_3';
    if (product.includes('6')) return 'premium_6';
    if (product.includes('12')) return 'premium_12';
  }

  // Fallback: возвращаем то, что было передано в качестве ID
  return packageIdRaw || productNameRaw || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Поиск Player ID (поддерживает targetId)
    const playerId = body.targetId || body.playerId || body.player_id || body.username || body.userId || body.user_id;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Не указан Player ID (targetId)' },
        { status: 400 }
      );
    }

    // 2. Определение variation_id на основе данных фронтенда
    const service = body.service || '';
    const productName = body.productName || '';
    const packageId = body.packageId || body.package_id || body.variation_id || body.id;

    const payerpinVariationId = getVariationId(service, productName, packageId);

    if (!payerpinVariationId) {
      return NextResponse.json(
        { error: `Не удалось сопоставить товар (${service} / ${productName})` },
        { status: 400 }
      );
    }

    // 3. Сервер ID для MLBB (если передаётся)
    const serverId = body.serverId || body.server_id || body.zoneId || body.zone_id;

    // 4. Отправка заказа в Payerpin API
    const response = await fetch('https://api.payerpin.uz/api/v2/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PAYERPIN_API_KEY || '',
      },
      body: JSON.stringify({
        variation_id: payerpinVariationId,
        player_id: String(playerId).trim(),
        ...(serverId ? { server_id: String(serverId).trim() } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Ошибка при вызове Payerpin API' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}