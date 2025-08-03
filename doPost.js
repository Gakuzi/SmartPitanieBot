/**
 * ОТЛАДОЧНАЯ ТОЧКА ВХОДА V2 (по идее пользователя) - УЛУЧШЕННАЯ ВЕРСИЯ
 * 
 * Цель: Немедленно отправить уведомление администратору при любом вызове,
 * максимально устойчиво к некорректным входящим данным.
 */
function doPost(e) {
  const scriptProps = PropertiesService.getScriptProperties();
  const adminChatId = scriptProps.getProperty('ADMIN_CHAT_ID');
  const telegramToken = scriptProps.getProperty('TELEGRAM_TOKEN');

  // Если нет админа или токена, мы не можем отправить уведомление.
  // В этом случае, просто логируем и выходим.
  if (!adminChatId || !telegramToken) {
    Logger.log("ADMIN_NOTIFY: FATAL - ADMIN_CHAT_ID или TELEGRAM_TOKEN не найдены в ScriptProperties. Невозможно отправить уведомление.");
    return;
  }

  let message = "Сигнал получен!\n";
  let rawData = "Не удалось получить postData.contents.";

  try {
    // Пытаемся безопасно получить содержимое postData
    if (e && e.postData && e.postData.contents) {
      rawData = e.postData.contents;
      message += "Содержимое postData:\n" + rawData;
    } else if (e) {
      // Если postData.contents нет, но объект e существует, пытаемся его сериализовать
      rawData = JSON.stringify(e, null, 2); // Красивое форматирование JSON
      message += "Объект 'e' получен, но postData.contents пуст. Содержимое e:\n" + rawData;
    } else {
      // Если объект e вообще не получен
      message += "Объект 'e' не получен (пустой вызов).";
    }
  } catch (err) {
    // Если даже при попытке сериализации e произошла ошибка
    message += `Критическая ошибка при обработке входящего запроса (e): ${err.message}\nСтек: ${err.stack}`;
    Logger.log(`ADMIN_NOTIFY: CRITICAL - Ошибка при обработке входящего запроса (e): ${err.message} ${err.stack}`);
  }

  // Отправляем уведомление администратору
  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const payload = { 
      chat_id: String(adminChatId), 
      text: message,
      parse_mode: 'Markdown', // Используем Markdown для форматирования
      disable_web_page_preview: true // Отключаем превью ссылок
    };
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true // Важно, чтобы видеть полные ответы об ошибках
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode !== 200) {
      Logger.log(`ADMIN_NOTIFY: ERROR - Не удалось отправить сообщение админу. Статус: ${responseCode}. Ответ: ${responseBody}`);
    } else {
      Logger.log(`ADMIN_NOTIFY: Уведомление админу успешно отправлено. Содержимое: ${message.substring(0, 100)}...`);
    }

  } catch (err) {
    // Если даже отправка админу не удалась, мы уже ничего не можем поделать.
    // Эта ошибка будет видна только в логах Google Apps Script.
    Logger.log(`ADMIN_NOTIFY: CRITICAL - Не удалось отправить сообщение админу (UrlFetchApp сбой): ${err.message}\nСтек: ${err.stack}`);
  }
}