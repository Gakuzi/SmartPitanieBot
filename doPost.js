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

    const data = JSON.parse(e.postData.contents);
    Logger.log(`Входящие данные: ${JSON.stringify(data)}`);

    if (data.callback_query) {
      handleCallbackQuery(data.callback_query);
    } else if (data.message) {
      handleMessage(data.message);
    } else {
      Logger.log("Неподдерживаемый тип данных.");
    }
  } catch (err) {
    Logger.log(`КРИТИЧЕСКАЯ ОШИБКА в doPost: ${err.message}\nСтек: ${err.stack}`);
    // Попытка уведомить администратора, если это возможно
    const adminChatId = PropertiesService.getScriptProperties().getProperty('ADMIN_CHAT_ID');
    if (adminChatId) {
      sendText(adminChatId, `Критическая ошибка в боте: ${err.message}`);
    }
  }
}

/**
 * Обрабатывает входящие сообщения.
 * @param {object} message - Объект message от Telegram.
 */
function handleMessage(message) {
  const chatId = message.chat.id;
  const userName = message.from.first_name || 'Пользователь';
  const text = message.text ? message.text.trim() : '';

  // Получаем текущее состояние пользователя
  const userState = getUserState(chatId);

  // Если пользователь в процессе настройки, передаем управление диалоговому менеджеру
  if (userState === STATES.AWAITING_SETUP) {
    continueSetupDialog(chatId, userName, text);
    return;
  }

  // Обработка команд
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();
    switch (command) {
      case '/start':
      case '/setup':
        startSetupDialog(chatId, userName);
        break;
      // Другие команды можно добавить здесь
      // case '/meal': ...
      default:
        sendText(chatId, "Неизвестная команда. Используйте /setup для начала работы.");
        break;
    }
  } else {
    // Обработка обычного текста, если пользователь не в каком-то особом состоянии
    sendText(chatId, "Я вас не понимаю. Пожалуйста, используйте команду /setup, чтобы начать настройку вашего профиля.");
  }
}

/**
 * Обрабатывает нажатия на inline-кнопки.
 * @param {object} callbackQuery - Объект callback_query от Telegram.
 */
function handleCallbackQuery(callbackQuery) {
  const callbackQueryId = callbackQuery.id;
  const chatId = callbackQuery.from.id;
  const userName = callbackQuery.from.first_name || 'Пользователь';
  const data = callbackQuery.data;
  const messageId = callbackQuery.message.message_id;

  // Отвечаем на запрос, чтобы убрать "часики" с кнопки
  answerCallbackQuery(callbackQueryId);

  // Получаем состояние пользователя
  const userState = getUserState(chatId);

  // Логика для отмены
  if (data === 'cancel_setup') {
    setUserState(chatId, STATES.IDLE); // Сбрасываем состояние
    editMessageText(chatId, messageId, "Настройка отменена. Вы можете вернуться к ней в любой момент командой /setup.");
    return;
  }

  // Если пользователь в процессе настройки, продолжаем диалог
  if (userState === STATES.AWAITING_SETUP || data === 'start_setup') {
    // Если это начало диалога, меняем состояние
    if (data === 'start_setup') {
        setUserState(chatId, STATES.AWAITING_SETUP);
    }
    // Удаляем старое сообщение с кнопками, чтобы избежать путаницы
    editMessageText(chatId, messageId, `Отлично, продолжаем...`);
    continueSetupDialog(chatId, userName, data);
  } else {
    // Обработка других callback'ов, если они появятся в будущем
    Logger.log(`Получен callback "${data}" от пользователя ${chatId} вне состояния настройки.`);
    editMessageText(chatId, messageId, "Произошла ошибка состояния. Пожалуйста, начните заново с команды /setup.");
  }
}