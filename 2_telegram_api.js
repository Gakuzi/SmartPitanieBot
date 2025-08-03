// --- Функции отправки сообщений ---
function sendText(chatId, text, keyboard = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: String(chatId),
    text: text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  };
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard);
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log(`ERROR sending message to ${chatId}: ${e.message}`);
  }
}

function editMessageText(chatId, messageId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
  const payload = {
    chat_id: String(chatId),
    message_id: messageId,
    text: text,
    parse_mode: 'Markdown'
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log(`ERROR editing message ${messageId} for ${chatId}: ${e.message}`);
  }
}

function answerCallbackQuery(callbackQueryId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
  UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ callback_query_id: callbackQueryId }) });
}
