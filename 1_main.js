// --- Основная функция обработки входящих запросов ---
function doPost(e) {
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

      if (session && session.awaitingInput) {
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

// --- Обработка нажатий на встроенные кнопки ---
function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.from.id;
  const messageId = callbackQuery.message.message_id;
  const [action, value] = callbackQuery.data.split(':');

  answerCallbackQuery(callbackQuery.id);

  if (action === 'setGoal') {
    const userData = saveUserParam(chatId, 'goal', value);
    editMessageText(chatId, messageId, `Цель сохранена: *${value}*`);
    
    // Если все данные для расчета есть, запускаем его
    if (userData.weight && userData.goal) {
        triggerNutritionCalculation(chatId, userData);
    }
    sendMenu(chatId);
  }
}

// --- Обработка команд ---
function handleCommand(chatId, msg, msgRaw) {
  switch (msg) {
    case '/start':
      return sendStart(chatId);
    case '⚙️ настройки':
      return sendSettingsMenu(chatId);
    case '⬅️ назад':
      return sendMenu(chatId);
    case '🥅 установить цель':
      return sendGoalOptions(chatId);
    case '⚖️ ввести параметры':
      startSession(chatId, 'awaitParams');
      return sendText(chatId, 'Введи через запятую: вес(кг), рост(см), возраст, пол(m/f), уровень активности(низкий/средний/высокий)');
    case '🕒 установить время уведомлений':
      startSession(chatId, 'awaitNotifyTime');
      return sendText(chatId, 'Введите время уведомлений в формате ЧЧ:ММ (например, 07:30)');
    case '🍽 показать меню':
      return sendTodayMenu(chatId);
    case '🛒 список покупок':
      return sendShoppingList(chatId);
    case '👨‍🍳 что готовим?':
      return sendCookingList(chatId);
    case '🔄 замена продукта':
      return sendText(chatId, 'Напиши, например: 🔄 замена творог');
    default:
      if (msg.startsWith('🔄 замена')) return sendSubstitute(chatId, msgRaw);
      return sendMenu(chatId);
  }
}

// --- Сессии для пользовательского ввода ---
function handleUserInput(chatId, input, session) {
  switch (session.awaitingInput) {
    case 'awaitParams':
      const parts = input.split(',').map(x => x.trim());
      if (parts.length !== 5) {
        sendText(chatId, 'Ошибка формата. Введи: вес, рост, возраст, пол(m/f), активность(низкий/средний/высокий)');
        return;
      }
      const [weight, height, age, sex, activity] = parts;
      if (isNaN(weight) || isNaN(height) || isNaN(age) || !['m', 'f'].includes(sex.toLowerCase()) || !['низкий', 'средний', 'высокий'].includes(activity.toLowerCase())) {
        sendText(chatId, 'Проверь данные. Пример: 70, 175, 40, m, средний');
        return;
      }
      // Сохраняем все параметры
      let userData = saveUserParam(chatId, 'weight', weight);
      userData = saveUserParam(chatId, 'height', height);
      userData = saveUserParam(chatId, 'age', age);
      userData = saveUserParam(chatId, 'sex', sex.toLowerCase());
      userData = saveUserParam(chatId, 'activity', activity.toLowerCase());
      
      clearSession(chatId);
      sendText(chatId, 'Параметры сохранены.');

      // Если все данные для расчета есть, запускаем его
      if (userData.weight && userData.goal) {
          triggerNutritionCalculation(chatId, userData);
      }
      sendMenu(chatId);
      break;

    case 'awaitNotifyTime':
      if (validateTimeFormat(input)) {
        saveUserParam(chatId, 'notifyTime', input);
        clearSession(chatId);
        sendText(chatId, `Время уведомлений установлено на *${input}*`, getMenu(chatId));
      } else {
        sendText(chatId, 'Неверный формат времени. Введи в формате ЧЧ:ММ');
      }
      break;

    default:
      clearSession(chatId);
      sendText(chatId, 'Произошла небольшая ошибка. Ваше предыдущее действие было сброшено. Пожалуйста, выберите команду из меню еще раз.', getMenu(chatId));
      break;
  }
}
