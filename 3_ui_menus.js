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
    .addItem('📂 Настроить локальный путь', 'setLocalProjectPath')
    .addSeparator()
    .addItem('⚙️ Настроить инфраструктуру', 'setupProjectInfrastructure')
    .addToUi();
}

// --- Диалоговые окна в Google Sheets ---

/**
 * Логирует сообщение от клиента для диагностики.
 * @param {string} message - Сообщение от клиента.
 */
function logFromClient(message) {
    Logger.log(`[CLIENT LOG] ${message}`);
}

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
 * Получает базовую информацию о вебхуке.
 * @returns {object} - Объект с базовой информацией.
 */
function getBasicWebhookInfo() {
  let webAppUrl = '';
  let webhookInfo = {};
  const editorUrl = `https://script.google.com/d/${ScriptApp.getScriptId()}/edit`;
  const localPath = PropertiesService.getScriptProperties().getProperty('LOCAL_PROJECT_PATH');

  try {
    webAppUrl = ScriptApp.getService().getUrl();
    webhookInfo = getTelegramWebhookInfo();
    if (!webhookInfo.ok) {
      throw new Error(webhookInfo.description || 'Неизвестная ошибка Telegram API.');
    }
    return {
      ok: true,
      webAppUrl: webAppUrl,
      editorUrl: editorUrl,
      localPath: localPath,
      rawInfo: webhookInfo.result || {},
    };
  } catch (e) {
    const errorMessage = `Ошибка при получении базовой информации: ${e.message}`;
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}\nStack: ${e.stack || 'N/A'}`);
    return {
      ok: false,
      editorUrl: editorUrl,
      localPath: localPath,
      error: errorMessage
    };
  }
}

/**
 * Запускает анализ статуса вебхука с помощью AI.
 * @param {object} basicInfo - Объект с базовой информацией о вебхуке.
 * @returns {object} - Результат анализа от AI.
 */
function getAiAnalysis(basicInfo) {
  try {
    const analysis = analyzeWebhookStatus(basicInfo.rawInfo, basicInfo.webAppUrl);
    if (analysis.error) {
      throw new Error(`AI вернул ошибку: ${analysis.error}. Детали: ${analysis.details}`);
    }
    return { ok: true, analysis: analysis };
  } catch (aiError) {
    const errorMessage = `Ошибка анализа AI: ${aiError.message}`;
    Logger.log(`⚠️ ПРЕДУПРЕЖДЕНИЕ: ${errorMessage}\nStack: ${aiError.stack || 'N/A'}`);
    return {
      ok: false,
      analysis: {
        status: "WARNING",
        summary: "AI-анализатор недоступен",
        details: `Данные от Telegram успешно получены, но не удалось получить их анализ от нейросети. Ошибка: ${aiError.message}`,
        solution: "1. Проверьте правильность ключа Gemini API и его активацию в Google Cloud Console.\n2. Проблема может быть временной. Попробуйте обновить через минуту.",
        rawTelegramData: JSON.stringify(basicInfo.rawInfo, null, 2)
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
    const errorDesc = "Предоставлен недействительный URL веб-приложения Google Apps Script.";
    Logger.log(`❌ Ошибка установки вебхука: ${errorDesc} URL: ${url}`);
    return { ok: false, description: errorDesc };
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
      Logger.log('✅ Токен Telegram сохранен.');
    } else {
      ui.alert('Токен не может быть пустым.');
      Logger.log('⚠️ Попытка сохранить пустой токен Telegram.');
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
      Logger.log('✅ Ключ Gemini API сохранен.');
    } else {
      ui.alert('Ключ API не может быть пустым.');
      Logger.log('⚠️ Попытка сохранить пустой ключ Gemini API.');
    }
  }
}

/**
 * Запрашивает и сохраняет локальный путь к проекту.
 */
function setLocalProjectPath() {
  const ui = SpreadsheetApp.getUi();
  const scriptProps = PropertiesService.getScriptProperties();
  const currentPath = scriptProps.getProperty('LOCAL_PROJECT_PATH');

  const response = ui.prompt(
    'Настройка локального пути проекта',
    `Введите абсолютный путь к папке вашего проекта на компьютере. (Текущий: ${currentPath || 'не задан'})`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const path = response.getResponseText().trim();
    if (path) {
      scriptProps.setProperty('LOCAL_PROJECT_PATH', path);
      ui.alert('Локальный путь к проекту успешно сохранен.');
      Logger.log(`✅ Локальный путь сохранен: ${path}`);
    } else {
      scriptProps.deleteProperty('LOCAL_PROJECT_PATH');
      ui.alert('Локальный путь удален.');
      Logger.log('🗑️ Локальный путь удален.');
    }
  }
}
