const ALL_COMMANDS = [
  '/start', '⚙️ настройки', '⬅️ назад', '🥅 установить цель', '⚖️ ввести параметры',
  '🕒 установить время уведомлений', '🍽 показать меню', '🛒 список покупок', '👨‍🍳 что готовим?', '🔄 замена продукта'
];

function isCommand(msg) {
  return ALL_COMMANDS.includes(msg.toLowerCase());
}

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

      // Проверяем, не является ли сообщение новой командой, прерывающей текущий ввод
      if (session && session.awaitingInput && isCommand(msg)) {
        clearSession(chatId);
        handleCommand(chatId, msg, msgRaw); // Выполняем новую команду
      } else if (session && session.awaitingInput) {
        handleUserInput(chatId, msgRaw, session); // Продолжаем ввод
      } else {
        handleCommand(chatId, msg, msgRaw); // Обычная обработка команд
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
  const session = getSession(chatId);

  answerCallbackQuery(callbackQuery.id);

  if (action === 'setGoal') {
    const userData = saveUserParam(chatId, 'goal', value);
    editMessageText(chatId, messageId, `Цель сохранена: *${value}*`);
    if (userData.weight && userData.goal) {
        triggerNutritionCalculation(chatId, userData);
    }
    sendMenu(chatId);
    return;
  }

  if (action === 'set_sex') {
    editMessageText(chatId, messageId, `Пол сохранен: *${value === 'm' ? 'Мужской' : 'Женский'}*`);
    session.data.sex = value;
    updateSession(chatId, 'awaiting_activity', session.data);
    sendActivityOptions(chatId);
    return;
  }

  if (action === 'set_activity') {
    editMessageText(chatId, messageId, `Активность сохранена: *${value}*`);
    session.data.activity = value;
    // Все данные собраны, сохраняем и считаем
    let userData = saveUserParam(chatId, 'weight', session.data.weight);
    userData = saveUserParam(chatId, 'height', session.data.height);
    userData = saveUserParam(chatId, 'age', session.data.age);
    userData = saveUserParam(chatId, 'sex', session.data.sex);
    userData = saveUserParam(chatId, 'activity', session.data.activity);
    
    clearSession(chatId);
    sendText(chatId, 'Параметры сохранены.');

    if (userData.weight && userData.goal) {
        triggerNutritionCalculation(chatId, userData);
    }
    sendMenu(chatId);
    return;
  }
}

// --- Обработка команд ---
function handleCommand(chatId, msg, msgRaw) {
  if (msg === '/start') {
    onboardUser(chatId); // Создаем инфраструктуру, если ее нет
    
    // Запускаем диалог с AI для знакомства
    const prompt = "Ты — дружелюбный AI-диетолог в телеграм-боте \"СмартЕда\". Твоя задача — познакомиться с новым пользователем. Задай ему один-два приветственных вопроса, чтобы начать диалог. Например, спроси, как его зовут и какой у него опыт в подсчете калорий. Говори кратко и по делу.";
    const aiResponse = callGemini(prompt);
    
    if (aiResponse) {
      startSession(chatId, 'awaiting_intro_response');
      sendText(chatId, aiResponse);
    } else {
      sendText(chatId, "Здравствуйте! Я ваш помощник по питанию. К сожалению, мой AI-модуль сейчас не в сети. Давайте пока воспользуемся стандартными функциями.", getMenu(chatId));
    }
    return;
  }

  switch (msg) {
    case '⚙️ настройки':
      return sendSettingsMenu(chatId);
    case '⬅️ назад':
      return sendMenu(chatId);
    case '🥅 установить цель':
      return sendGoalOptions(chatId);
    case '⚖️ ввести параметры':
      startSession(chatId, 'awaiting_weight');
      return sendText(chatId, 'Введите ваш вес в килограммах (например, 70):');
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
    case 'awaiting_weight':
      if (isNaN(input) || input <= 0) {
        sendText(chatId, 'Неверный формат. Введите вес числом, например: 70');
        return;
      }
      session.data.weight = Number(input);
      updateSession(chatId, 'awaiting_height', session.data);
      sendText(chatId, 'Отлично! Теперь введите ваш рост в сантиметрах (например, 175):');
      break;

    case 'awaiting_height':
      if (isNaN(input) || input <= 0) {
        sendText(chatId, 'Неверный формат. Введите рост числом, например: 175');
        return;
      }
      session.data.height = Number(input);
      updateSession(chatId, 'awaiting_age', session.data);
      sendText(chatId, 'Принято. Сколько вам полных лет?');
      break;

    case 'awaiting_age':
      if (isNaN(input) || input <= 0) {
        sendText(chatId, 'Неверный формат. Введите возраст числом, например: 30');
        return;
      }
      session.data.age = Number(input);
      updateSession(chatId, 'awaiting_sex', session.data);
      sendSexOptions(chatId);
      break;

    case 'awaiting_intro_response':
      // Просто передаем ответ пользователя AI для продолжения диалога
      const prompt = `Ты — AI-диетолог. Пользователь ответил на твое первое приветствие. Его ответ: "${input}". Продолжи диалог, задай уточняющие вопросы, чтобы собрать информацию для составления меню (пищевые привычки, аллергии, предпочтения). Будь кратким и веди диалог шаг за шагом. В конце, когда соберешь достаточно информации, скажи: "Отлично, я собрал всю информацию! Теперь мы можем перейти к расчету вашего КБЖУ и созданию меню."`;
      const aiResponse = callGemini(prompt);
      if (aiResponse) {
        sendText(chatId, aiResponse);
        // Если AI решил, что информации достаточно, можно переходить к следующему шагу
        if (aiResponse.includes("Отлично, я собрал всю информацию")) {
          clearSession(chatId);
          // Здесь в будущем будет запуск расчета КБЖУ и генерации меню
          sendMenu(chatId);
        } else {
          // Продолжаем диалог
          startSession(chatId, 'awaiting_intro_response');
        }
      } else {
        sendText(chatId, "Произошла ошибка AI. Попробуйте позже.", getMenu(chatId));
        clearSession(chatId);
      }
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