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
    .setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(html, 'Управление вебхуком Telegram');
}

/**
 * Получает статус вебхука и URL веб-приложения для диалогового окна.
 * @returns {object} - Объект с информацией о статусе и URL.
 */
function getWebhookStatusForDialog() {
  const webAppUrl = ScriptApp.getService().getUrl();
  const webhookInfo = getTelegramWebhookInfo();
  return { ...webhookInfo, webAppUrl };
}

/**
 * Устанавливает вебхук из диалогового окна.
 * @param {string} url - URL для установки вебхука.
 * @returns {object} - Результат операции.
 */
function setWebhookFromDialog(url) {
  if (!url) {
    return { ok: false, description: "URL не был предоставлен." };
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