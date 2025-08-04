/**
 * @file doPost.js
 * @description Единая точка входа для всех запросов от Telegram.
 */

/**
 * Главная функция, обрабатывающая все входящие POST-запросы от Telegram.
 * @param {object} e - Объект события от Google Apps Script.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log("Пустой или некорректный запрос от Telegram.");
      return;
    }

    // Проверяем режим работы. Если ручной, то ничего не делаем.
    if (!isAiMode()) {
      Logger.log("Ручной режим активен. Обработка сообщений пропускается.");
      return;
    }

    const data = JSON.parse(e.postData.contents);
    Logger.log(`Входящие данные: ${JSON.stringify(data)}`);

    // Проверяем, является ли сообщение текстовым и не является ли командой
    if (data.message && data.message.text && data.message.text.startsWith('/')) {
      Logger.log(`Пропускаем команду: ${data.message.text}`);
      return;
    }

    // Проверяем, является ли сообщение текстовым. Если нет, пропускаем.
    if (!data.message || !data.message.text) {
      Logger.log(`Пропускаем нетекстовое сообщение или другой тип обновления: ${JSON.stringify(data)}`);
      return;
    }

    routeMessage(data);

  } catch (err) {
    Logger.log(`КРИТИЧЕСКАЯ ОШИБКА в doPost: ${err.message}\nСтек: ${err.stack}`);
    // Попытка уведомить администратора, если это возможно
    const adminChatId = PropertiesService.getScriptProperties().getProperty('ADMIN_CHAT_ID');
    if (adminChatId) {
      sendText(adminChatId, `Критическая ошибка в боте: ${err.message}`);
    }
  }
}