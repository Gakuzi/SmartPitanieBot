/**
 * ЕДИНАЯ ТОЧКА ВХОДА ДЛЯ TELEGRAM
 *
 * Эта функция является единственным обработчиком doPost для веб-приложения.
 * Она читает настройку DEBUG_MODE из ScriptProperties и в зависимости от нее
 * передает управление либо основной логике бота, либо эхо-тесту.
 */
function doPost(e) {
  const scriptProps = PropertiesService.getScriptProperties();
  const debugMode = scriptProps.getProperty('DEBUG_MODE');

  if (debugMode === 'true') {
    handleEchoTest(e);
  } else {
    handleRequest(e);
  }
}

/**
 * Обрабатывает входящий запрос в режиме ЭХО-ТЕСТА.
 */
function handleEchoTest(e) {
  try {
    const telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
    
    // Логируем часть токена для проверки, не раскрывая его целиком
    if (telegramToken) {
      const tokenPart = `${telegramToken.substring(0, 4)}...${telegramToken.slice(-4)}`;
      Logger.log(`ECHO_TEST: Используется токен, начинающийся и заканчивающийся на: ${tokenPart}`);
    } else {
      Logger.log("ECHO_TEST: FATAL - TELEGRAM_TOKEN не найден в ScriptProperties!");
      return;
    }

    const data = JSON.parse(e.postData.contents);
    const chatId = data.message.chat.id;
    const text = data.message.text;

    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const payload = { chat_id: String(chatId), text: `Эхо: ${text}` };
    const options = { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload) };

    UrlFetchApp.fetch(url, options);

  } catch (err) {
    Logger.log(`ECHO_TEST: CRITICAL - ${err.message}`);
  }
}

/**
 * Обрабатывает входящий запрос в основном (боевом) режиме.
 */
function handleRequest(e) {
  let chatId, data;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log("Пустой запрос от Telegram.");
      return;
    }
    data = JSON.parse(e.postData.contents);

    if (data.callback_query) {
      handleCallbackQuery(data.callback_query);
      return;
    }

    if (data.message && data.message.chat && data.message.text) {
      chatId = data.message.chat.id;
      const msgRaw = data.message.text.trim();
      const msg = msgRaw.toLowerCase();
      const session = getSession(chatId);

      if (session && session.awaitingInput && isCommand(msg)) {
        clearSession(chatId);
        handleCommand(chatId, msg, msgRaw);
      } else if (session && session.awaitingInput) {
        handleUserInput(chatId, msgRaw, session);
      } else {
        handleCommand(chatId, msg, msgRaw);
      }
      return;
    }

    Logger.log("Неподдерживаемый тип запроса: " + e.postData.contents);

  } catch (err) {
    chatId = (data && data.message) ? data.message.chat.id : (data && data.callback_query) ? data.callback_query.from.id : null;
    if (chatId) {
      sendText(chatId, `--- КРИТИЧЕСКАЯ ОШИБКА ---\nСообщение: ${err.message}\nСтек: ${err.stack}`);
    }
    Logger.log(`Критическая ошибка в doPost: ${err.message} ${err.stack}`);
  }
}
