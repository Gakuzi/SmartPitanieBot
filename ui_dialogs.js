/**
 * Открывает HTML-диалог для управления вебхуком Telegram.
 */
function showWebhookManagerDialog() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('webhook_manager_dialog')
      .setWidth(700)
      .setHeight(500)
      .setSandboxMode(HtmlService.SandboxMode.DEFAULT);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Управление вебхуком Telegram');
}

/**
 * Получает информацию о вебхуке и URL веб-приложения для отображения в диалоге.
 * Вызывается из HTML-диалога.
 * @returns {object} Объект с информацией о вебхуке и URL веб-приложения.
 */
function getWebhookStatusForDialog() {
  const webhookInfo = getTelegramWebhookInfo(); // Функция из 2_telegram_api.js
  const webAppUrl = ScriptApp.getService().getUrl();
  return { ...webhookInfo, webAppUrl: webAppUrl };
}

/**
 * Устанавливает вебхук Telegram на URL текущего веб-приложения.
 * Вызывается из HTML-диалога.
 * @returns {object} Результат операции установки вебхука.
 */
function setWebhookFromDialog() {
  const webAppUrl = ScriptApp.getService().getUrl();
  return setTelegramWebhook(webAppUrl); // Функция из 2_telegram_api.js
}

/**
 * Удаляет текущий вебхук Telegram.
 * Вызывается из HTML-диалога.
 * @returns {object} Результат операции удаления вебхука.
 */
function deleteWebhookFromDialog() {
  return deleteTelegramWebhook(); // Функция из 2_telegram_api.js
}
