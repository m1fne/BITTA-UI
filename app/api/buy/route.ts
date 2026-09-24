import { NextResponse } from 'next/server';

// Карта соответствия внутренних ID магазина и variation_id от Payerpin
const VARIATION_MAP: Record<string, string> = {
  // PUBG Mobile UC
  'pubg_60': 'fzr_topup__pubg_mobile_auto__60_uc',
  'pubg_325': 'fzr_topup__pubg_mobile_auto__325_uc',
  'pubg_660': 'fzr_topup__pubg_mobile_auto__660_uc',
  'pubg_1800': 'fzr_topup__pubg_mobile_auto__1800_uc',
  'pubg_3850': 'fzr_topup__pubg_mobile_auto__3850_uc',
  'pubg_8100': 'fzr_topup__pubg_mobile_auto__8100_uc',

  // Free Fire Diamonds & Memberships
  'ff_110': 'fzr_topup__free_fire_cis__110_diamonds',
  'ff_341': 'fzr_topup__free_fire_cis__341_diamonds',
  'ff_572': 'fzr_topup__free_fire_cis__572_diamonds',
  'ff_1166': 'fzr_topup__free_fire_cis__1166_diamonds',
  'ff_2398': 'fzr_topup__free_fire_cis__2398_diamonds',
  'ff_6160': 'fzr_topup__free_fire_cis__6160_diamonds',
  'ff_weekly': 'fzr_topup__free_fire_cis__weekly_membership',
  'ff_monthly': 'fzr_topup__free_fire_cis__monthly_membership',

  // Mobile Legends Diamonds & Pass
  'mlbb_55': 'fzr_topup__mobile_legends_global__50_5_diamonds_first_top_up_bonus',
  'mlbb_165': 'fzr_topup__mobile_legends_global__150_15_diamonds_first_top_up_bonus',
  'mlbb_275': 'fzr_topup__mobile_legends_global__250_25_diamonds_first_top_up_bonus',
  'mlbb_565': 'fzr_topup__mobile_legends_global__500_65_diamonds_first_top_up_bonus',
  'mlbb_86': 'fzr_topup__mobile_legends_global__78_8_diamonds',
  'mlbb_172': 'fzr_topup__mobile_legends_global__156_16_diamonds',
  'mlbb_257': 'fzr_topup__mobile_legends_global__234_23_diamonds',
  'mlbb_706': 'fzr_topup__mobile_legends_global__625_81_diamonds',
  'mlbb_weekly': 'fzr_topup__mobile_legends_global__weekly_pass',

  // Telegram Premium
  'tg_3': 'premium_3',
  'tg_6': 'premium_6',
  'tg_12': 'premium_12',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Автоматически подхватываем любые варианты названий полей с фронтенда
    const packageId = body.packageId || body.package_id || body.variation_id || body.id;
    const playerId = body.playerId || body.player_id || body.username || body.userId || body.user_id;
    const serverId = body.serverId || body.server_id || body.zoneId || body.zone_id;

    if (!playerId) {
      return NextResponse.json({ error: 'Укажите Player ID или Username' }, { status: 400 });
    }

    const payerpinVariationId = VARIATION_MAP[packageId] || packageId;

    if (!payerpinVariationId) {
      return NextResponse.json({ error: 'Неверный ID товара' }, { status: 400 });
    }

    // Отправка заказа в Payerpin API
    const response = await fetch('https://api.payerpin.uz/api/v2/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PAYERPIN_API_KEY || '',
      },
      body: JSON.stringify({
        variation_id: payerpinVariationId,
        player_id: String(playerId),
        ...(serverId ? { server_id: String(serverId) } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Ошибка при оформлении заказа в Payerpin' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}