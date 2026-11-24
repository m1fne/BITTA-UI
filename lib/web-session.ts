// lib/web-session.ts — вход на сайте (вне Telegram): подписанный токен вместо initData
import crypto from "crypto";

export type WebUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

const TTL_SECONDS = 30 * 24 * 3600; // 30 дней

const secret = () => process.env.SESSION_SECRET || "";

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url").toString("utf8");
const sign = (body: string) => crypto.createHmac("sha256", secret()).update(body).digest("base64url");

// Возвращает строку вида "web.<данные>.<подпись>"
export function signWebSession(user: WebUser): string | null {
  if (!secret()) return null;
  const body = b64(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }));
  return `web.${body}.${sign(body)}`;
}

export function verifyWebSession(token: string): WebUser | null {
  try {
    if (!secret() || typeof token !== "string" || !token.startsWith("web.")) return null;
    const [, body, sig] = token.split(".");
    if (!body || !sig) return null;

    const expected = Buffer.from(sign(body));
    const received = Buffer.from(sig);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

    const data = JSON.parse(unb64(body));
    if (!data?.id || !Number.isFinite(Number(data.id))) return null;
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: Number(data.id),
      username: data.username,
      first_name: data.first_name,
      last_name: data.last_name,
      photo_url: data.photo_url,
    };
  } catch {
    return null;
  }
}

export const isWebToken = (s: string) => typeof s === "string" && s.startsWith("web.");