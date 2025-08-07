const ALL_COMMANDS = [
  '/start', '🍽 показать меню', '🛒 список покупок', '⚙️ настройки', '🔄 замена продукта', '👨‍🍳 что готовим?'
];

function isCommand(msg) {
  return ALL_COMMANDS.includes((msg || '').toLowerCase());
}

/**
 * Главная функция обработки входящих обновлений от Telegram.
 * @param {object} data - Полный объект данных от Telegram.
 */
function handleIncomingUpdate(data) {
  try {
    if (data.callback_query) {
      handleCallbackQuery(data.callback_query);
      return;
    }

    if (data.message) {
      const message = data.message;
      const chatId = message.chat.id;
      const text = message.text || '';
      const msgRaw = text;

      Logger.log(`Получено сообщение от ${chatId}: ${text}`);

      const session = getSession(chatId);
      if (session.awaitingInput) {
        handleUserInput(chatId, text, session);
        return;
      }

      if (isCommand(text)) {
        handleCommand(chatId, text, msgRaw, message);
        return;
      }

      if (text && text.trim()) {
        if (isAiModeEnabled()) {
          handleFreeText(chatId, text);
        } else {
          sendText(chatId, "Я не понимаю эту команду. Пожалуйста, используйте кнопки меню.", getMenu(chatId));
        }
        return;
      }

      sendText(chatId, "Пожалуйста, используйте кнопки меню для навигации.", getMenu(chatId));
    }

  } catch (err) {
    Logger.log(`ОШИБКА в handleIncomingUpdate: ${err.message}\nСтек: ${err.stack}`);
  }
}

// --- Обработка нажатий на встроенные кнопки ---
function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.from.id;
  const messageId = callbackQuery.message.message_id;
  const [action, value] = String(callbackQuery.data || '').split(':');
  const session = getSession(chatId);

  answerCallbackQuery(callbackQuery.id);

  if (action === 'setGoal') {
    const userData = saveUserParam(chatId, 'goal', value);
    editMessageText(chatId, messageId, `Цель сохранена: *${value}*`);
    if (isAiMode() && isProfileComplete(userData)) {
      triggerNutritionCalculation(chatId, userData);
    }
    sendMenu(chatId);
    return;
  }

  if (action === 'set_sex') {
    const gender = value === 'm' ? 'male' : 'female';
    editMessageText(chatId, messageId, `Пол сохранен: *${gender === 'male' ? 'Мужской' : 'Женский'}*`);
    session.data.gender = gender;
    updateSession(chatId, 'awaiting_activity', session.data);
    sendActivityOptions(chatId);
    return;
  }

  if (action === 'set_activity') {
    editMessageText(chatId, messageId, `Активность сохранена: *${value}*`);
    session.data.activityLevel = value;
    let userData = saveUserParam(chatId, 'weight', session.data.weight);
    userData = saveUserParam(chatId, 'height', session.data.height);
    userData = saveUserParam(chatId, 'age', session.data.age);
    userData = saveUserParam(chatId, 'gender', session.data.gender);
    userData = saveUserParam(chatId, 'activityLevel', session.data.activityLevel);

    clearSession(chatId);
    sendText(chatId, 'Параметры сохранены.');

    if (isAiMode() && isProfileComplete(userData)) {
      triggerNutritionCalculation(chatId, userData);
    }
    sendMenu(chatId);
    return;
  }
}

// --- Обработка команд ---
function handleCommand(chatId, msg, msgRaw, messageData) {
  const normalized = (msg || '').toLowerCase();
  if (msg === '/start') {
    onboardUser(chatId, messageData.from);
    const userFirstName = messageData.from.first_name || messageData.from.username || 'пользователь';
    startSetupDialog(chatId, userFirstName);
    sendMenu(chatId);
    return;
  }

  switch (normalized) {
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
      if (isAiMode()) {
        const userData = getUserData(chatId);
        if (isProfileComplete(userData)) {
          triggerNutritionCalculation(chatId, userData);
          generateMenu(chatId);
        } else {
          sendText(chatId, "Пожалуйста, сначала завершите настройку профиля (пол, возраст, рост, вес, цель, активность). Откройте ⚙️ Настройки.");
        }
      } else {
        sendTodayMenu(chatId);
      }
      return;
    case '🛒 список покупок':
      return sendShoppingList(chatId);
    case '👨‍🍳 что готовим?':
      return sendCookingList(chatId);
    case '🔄 замена продукта':
      return sendText(chatId, 'Напиши, например: 🔄 замена творог');
    case '🗂 менеджер проекта':
      return sendText(chatId, 'Откройте менеджер проекта: ' + ScriptApp.getService().getUrl() + '?page=project-manager');
    case '📄 техническое задание':
      return sendText(chatId, 'Откройте ТЗ: ' + ScriptApp.getService().getUrl() + '?page=idea');
    default:
      if (normalized.startsWith('🔄 замена')) return sendSubstitute(chatId, msgRaw);
      return sendMenu(chatId);
  }
}

