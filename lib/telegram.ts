const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface InlineButton {
  text: string;
  callback_data: string;
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendMessage(chatId: number, text: string, buttons?: InlineButton[][]) {
  const res = await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  });
  return res.json();
}

// Пересылает чек (фото) админу — байты идут напрямую в Telegram, без хранения на своём сервере.
export async function sendPhoto(chatId: number, file: Blob, filename: string, caption: string, buttons?: InlineButton[][]) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  if (buttons) form.append("reply_markup", JSON.stringify({ inline_keyboard: buttons }));
  form.append("photo", file, filename);

  const res = await fetch(`${API}/sendPhoto`, { method: "POST", body: form });
  return res.json();
}

// После решения админа убираем кнопки и меняем текст под исходным сообщением.
export async function editDecision(chatId: number, messageId: number, hasPhoto: boolean, text: string) {
  const method = hasPhoto ? "editMessageCaption" : "editMessageText";
  const bodyField = hasPhoto ? { caption: text } : { text };
  await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, parse_mode: "HTML", ...bodyField }),
  }).catch(() => {});
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false) {
  await fetch(`${API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: showAlert }),
  }).catch(() => {});
}