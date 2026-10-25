import { NextResponse } from 'next/server';
import { purchaseWithBalance, refundOrder, completeOrder, supabase } from '@/lib/db';
import { debugVerifyTelegramInitData } from '@/lib/telegram-auth';

type LudovexParams = { game_key: string; variation_id: string };

// Варианты товаров из каталога Ludovex (variation_id). Менять только если Ludovex обновит каталог.
const PUBG = {
  uc60: 'lvxa_s_O1fmdN0H9_Vb9f1PCxW7Ynot2lkxBm3KvuJhFDpSxwSwZwP3728RgVkXz3CEU-OItcuZXjx8-WFTa34Asgg',
  uc325: 'lvxa_s_wPEwbMld6w4bRLbPY_jZHM2xRodrFWCGiEbjqtUftuCQMOthwNhN3sgfARVtq5G39qxk1dytklz3YQS73EOk',
  uc660: 'lvxa_s_7EHYSVj-yAhGpFIZMbuzVFfLZWGypJPz9owPCFbKqOuJCSejyM1mt5VzL-I1AWTY7IglhjiKPw16WO2vAtCR',
  uc1800: 'lvxa_s_SJNWDazLfKR-FwOK94LW0tjvj_KRLGc1nzb6kt7XfcVloGeHpeVHdG2emwDWkELtx2HGXrnBysaPKes0gWKtHg',
  uc3850: 'lvxa_s_bVCgf6UMMj8X3c-9qa5JR7nuuQ1o61Zh3z5FT709PxcTYRt5XoPW-64qexhHBVWX4UZQOrZJxrea3vSRcAk0fQ',
  uc8100: 'lvxa_s_fY90khrTH-nffxG7br-LK-li5Q6kA0nq6qIMX4CC86yHKdmIhHn0R9zlV2HAE3wl23mNERmdD1HOnOhfjJV0zQ',
  prime1: 'lvxa_s_ioi01M0o5Ntjye-EWAbVyEaxa2sS-aKIzEzILkRuiq3qZtqXCi70CRdLTrOaPwzR-S-tqTQwvSnNmb7PRYxrbEr_wX6hBg',
  prime3: 'lvxa_s_G9BTTLuwmP0ywfROxVwPZNNnNk5av7VdFTJ3PbfQEVRGGMhWldBe0WoROqQaFt2VEHlB_cRQvJwmu6c-0BqjZu3bL5L0FS0',
  prime6: 'lvxa_s_Is7MnEUSpMiTqSCAKlcJYqRmgtnB6s85wQ5UxK0j2-dbmul1mcuQrpkLd5Sopnu_wuhK-eybw04mrEIt6eL6cXTryjFL3lA',
  prime12: 'lvxa_s_0CsKtKhV63J_P3yaNBHmvCyINUu4HzbtX3r1ziEbpQwG3NNgEohM6l8xhe3qthJs4R7WqDLBSPH6fopJAoHry3vMDvzEDh6Q',
  primePlus1: 'lvxa_s_sCOFYcvBXnACMhzT3BNMI9T4TF7DMzteRXpf95c1J9aoAO-OsH_Z9xFETF4pqnYkLnCuQufGFrp_rilNCvlkua-lrLbQUkcADHyB',
  primePlus3: 'lvxa_s_nxCJsG_LjAIbNf1XCPT27nHOyFJXLZxPvf-_9uKP3B-eTUIkd6ZEKQ60_dzB1jYmGYkR96zFNRT3f2tuo2Psq2F018PlyqR6Ix3pTg',
  primePlus6: 'lvxa_s_hl2GvapF2N_D9AVz1-t4pH6dnnjz9c2G9_dn_KJFAjtppY4kdug-uzurci7MSW8x-qgkzlM1Rlpz0mByQC4dMS4PfuXt5SR-ofJg8A',
  primePlus12: 'lvxa_s_bVklrhjcdIlugUmktBFNqpy7nXLs0ADJ6URdkd_FBELQvxAovnXHKLgenPbKJo--62bASnsNV6zQYLmsfkoxbMiomJKAmB8HKYev7ZQ',
  firstPurchase: 'lvxa_s_oS55zketaRDpxLB9TNvIbVvF8hQXMs12m4jmuK34FWU8fvKiQfc7zs__YkgnnYAJEtQKURzJNYlB7l_dGgAxqQfaXY8aVqPDRGsZlg',
  weeklyDeal1: 'lvxa_s_G511sbnVsdVUOcPkbAAjK1Tr1lfsoCsleswcu6qMJeXeXj_sTMpD4l4ukNNWrlnTQLPzLkwClJ6_zf9Ij7vXaUrG3WdMSgG8GPZc',
  weeklyDeal2: 'lvxa_s_Cxm24UptDvOtt2rNdde-dbrghlAdbKTRpxfwYCVSgJpMrjxIByEGYVpE2wPLNCetw2pMLGwg6owYAOGtofqB8JPci_m7kfIngWrF',
  weeklyMythic: 'lvxa_s_TcYbHhwfoFdd3R3c1sX_NBe8GyMw3cG7Fv5s27v-7Umh2t6l-UwHzQizrxKjoncZ61bmVlvkOn3nireznLWjBD7CrjRwFxaRn0r7mhQE5QpXxwRppj2SCg',
  mythic: 'lvxa_s_8AHeKW3vzg0MpEGn39xR8aNPoIeohwI9vhvWh9t5wXmjmHL3Q_fVA6dFtzJkn13yLIjX2BGWMUlg4XXdL6d4ZJX7gomClW1tPp-0',
  firearm: 'lvxa_s_pk6heHtO8wj2D8xUPzNy7bg0oDeF-I_XKhCfQR2Wt6j7EYJG11YHj2-MLn8g-YpYjvnFtjfXHkYxtFmGpjzn5iCdVhU2RWfww_q1Ad5IZix6D0jToGBmORVZ',
};

