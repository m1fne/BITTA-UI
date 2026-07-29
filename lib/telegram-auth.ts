import crypto from "crypto";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export interface TelegramWebAppUser {
  id: number;
  username?: string;
}

// window.Telegram.WebApp.initData подписан вашим bot-токеном самим Telegram.
// Проверка ниже доказывает, что telegram_id в запросе не подделан на фронтенде.
export function verifyTelegramInitData(initData: string): TelegramWebAppUser | null {
  if (!initData || !BOT_TOKEN) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (computedHash !== hash) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    const user = JSON.parse(userRaw);
    if (typeof user.id !== "number") return null;
    return { id: user.id, username: user.username };
  } catch {
    return null;
  }
}