import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export interface TelegramWebAppUser {
  id: number;
  username?: string;
}

// window.Telegram.WebApp.initData подписан вашим bot-токеном самим Telegram.
// Проверка ниже доказывает, что telegram_id в запросе не подделан на фронтенде.
export function verifyTelegramInitData(initData: string): TelegramWebAppUser | null {
  const result = debugVerifyTelegramInitData(initData);
  return result.user ?? null;
}

// Временная диагностическая версия — объясняет ПОЧЕМУ проверка не прошла.
// Используется в /api/vacancies, пока разбираемся с UNAUTHORIZED. Потом можно убрать.
export function debugVerifyTelegramInitData(initData: string): { user: TelegramWebAppUser | null; reason: string } {
  if (!initData) return { user: null, reason: "NO_INIT_DATA" };
  if (!BOT_TOKEN) return { user: null, reason: "NO_BOT_TOKEN_ON_SERVER" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { user: null, reason: "NO_HASH_IN_INIT_DATA" };
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return { user: null, reason: "SIGNATURE_MISMATCH_WRONG_TOKEN" };

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate) return { user: null, reason: "NO_AUTH_DATE" };
  if (Date.now() / 1000 - authDate > 86400) return { user: null, reason: "INIT_DATA_TOO_OLD" };

  const userRaw = params.get("user");
  if (!userRaw) return { user: null, reason: "NO_USER_IN_INIT_DATA" };

  try {
    const user = JSON.parse(userRaw);
    if (typeof user.id !== "number") return { user: null, reason: "USER_ID_NOT_A_NUMBER" };
    return { user: { id: user.id, username: user.username }, reason: "OK" };
  } catch {
    return { user: null, reason: "USER_JSON_PARSE_FAILED" };
  }
}