const FF = {
  d110: 'lvxa_s_pjOWMrogUo0CNhmkSvcgFw6uPkAmNvCV1qj3G1z3kT-NnstlAlokbE9iT_CuDwvbyuEg6pjVrAxRQN0gP_xCnU4d',
  d341: 'lvxa_s_d8oSyo9DK0Ixjrpka4D6jeX3AlVmYLZkEimHne7x6x0Xj5iFxF1NWnvnDanfArdW9Inbp5IlWeHzhHCHnEraXqu3',
  d572: 'lvxa_s_W84vM1fgZCoSN_d0avSdrNypGstSHvT3gvOV3dsHtNfbmutl9xKgOlwiZHcPDoBt-712CGllEYuuWIarVRne6iHL',
  d1166: 'lvxa_s_QSEg9QVaUfzt-A686bxwwLo7kz7CeH0FpQOSCiOruH7oiY8oCc7OnCrLGhjWO_acH4GX9n92vxafMk4sO3vnXOfEpw',
  d2398: 'lvxa_s_ykpMxd6WDqNBaXi4FQhQ0Uyv9cEBd7k3ARUQ-KA6oMl0T6NAApYFEqFMTPSvILa8PWzoW8X882BgpSSI_5eMW69fYg',
  d6160: 'lvxa_s_eXP6epGkVATmRI1JQlhpCrAgCZw730aph7oCJluB1DT81pb2TUm7RmfYT3-rOWoe8FdO-wExIJfX7L2KjdnaqckXCw',
};

