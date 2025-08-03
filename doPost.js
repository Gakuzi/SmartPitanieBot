/**
 * ОТЛАДОЧНАЯ ТОЧКА ВХОДА V2 (по идее пользователя)
 * 
 * Цель: Немедленно отправить уведомление администратору при любом вызове.
 * Это позволяет проверить, доходит ли сигнал в принципе, и что именно приходит в запросе.
 */
function doPost(e) {
  const scriptProps = PropertiesService.getScriptProperties();
  const adminChatId = scriptProps.getProperty('ADMIN_CHAT_ID');
  const telegramToken = scriptProps.getProperty('TELEGRAM_TOKEN');

  // Если нет админа или токена, мы ничего не можем сделать
  if (!adminChatId || !telegramToken) {
    // Эта ошибка будет видна только в логах, если они сработают
    Logger.log("ADMIN_NOTIFY: FATAL - ADMIN_CHAT_ID или TELEGRAM_TOKEN не найдены!");
    return;
  }

  let message = "Сигнал получен!\n";

  try {
    // Пытаемся получить максимум информации из запроса
    if (e && e.postData && e.postData.contents) {
      message += "Содержимое postData:\n" + e.postData.contents;
    } else if (e) {
      message += "Объект 'e' получен, но postData пуст. Содержимое e: " + JSON.stringify(e);
    } else {
      message += "Объект 'e' не получен (пустой вызов).";
    }
  } catch (err) {
    message += `Критическая ошибка при парсинге запроса: ${err.message}`;
  }

  // Отправляем уведомление администратору
  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const payload = { chat_id: String(adminChatId), text: message };
    const options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload) };
    UrlFetchApp.fetch(url, options);
  } catch (err) {
    // Если даже отправка админу не удалась, мы уже ничего не можем поделать.
    // Эта ошибка будет видна только в логах, если они сработают.
    Logger.log(`ADMIN_NOTIFY: CRITICAL - Не удалось отправить сообщение админу. ${err.message}`);
  }
}