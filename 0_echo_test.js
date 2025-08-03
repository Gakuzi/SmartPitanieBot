/**
 * ФАЙЛ ДЛЯ ЭХО-ТЕСТИРОВАНИЯ
 * 
 * Назначение: Проверить базовую работоспособность связки Telegram <-> Google Apps Script.
 * 
 * Как использовать:
 * 1. Откройте редактор Google Apps Script.
 * 2. Перейдите в "Развертывание" -> "Управление развертываниями".
 * 3. Выберите ваше активное развертывание и нажмите на значок карандаша (Редактировать).
 * 4. В поле "Точка входа" (Entry point) измените функцию с `doPost` на `doPost_ECHO_TEST`.
 * 5. Сохраните изменения.
 * 6. Отправьте любое сообщение боту. Он должен ответить вам тем же сообщением с припиской "Эхо: ".
 * 
 * Если эхо работает - проблема в основном коде. Если нет - проблема в токене или настройках вебхука.
 */
function doPost_ECHO_TEST(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const chatId = data.message.chat.id;
    const text = data.message.text;

    const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
    if (!telegramToken) {
      // Если токена нет, мы не можем даже отправить сообщение об ошибке, только логировать.
      Logger.log("ECHO_TEST: FATAL - TELEGRAM_TOKEN не найден в ScriptProperties!");
      return;
    }

    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const payload = {
      chat_id: String(chatId),
      text: `Эхо: ${text}`,
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() !== 200) {
      Logger.log(`ECHO_TEST: ERROR - Не удалось отправить сообщение. Код: ${response.getResponseCode()}. Ответ: ${response.getContentText()}`);
    }

  } catch (err) {
    Logger.log(`ECHO_TEST: CRITICAL - ${err.message}`);
  }
}