const MLBB = {
  d14: 'lvxa_s_fPMSncsQSX3tPnSp8v6gD-7NEnNHAfNWRKLNqVYxkZ65PNKMBPd_T8mgCkuRUxUa2o3rv9PNVOJP3C3I37xSjTUO6aCVP2CF8w',
  d42: 'lvxa_s_KSapn3m-LfXkGbNrSmfOcqefc0g3kLuj92sXA4T58jZyLlsQtDIDGw8OBIbXe6GAYsaW6iqVM2v3MnD3Ub8N4NACxosqhHA6gA',
  d170: 'lvxa_s_adU2hikbAXb7b21UK8wFYYobJe3_7wKCYna3Qj126iXtcUgjglhg8ogR26rUdgKd4LQJAdnrlfnEaODYis-Crtb6O9ucqLtMXhY',
  d284: 'lvxa_s_WoTDRnEBbHVrDaaQqUVekIuUn6YDf_d8D0C4mwNAoNHr2wiqmT8smG1KxxX6yBKhq3gMfP3g4jrSPFmg-iBlmTfFGF6NVUYEzOE',
  d706: 'lvxa_s_1iKvnSPykK8iiv4z34ortswCK3utWwR12IVvUBeI60XkqjWQmok9eQPBA0VvayUc6FJKaNnBVovombZCnF1XI4neX6heL_iXFOOBjZI',
  d1084: 'lvxa_s_glF1I8rxaBQv7bLzO14E18jX2_4Zf3ODtZTwrv6zLWRVHXLPqSvnV-WzxiRLs28J2EOyoUkMAIGCKYbpDQoMNQjW96dD9OJ-ogxL',
  d3688: 'lvxa_s_Ef1PeNEsDmByy4UcSHrdxeeSHaRQ1p5gOBazMFW6PzBS9H699pm2oP4nHyquwtjUNghPTA15f14wg4O26H4C7paWGm33nayPxQfxmzCnzQ',
};

const TG = {
  m3: 'lvxa_s_UYgzKwjLBoYI4ed84ggFNZw-Eb3kluNKBy89oPdbsZogwm8jmA',
  m6: 'lvxa_s_7E5sc77OpJKGnvDSBQrR7AYfsQcfQLA1Oalo68L8E21AVQfugA',
  m12: 'lvxa_s_2YDOPYkd4WMhCdhPQuJ4281XwuiaES1X44GitGDJpmgkFaxBomU',
};

const BS = {
  bc51: 'lvxa_s_UHhB5xO90NLg-z7x9lvtH3GmvWmUapB-1ayLcC5qeLIC4oUP_1lum1EJqhPQsBYquIYqddSayxvmKw',
  bc105: 'lvxa_s_rtn52DFIiRjAxur0fYDlwgEtpmpX8WqqMiuzCtwoGpevc0WG49PeH4DdZ5ySA7nCSGh3423TiAtT6uE',
  bc320: 'lvxa_s_5rqLUT6WTawAcrr18pAjOJld_vScDdwCMyDr9AWeQuDgeSbC0FF0ZQJaaZpgqnHCtq8jNKjUj7bKv0A',
  bc540: 'lvxa_s_Z4260KFQ4lMH4FXlYLRPIvv6emPNrQgXWGo9S9UkPlemoTzX5VQdMQYeiL88disbgUh3FxaTQ16bii4',
  bc1100: 'lvxa_s_8yt9VnqJhV6qEEoXTdeXhdGF0GDqxSvcbXT3tk1RyH8yew7Lm9eofpo9lKMGAcjsYwDANrWm1RkyuCAu',
  bc2260: 'lvxa_s_kfzNxZs7OfsLJwvXZqYNfHGBO90GQf5JFicj84po7GMLNIHarqAATZu2jcUDtw21MVmvmMIWHklGdQN2',
  bc5800: 'lvxa_s_Oelg1o_B_r5Fu5vVkIaB6rfqklf66LGeysSi2Woa-wxJrfrpszR2e-iH-1PGJhoJom8cnEQTmiaLhOtj',
};

