// lib/stars.ts — настройки оплаты звёздами (один источник правды)

// Пакеты, из которых выбирает пользователь (количество звёзд)
export const STAR_PACKS = [50, 100, 250, 500, 1000];

// Сколько UZS зачисляем за 1 звезду. Меняется переменной STARS_UZS_PER_STAR в Vercel.
// ВАЖНО: Telegram платит вам примерно $0.013 за звезду — держите курс ниже этой суммы в UZS.
export function starRate(): number {
  const n = Number(process.env.STARS_UZS_PER_STAR);
  return Number.isFinite(n) && n > 0 ? n : 130;
}

export const starsToUzs = (stars: number) => Math.round(stars * starRate());

export const isValidStars = (n: number) => STAR_PACKS.includes(n);

export const botToken = () => process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";

// Вызов Bot API (токен остаётся только на сервере)
export async function tgApi(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data: any = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok === true, data };
}