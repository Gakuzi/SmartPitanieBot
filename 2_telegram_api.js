/**
 * @file 2_telegram_api.js
 * @description Низкоуровневые функции для взаимодействия с Telegram Bot API.
 */

// --- Функции отправки сообщений ---

/**
 * Отправляет текстовое сообщение с опциональной клавиатурой.
 * @param {string|number} chatId - ID чата.
 * @param {string} text - Текст сообщения.
 * @param {object} [keyboard=null] - Объект клавиатуры (reply_markup).
 */
function sendText(chatId, text, keyboard = null) {
  const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!telegramToken) {
    Logger.log("❌ КРИТИЧЕСКАЯ ОШИБКА: TELEGRAM_TOKEN не найден в ScriptProperties!");
    return;
  }

  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  const payload = {
    chat_id: String(chatId),
    text: text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  };

  if (keyboard) {
    payload.reply_markup = JSON.stringify(keyboard);
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
      Logger.log(`❌ ОШИБКА отправки сообщения в чат ${chatId}. Статус: ${responseCode}. Ответ: ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при отправке сообщения в чат ${chatId}: ${e.message}\nStack: ${e.stack || 'N/A'}`);
  }
}

/**
 * Отправляет форматированное сообщение, полученное от Gemini.
 * @param {string|number} chatId - ID чата.
 * @param {{text: string, buttons: Array<{text: string, callback_data: string}>}} geminiResponse - Ответ от Gemini.
 */
function sendFormattedText(chatId, geminiResponse) {
  if (!geminiResponse || !geminiResponse.text) {
    Logger.log(`⚠️ ПРЕДУПРЕЖДЕНИЕ: Пустой или некорректный ответ от Gemini для чата ${chatId}. Ответ: ${JSON.stringify(geminiResponse)}`);
    sendText(chatId, "Произошла внутренняя ошибка AI. Попробуйте еще раз позже.");
    return;
  }

  let keyboard = null;
  if (geminiResponse.buttons && geminiResponse.buttons.length > 0) {
    const rows = [];
    for (let i = 0; i < geminiResponse.buttons.length; i += 2) {
        rows.push(geminiResponse.buttons.slice(i, i + 2));
    }
    keyboard = {
      inline_keyboard: rows
    };
  }

  sendText(chatId, geminiResponse.text, keyboard);
}


function editMessageText(chatId, messageId, text) {
  const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!telegramToken) {
    Logger.log("❌ КРИТИЧЕСКАЯ ОШИБКА: TELEGRAM_TOKEN не найден в ScriptProperties!");
    return;
  }

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
    muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    if (responseCode !== 200) {
        Logger.log(`❌ ОШИБКА редактирования сообщения ${messageId} для ${chatId}. Статус: ${responseCode}. Ответ: ${response.getContentText()}`);
    }
  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при редактировании сообщения ${messageId} для ${chatId}: ${e.message}\nStack: ${e.stack || 'N/A'}`);
  }
}

function answerCallbackQuery(callbackQueryId) {
  const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
  if (!telegramToken) {
      Logger.log("❌ КРИТИЧЕСКАЯ ОШИБКА: TELEGRAM_TOKEN не найден в ScriptProperties!");
      return;
  }
  
  const url = `https://api.telegram.org/bot${telegramToken}/answerCallbackQuery`;
  try {
      UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ callback_query_id: callbackQueryId }), muteHttpExceptions: true });
  } catch(e) {
      Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при ответе на callback_query ${callbackQueryId}: ${e.message}\nStack: ${e.stack || 'N/A'}`);
  }
}

// --- Функции управления вебхуком ---

/**
 * Устанавливает вебхук Telegram на указанный URL.
 * @param {string} url - URL веб-приложения.
 * @returns {object} - Результат операции.
 */
function setTelegramWebhook(url) {
  try {
    const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
    if (!telegramToken) {
      throw new Error("TELEGRAM_TOKEN не найден в ScriptProperties!");
    }

    const apiUrl = `https://api.telegram.org/bot${telegramToken}/setWebhook?url=${encodeURIComponent(url)}`;
    const response = UrlFetchApp.fetch(apiUrl, {muteHttpExceptions: true});
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
        Logger.log(`✅ Вебхук успешно установлен: ${JSON.stringify(result)}`);
    } else {
        Logger.log(`❌ ОШИБКА установки вебхука: ${JSON.stringify(result)}`);
    }
    return result;
  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при установке вебхука: ${e.message}\nStack: ${e.stack || 'N/A'}`);
    return { ok: false, description: e.message };
  }
}

/**
 * Удаляет текущий вебхук Telegram.
 * @returns {object} - Результат операции.
 */
function deleteTelegramWebhook() {
  try {
    const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
    if (!telegramToken) {
      throw new Error("TELEGRAM_TOKEN не найден в ScriptProperties!");
    }

    const apiUrl = `https://api.telegram.org/bot${telegramToken}/deleteWebhook`;
    const response = UrlFetchApp.fetch(apiUrl, {muteHttpExceptions: true});
    const result = JSON.parse(response.getContentText());

    if (result.ok) {
        Logger.log(`✅ Вебхук успешно удален: ${JSON.stringify(result)}`);
    } else {
        Logger.log(`❌ ОШИБКА удаления вебхука: ${JSON.stringify(result)}`);
    }
    return result;
  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при удалении вебхука: ${e.message}\nStack: ${e.stack || 'N/A'}`);
    return { ok: false, description: e.message };
  }
}

/**
 * Получает информацию о текущем вебхуке Telegram.
 * @returns {object} - Информация о вебхуке.
 */
function getTelegramWebhookInfo() {
  try {
    const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
    if (!telegramToken) {
      Logger.log("❌ ОШИБКА: TELEGRAM_TOKEN не найден в ScriptProperties при получении информации о вебхуке.");
      return { ok: false, description: "TELEGRAM_TOKEN не найден в ScriptProperties. Пожалуйста, установите его в настройках скрипта." };
    }

    const apiUrl = `https://api.telegram.org/bot${telegramToken}/getWebhookInfo`;
    const response = UrlFetchApp.fetch(apiUrl, {muteHttpExceptions: true});
    const result = JSON.parse(response.getContentText());
    Logger.log(`ℹ️ Информация о вебхуке: ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    const errorMessage = `Ошибка при получении информации о вебхуке: ${e.message}`;
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}\nStack: ${e.stack || 'N/A'}`);
    
    // Проверяем, является ли ошибка проблемой с разрешениями UrlFetchApp
    if (e.message.includes("UrlFetchApp.fetch") && e.message.includes("Required permissions")) {
      return { 
        ok: false, 
        description: `Недостаточно разрешений для выполнения внешних запросов. Пожалуйста, авторизуйте скрипт для 'https://www.googleapis.com/auth/script.external_request'.` 
      };
    }
    return { ok: false, description: errorMessage };
  }
}