// Определяем товар. Если товар не распознан, возвращаем null (запрос будет отклонён).
function getLudovexParams(
  serviceRaw: unknown,
  productNameRaw: unknown,
  packageIdRaw: unknown
): LudovexParams | null {
  const service = String(serviceRaw || '').toLowerCase().trim();
  const product = String(productNameRaw || packageIdRaw || '').toLowerCase().trim();

  if (service.includes('pubg')) {
    let variation_id: string | null = null;
    if (product.includes('8100')) variation_id = PUBG.uc8100;
    else if (product.includes('3850')) variation_id = PUBG.uc3850;
    else if (product.includes('1800')) variation_id = PUBG.uc1800;
    else if (product.includes('660')) variation_id = PUBG.uc660;
    else if (product.includes('325')) variation_id = PUBG.uc325;
    else if (product.includes('60')) variation_id = PUBG.uc60;

    // --- PRIME PLUS (проверяем ДО обычного Prime, иначе "prime plus" распознается как "prime") ---
    else if (product.includes('prime') && product.includes('plus') && product.includes('12')) variation_id = PUBG.primePlus12;
    else if (product.includes('prime') && product.includes('plus') && product.includes('6')) variation_id = PUBG.primePlus6;
    else if (product.includes('prime') && product.includes('plus') && product.includes('3')) variation_id = PUBG.primePlus3;
    else if (product.includes('prime') && product.includes('plus')) variation_id = PUBG.primePlus1;

    // --- PRIME ---
    else if (product.includes('prime') && product.includes('12')) variation_id = PUBG.prime12;
    else if (product.includes('prime') && product.includes('6')) variation_id = PUBG.prime6;
    else if (product.includes('prime') && product.includes('3')) variation_id = PUBG.prime3;
    else if (product.includes('prime')) variation_id = PUBG.prime1;

    // --- СПЕЦИАЛЬНЫЕ ПАКИ И ЭМБЛЕМЫ ---
    else if (product.includes('first purchase')) variation_id = PUBG.firstPurchase;
    else if (product.includes('weekly deal') && product.includes('1')) variation_id = PUBG.weeklyDeal1;
    else if (product.includes('weekly deal') && product.includes('2')) variation_id = PUBG.weeklyDeal2;
    else if (product.includes('mythic emblem') && product.includes('weekly')) variation_id = PUBG.weeklyMythic;
    else if (product.includes('mythic emblem')) variation_id = PUBG.mythic;
    else if (product.includes('firearm')) variation_id = null; // нет в каталоге Ludovex

    return variation_id ? { game_key: 'lvxa_g_jz9MVhttb20qfWvQt224GZF1B2-E2M4AqIHzJ7qCk2c', variation_id } : null;
  }

  if (service.includes('blood') || service.includes('strike')) {
    let variation_id: string | null = null;
    if (product.includes('5800')) variation_id = BS.bc5800;
    else if (product.includes('2260')) variation_id = BS.bc2260;
    else if (product.includes('1100')) variation_id = BS.bc1100;
    else if (product.includes('540')) variation_id = BS.bc540;
    else if (product.includes('320')) variation_id = BS.bc320;
    else if (product.includes('105')) variation_id = BS.bc105;
    else if (product.includes('51')) variation_id = BS.bc51;

    return variation_id ? { game_key: 'lvxa_g_tWJU57zHRniWfr4i0HTwS0drSHcY5TNlhtI4JQE5BA4l2SqI21ok-g', variation_id } : null;
  }

  if (service.includes('free') || service.includes('ff')) {
    let variation_id: string | null = null;
    if (product.includes('6160')) variation_id = FF.d6160;
    else if (product.includes('2398')) variation_id = FF.d2398;
    else if (product.includes('1166')) variation_id = FF.d1166;
    else if (product.includes('572')) variation_id = FF.d572;
    else if (product.includes('341')) variation_id = FF.d341;
    else if (product.includes('110')) variation_id = FF.d110;

    return variation_id ? { game_key: 'lvxa_g_xmWcYFMJ14zoq7C43FBKIo3QeqAQa3DARFFTABvEFiRV_HF0', variation_id } : null;
  }

  if (service.includes('mlbb') || service.includes('legend')) {
    let variation_id: string | null = null;
    if (product.includes('3688')) variation_id = MLBB.d3688;
    else if (product.includes('1084')) variation_id = MLBB.d1084;
    else if (product.includes('706')) variation_id = MLBB.d706;
    else if (product.includes('284')) variation_id = MLBB.d284;
    else if (product.includes('170')) variation_id = MLBB.d170;
    else if (product.includes('42')) variation_id = MLBB.d42;
    else if (product.includes('14')) variation_id = MLBB.d14;

    return variation_id ? { game_key: 'lvxa_g_5OkUaNWG4eqwarLYI3Y-Nr6Q1bopi9mozJ7lKMUEC_IzsW51VyLh', variation_id } : null;
  }

  if (service.includes('tg') || service.includes('telegram') || service.includes('premium')) {
    let variation_id: string | null = null;
    if (product.includes('12')) variation_id = TG.m12;
    else if (product.includes('6')) variation_id = TG.m6;
    else if (product.includes('3')) variation_id = TG.m3;

    return variation_id ? { game_key: 'lvxa_g_Fwy-6scrxvEOHfDT3DG9VIUQZnA181oaS9hZsjOIag_v1sSFSyvUFVqs5VQ', variation_id } : null;
  }

  return null;
}

