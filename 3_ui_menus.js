/**
 * @file 3_ui_menus.js
 * @description Управление UI, меню и диалогами в Google Sheets и Telegram.
 */

// --- Меню в Google Sheets ---

/**
 * Создает кастомное меню в интерфейсе Google Sheets.
 */
function createCustomMenu() {
  SpreadsheetApp.getUi()
    .createMenu('🤖 SmartPit Бот')
    .addItem('🚀 Управление вебхуком', 'showWebhookManagerDialog')
    .addSeparator()
    .addItem('🔑 Установить токен Telegram', 'setTelegramToken')
    .addItem('🔑 Установить ключ Gemini', 'setGeminiApiKey')
    .addSeparator()
    .addItem('⚙️ Настроить инфраструктуру', 'setupProjectInfrastructure')
    .addToUi();
}

// --- Диалоговые окна в Google Sheets ---

/**
 * Показывает диалоговое окно для управления вебхуком.
 */
function showWebhookManagerDialog() {
  const html = HtmlService.createHtmlOutputFromFile('webhook_manager_dialog')
    .setWidth(700)
    .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, 'Анализатор статуса вебхука');
}

/**
 * Получает статус вебхука, анализирует его и возвращает результат.
 * Реализует отказоустойчивую пошаговую логику.
 */
function getWebhookStatusForDialog() {
  let webAppUrl = '';
  let webhookInfo = {};
  const editorUrl = `https://script.google.com/d/${ScriptApp.getScriptId()}/edit`;

  // --- Этап 1: Запрос к Telegram --- 
  try {
    webAppUrl = ScriptApp.getService().getUrl();
    webhookInfo = getTelegramWebhookInfo(); // Эта функция из 2_telegram_api.js
    if (!webhookInfo.ok) {
      // Если запрос к Telegram неуспешен, создаем ошибку
      throw new Error(webhookInfo.description || 'Неизвестная ошибка Telegram API.');
    }
  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при получении данных от Telegram: ${e.message}`);
    // Немедленно возвращаем типовую ошибку, не доходя до AI
    return {
      ok: false,
      webAppUrl: webAppUrl, 
      editorUrl: editorUrl,
      rawInfo: webhookInfo.result || {},
      analysis: {
        status: "CRITICAL",
        summary: "Ошибка связи с Telegram",
        details: `Не удалось получить данные о вебхуке от Telegram. Это может быть связано с неверным токеном бота. Ошибка: ${e.message}`,
        solution: "1. Убедитесь, что токен Telegram бота указан верно в меню 'Установить токен Telegram'.\n2. Проверьте интернет-соединение и доступность серверов Telegram."
      }
    };
  }

  // --- Этап 2: Запрос к AI --- 
  try {
    const analysis = analyzeWebhookStatus(webhookInfo.result, webAppUrl);
    // Проверяем, не вернул ли AI свою ошибку (например, таймаут или неверный ключ)
    if (analysis.error) {
      throw new Error(analysis.details || 'AI вернул ошибку без деталей.');
    }
    // Успех! Возвращаем полный анализ.
    return {
      ok: true,
      webAppUrl: webAppUrl,
      editorUrl: editorUrl,
      rawInfo: webhookInfo.result,
      analysis: analysis
    };
  } catch (aiError) {
    Logger.log(`⚠️ Ошибка анализа AI: ${aiError.message}`);
    // Возвращаем типовую ошибку AI, но с сырыми данными от Telegram
    return {
      ok: true, // ok:true, потому что основная информация от Telegram получена
      webAppUrl: webAppUrl,
      editorUrl: editorUrl,
      rawInfo: webhookInfo.result,
      analysis: {
        status: "WARNING",
        summary: "AI-анализатор недоступен",
        details: `Данные от Telegram успешно получены, но не удалось получить их анализ от нейросети. Ошибка: ${aiError.message}`,
        solution: "1. Проверьте правильность ключа Gemini API и его активацию в Google Cloud Console.\n2. Проблема может быть временной. Попробуйте обновить через минуту.",
        // Добавляем сырые данные в текстовом виде для пользователя
        rawTelegramData: JSON.stringify(webhookInfo.result, null, 2)
      }
    };
  }
}


/**
 * Устанавливает вебхук из диалогового окна.
 * @param {string} url - URL для установки вебхука.
 * @returns {object} - Результат операции.
 */
function setWebhookFromDialog(url) {
  if (!url || !url.startsWith("https://script.google.com/macros/s/")) {
    return { ok: false, description: "Предоставлен недействительный URL веб-приложения Google Apps Script." };
  }
  return setTelegramWebhook(url);
}

/**
 * Удаляет вебхук из диалогового окна.
 * @returns {object} - Результат операции.
 */
function deleteWebhookFromDialog() {
  return deleteTelegramWebhook();
}

/**
 * Запрашивает и сохраняет токен Telegram.
 */
function setTelegramToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Настройка токена Telegram',
    'Пожалуйста, введите ваш токен Telegram API:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const token = response.getResponseText().trim();
    if (token) {
      PropertiesService.getScriptProperties().setProperty('TELEGRAM_TOKEN', token);
      ui.alert('Токен Telegram успешно сохранен.');
    } else {
      ui.alert('Токен не может быть пустым.');
    }
  }
}

/**
 * Запрашивает и сохраняет ключ Gemini API.
 */
function setGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Настройка Gemini API',
    'Пожалуйста, введите ваш ключ Google Gemini API:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const apiKey = response.getResponseText().trim();
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
      ui.alert('Ключ Gemini API успешно сохранен.');
    } else {
      ui.alert('Ключ API не может быть пустым.');
    }
  }
}
