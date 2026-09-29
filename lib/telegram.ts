const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface InlineButton {
  text: string;
  callback_data: string;
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Безопасная функция отправки запросов к Telegram
async function safeFetch(url: string, options: RequestInit) {
  if (!BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN не задан в .env!");
    return { ok: false, error: "BOT_TOKEN_MISSING" };
  }

  try {
    const res = await fetch(url, options);
    const rawText = await res.text();

    try {
      return JSON.parse(rawText);
    } catch {
      console.error(`❌ Telegram API вернул не-JSON ответ (статус ${res.status}):`, rawText);
      return { ok: false, error: "INVALID_JSON", rawText };
    }
  } catch (err) {
    console.error("❌ Ошибка сети при запросе к Telegram:", err);
    return { ok: false, error: "NETWORK_ERROR" };
  }
}

export async function sendMessage(chatId: number, text: string, buttons?: InlineButton[][]) {
  return safeFetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  });
}

// Пересылает чек (фото) админу — байты идут напрямую в Telegram, без хранения на своём сервере.
export async function sendPhoto(chatId: number, file: Blob, filename: string, caption: string, buttons?: InlineButton[][]) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  if (buttons) form.append("reply_markup", JSON.stringify({ inline_keyboard: buttons }));
  form.append("photo", file, filename);

  return safeFetch(`${API}/sendPhoto`, { method: "POST", body: form });
}

// После решения админа убираем кнопки и меняем текст под исходным сообщением.
export async function editDecision(chatId: number, messageId: number, hasPhoto: boolean, text: string) {
  const method = hasPhoto ? "editMessageCaption" : "editMessageText";
  const bodyField = hasPhoto ? { caption: text } : { text };
  
  return safeFetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chat_id: chatId, 
      message_id: messageId, 
      parse_mode: "HTML", 
      reply_markup: { inline_keyboard: [] }, // Очищаем кнопки
      ...bodyField 
    }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
  return safeFetch(`${API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
  });
}