// 🛡️ Строгий серверный справочник цен в сумах (клиент не может их подделать).
// Товар без цены здесь продать нельзя: сервер ответит "товар не найден".
const SERVER_PRICES: Record<string, number> = {
  // --- PUBG ---
  [PUBG.uc60]: 13000,
  [PUBG.uc325]: 58000,
  [PUBG.uc660]: 115000,
  [PUBG.uc1800]: 285000,
  [PUBG.uc3850]: 560000,
  [PUBG.uc8100]: 1130000,
  [PUBG.prime1]: 14000,
  [PUBG.prime3]: 36000,
  [PUBG.prime6]: 70000,
  [PUBG.prime12]: 135000,
  [PUBG.firstPurchase]: 15000,
  [PUBG.weeklyDeal1]: 15000,
  [PUBG.weeklyDeal2]: 36000,
  [PUBG.weeklyMythic]: 36000,
  [PUBG.mythic]: 60000,
  [PUBG.firearm]: 36000,
  [PUBG.primePlus1]: 120000,
  [PUBG.primePlus3]: 330000,
  [PUBG.primePlus6]: 639000,
  [PUBG.primePlus12]: 1350000,

  // --- FREE FIRE ---
  [FF.d110]: 12000,
  [FF.d341]: 32000,
  [FF.d572]: 53000,
  [FF.d1166]: 101000,
  [FF.d2398]: 199000,
  [FF.d6160]: 495000,

  // --- MLBB ---
  [MLBB.d14]: 5000,
  [MLBB.d42]: 11000,
  [MLBB.d170]: 38000,
  [MLBB.d284]: 62000,
  [MLBB.d706]: 115000,
  [MLBB.d1084]: 220000,
  [MLBB.d3688]: 590000,

  // --- TELEGRAM PREMIUM ---
  [TG.m3]: 160000,
  [TG.m6]: 220000,
  [TG.m12]: 390000,

  // --- BLOOD STRIKE ---
  [BS.bc51]: 8000,
  [BS.bc105]: 12000,
  [BS.bc320]: 34000,
  [BS.bc540]: 50000,
  [BS.bc1100]: 96000,
  [BS.bc2260]: 190000,
  [BS.bc5800]: 473000,
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

// Запрос в Ludovex API. Возвращает null, если ответа вообще не было (сеть/таймаут).
async function callLudovex(payload: Record<string, any>, idempotencyKey: string) {
  try {
    // Согласно документации Ludovex, idempotency_key передается внутри JSON тела запроса
    const bodyWithIdempotency = {
      ...payload,
      idempotency_key: idempotencyKey,
    };

    const response = await fetch('https://ludovex.org/api/v2/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.LUDOVEX_API_KEY || process.env.PAYERPIN_API_KEY || '',
      },
      body: JSON.stringify(bodyWithIdempotency),
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
    console.error('❌ Ludovex недоступен:', err);
    return null;
  }
}


// Достаём ID заказа Ludovex из ответа на создание заказа (формат ответа в документации не описан)
function extractLudovexOrderId(data: any): string | null {
  const candidates = [
    data?.order_id,
    data?.data?.order_id,
    data?.order?.order_id,
    data?.result?.order_id,
    data?.id,
    data?.data?.id,
    data?.order?.id,
    data?.result?.id,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && /^\d+$/.test(String(c))) return String(c);
  }
  return null;
}

