const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Безопасный вызов Telegram API (не падает, если Telegram вернул не JSON)
 */
async function tgFetch(method: string, body: Record<string, any>) {
  if (!BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN не указан в .env!");
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      console.error(`❌ Telegram API (${method}) вернул не JSON:`, text);
      return null;
    }
  } catch (err) {
    console.error(`❌ Сетевая ошибка при запросе к Telegram (${method}):`, err);
    return null;
  }
}

export async function sendMessage(chatId: number | string, text: string) {
  return tgFetch("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
) {
  return tgFetch("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

export async function editDecision(
  chatId: number | string,
  messageId: number,
  hasPhoto: boolean,
  text: string
) {
  if (hasPhoto) {
    return tgFetch("editMessageCaption", {
      chat_id: chatId,
      message_id: messageId,
      caption: text,
      parse_mode: "HTML",
    });
  } else {
    return tgFetch("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    });
  }
}