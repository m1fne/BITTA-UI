// lib/telegram-auth.ts — НОВЫЙ файл-обёртка.
// Старый файл переименован в telegram-auth-core.ts и остаётся как есть.
// Всё, что уже работало (initData из Telegram), идёт через него; токены сайта ("web.…") проверяем сами.
import * as core from "./telegram-auth-core";
import { isWebToken, verifyWebSession } from "./web-session";

export * from "./telegram-auth-core";

export function verifyTelegramInitData(initData: string): ReturnType<typeof core.verifyTelegramInitData> {
  if (isWebToken(initData)) {
    const user = verifyWebSession(initData);
    return (user ? { ...user } : null) as any;
  }
  return core.verifyTelegramInitData(initData);
}

export function debugVerifyTelegramInitData(initData: string): ReturnType<typeof core.debugVerifyTelegramInitData> {
  if (isWebToken(initData)) {
    const user = verifyWebSession(initData);
    return (user ? { user: { ...user }, reason: null } : { user: null, reason: "WEB_SESSION_INVALID" }) as any;
  }
  return core.debugVerifyTelegramInitData(initData);
}