export async function POST(request: Request) {
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
    const params = getLudovexParams(service, productName, packageId);
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

    const ludovexPayload: Record<string, any> = {
      game_key,
      variation_id,
      player_id: finalPlayerId,
    };

    if (finalServerId) {
      ludovexPayload.server_id = String(finalServerId).trim();
      ludovexPayload.zone_id = String(finalServerId).trim();
    }

    // Ключ идемпотентности = ID заказа
    const idempotencyKey = `order-${createdOrder.id}`;

    console.log('🚀 ОТПРАВЛЯЕМ В LUDOVEX API:', JSON.stringify(ludovexPayload));

    const result = await callLudovex(ludovexPayload, idempotencyKey);

    // 6. НЕИЗВЕСТНЫЙ РЕЗУЛЬТАТ: нет ответа, ошибка сервера Ludovex или ответ не JSON.
    if (!result || !result.data || result.status >= 500) {
      console.error('⚠️ Неизвестный результат Ludovex для заказа', createdOrder.id, result?.status);
      await notifyAdmin(
        `⚠️ Заказ требует проверки!\nЗаказ: ${createdOrder.order_order_no ?? createdOrder.id}\nID заказа: ${createdOrder.id}\nПользователь: ${telegramId}\nТовар: ${variation_id}\nСумма: ${price}\nLudovex не дал внятного ответа (статус: ${result?.status ?? 'нет ответа'}). Статус заказа оставлен processing, деньги не возвращены.`
      );
      return NextResponse.json(
        { error: "Buyurtma holati tekshirilmoqda. Pulingiz yo'qolmaydi, admin tez orada hal qiladi." },
        { status: 502 }
      );
    }

    const { data } = result;

    // 7. ЧЁТКИЙ ОТКАЗ LUDOVEX: возврат средств
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
      console.error('Ludovex отказал:', JSON.stringify(data).slice(0, 500));

      return NextResponse.json(
        { error: `Ошибка Ludovex: ${errMsg}.${refunded ? ' Pulingiz qaytarildi.' : ''}` },
        { status: result.status || 400 }
      );
    }

    // 8. УСПЕХ
    // Запоминаем ID заказа Ludovex: по нему вебхук находит наш заказ
    try {
      console.log('✅ Ответ Ludovex:', JSON.stringify(data).slice(0, 600));
      const ludovexOrderId = extractLudovexOrderId(data);
      if (ludovexOrderId) {
        const { error: saveErr } = await supabase
          .from('orders')
          .update({ provider_order_id: ludovexOrderId })
          .eq('id', createdOrder.id);
        if (saveErr) console.error('Не удалось сохранить ID заказа Ludovex:', saveErr);
      } else {
        console.warn('В ответе Ludovex не нашли ID заказа, заказ', createdOrder.id);
      }
    } catch (saveEx) {
      console.error('Ошибка сохранения ID заказа Ludovex:', saveEx);
    }

    await completeOrder(createdOrder.id);

    // Конкурс: билет за первую покупку
    try {
      await supabase.rpc('contest_grant_ticket', {
        p_user_id: telegramId,
        p_reason: 'purchase',
        p_ref: String(createdOrder.id),
      });
    } catch (contestErr) {
      console.error('Конкурс: не удалось выдать билет за покупку', contestErr);
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Ошибка в POST /api/buy:', error);

    if (createdOrder?.id) {
      await notifyAdmin(
        `⚠️ Сбой после списания!\nID заказа: ${createdOrder.id}\nПользователь: ${createdOrder.user_id}\nСумма: ${createdOrder.price}\nПроверьте заказ вручную.`
      );
    }

    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}