// --- Сессии для пользовательского ввода ---
function handleUserInput(chatId, input, session) {
  Logger.log(`handleUserInput: Вызвана для chatId: ${chatId}, input: ${input}, awaitingInput: ${session.awaitingInput}`);
  if (session.awaitingInput) {
    switch (session.awaitingInput) {
      case 'awaiting_name_confirmation':
        const lowerInput = String(input || '').toLowerCase();
        let userNameToSave;
        if (lowerInput.includes('да') || lowerInput.includes('верно') || lowerInput.includes('yes')) {
          const telegramUser = session.data.telegramUser;
          userNameToSave = telegramUser.first_name || telegramUser.username || 'Пользователь';
          sendText(chatId, `Отлично, ${userNameToSave}!`);
        } else {
          userNameToSave = input;
          sendText(chatId, `Хорошо, буду обращаться к тебе как ${userNameToSave}.`);
        }
        saveUserParam(chatId, 'name', userNameToSave);
        updateSession(chatId, 'awaiting_weight', session.data);
        sendText(chatId, 'Теперь введите ваш вес в килограммах (например, 70):');
        break;

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
        if (!isAiModeEnabled()) {
          sendText(chatId, "🤖 AI-ассистент в данный момент отключен администратором. Пожалуйста, воспользуйтесь командами из меню.", getMenu(chatId));
          clearSession(chatId);
          return;
        }
        const prompt = `Ты — AI-диетолог. Пользователь ответил на твое первое приветствие. Его ответ: "${input}". Продолжи диалог, задай уточняющие вопросы, чтобы собрать информацию для составления меню (пищевые привычки, аллергии, предпочтения). Будь кратким и веди диалог шаг за шагом. В конце, когда соберешь достаточно информации, скажи: "Отлично, я собрал всю информацию! Теперь мы можем перейти к расчету вашего КБЖУ и созданию меню."`;
        const aiResponse = callGeminiStructured(prompt, false);
        if (aiResponse && aiResponse.text) {
          sendText(chatId, aiResponse.text);
          if (aiResponse.text.indexOf("Отлично, я собрал всю информацию") !== -1) {
            clearSession(chatId);
            sendMenu(chatId);
          } else {
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
  } else {
    sendText(chatId, "Я не распознал вашу команду. Пожалуйста, воспользуйтесь кнопками меню.", getMenu(chatId));
  }
}

function onboardUser(chatId, from) {
  const scriptProps = PropertiesService.getScriptProperties();
  const userFolderId = scriptProps.getProperty(String(chatId));
  if (userFolderId) return;

  const rootFolder = DriveApp.getFolderById(scriptProps.getProperty('ROOT_FOLDER_ID'));
  const userFolder = rootFolder.createFolder(String(chatId));
  const userSpreadsheet = SpreadsheetApp.create(`${from.first_name || 'user'}_${chatId}`);
  const userFile = DriveApp.getFileById(userSpreadsheet.getId());
  userFolder.addFile(userFile);
  DriveApp.getRootFolder().removeFile(userFile);

  scriptProps.setProperty(String(chatId), userFolder.getId());
  saveUserParam(chatId, 'sheetId', userSpreadsheet.getId());

  const usersSsId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
  if (usersSsId) {
    const usersSs = SpreadsheetApp.openById(usersSsId);
    const usersSheet = usersSs.getSheetByName('Пользователи');
    usersSheet.appendRow([
      from.id,
      from.is_bot,
      from.first_name || '',
      from.last_name || '',
      from.username || '',
      from.language_code || '',
      from.is_premium || false,
      new Date(),
      `=HYPERLINK("${userFolder.getUrl()}"; "${userFolder.getId()}")`,
      `=HYPERLINK("${userSpreadsheet.getUrl()}"; "${userSpreadsheet.getId()}")`,
      'Стандарт',
      false
    ]);
  }
}

// --- Session Management ---
function getSession(chatId) {
  const userProps = PropertiesService.getUserProperties();
  const session = userProps.getProperty(`session_${chatId}`);
  return session ? JSON.parse(session) : {};
}

function startSession(chatId, awaitingInput, data = {}) {
  const session = { awaitingInput, data };
  const userProps = PropertiesService.getUserProperties();
  userProps.setProperty(`session_${chatId}`, JSON.stringify(session));
}

function updateSession(chatId, awaitingInput, data) {
  startSession(chatId, awaitingInput, data);
}

function clearSession(chatId) {
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty(`session_${chatId}`);
}
