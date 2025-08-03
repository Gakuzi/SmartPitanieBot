// --- Функции отправки сообщений ---
function sendText(chatId, text, keyboard = null) {
  const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!telegramToken) {
    Logger.log("FATAL: TELEGRAM_TOKEN не найден в ScriptProperties!");
    return;
  }

  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
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
    muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      Logger.log(`ERROR sending message to ${chatId}. Response: ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log(`CRITICAL ERROR sending message to ${chatId}: ${e.message}`);
  }
}

function editMessageText(chatId, messageId, text) {
  const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!telegramToken) return;

  const url = `https://api.telegram.org/bot${telegramToken}/editMessageText`;
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
  const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!telegramToken) return;
  
  const url = `https://api.telegram.org/bot${telegramToken}/answerCallbackQuery`;
  UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ callback_query_id: callbackQueryId }) });
}

/**
 * Отправляет тестовое сообщение администратору из Google Sheet.
 * Эту функцию нужно привязать к кнопкам в листе "Тест отправки".
 * @param {string} messageText - Текст сообщения для отправки.
 */
function sendTestMessage(messageText) {
  const scriptProps = PropertiesService.getScriptProperties();
  const adminChatId = scriptProps.getProperty('ADMIN_CHAT_ID');
  
  if (!adminChatId) {
    Logger.log("TEST_MESSAGE: ADMIN_CHAT_ID не найден в ScriptProperties. Невозможно отправить тестовое сообщение.");
    SpreadsheetApp.getUi().alert('Ошибка', 'ADMIN_CHAT_ID не найден в ScriptProperties. Проверьте настройки.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  try {
    sendText(adminChatId, `Тестовое сообщение из таблицы: ${messageText}`);
    SpreadsheetApp.getUi().alert('Успех', 'Тестовое сообщение отправлено администратору.', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    Logger.log(`TEST_MESSAGE: Ошибка при отправке тестового сообщения: ${e.message}`);
    SpreadsheetApp.getUi().alert('Ошибка', `Не удалось отправить тестовое сообщение: ${e.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
