const ALL_COMMANDS = [
  '/start', '🍽 показать меню', '🛒 список покупок', '⚙️ настройки', '🔄 замена продукта'
];

function isCommand(msg) {
  return ALL_COMMANDS.includes(msg.toLowerCase());
}



// --- Обработка нажатий на встроенные кнопки ---
/**
 * Обработка callback query
 */
function handleCallbackQuery(callbackQuery) {
  const data = callbackQuery.data;
  
  // Проверяем админские callback'ы
  if (data.startsWith('admin_')) {
    handleAdminCallback(callbackQuery);
    return;
  }
  
  // Обработка обычных callback'ов
  switch (data) {
    case 'back_to_main':
      const mainMenu = getMainMenu(callbackQuery.from.id);
      editMessageText(callbackQuery.message.chat.id, callbackQuery.message.message_id, mainMenu.text, mainMenu.reply_markup);
      break;
      
    case 'menu_nutrition':
      handleNutritionMenu(callbackQuery.from.id);
      break;
      
    case 'shopping_list':
      handleShoppingList(callbackQuery.from.id);
      break;
      
    case 'settings':
      handleSettings(callbackQuery.from.id);
      break;
      
    case 'statistics':
      handleStatistics(callbackQuery.from.id);
      break;
      
    case 'product_replacements':
      handleProductReplacements(callbackQuery.from.id);
      break;
      
    case 'food_diary':
      handleFoodDiary(callbackQuery.from.id);
      break;
      
    // Обработка админских callback'ов для управления проектом
    case 'admin_add_task':
      handleAdminAddTask(callbackQuery.from.id);
      break;
      
    case 'admin_full_stats':
      handleAdminFullStats(callbackQuery.from.id);
      break;
      
    case 'admin_refresh_data':
      handleAdminRefreshData(callbackQuery.from.id);
      break;
      
    case 'admin_all_tasks':
      handleAdminAllTasks(callbackQuery.from.id);
      break;
      
    default:
      // Обработка других callback'ов
      handleOtherCallbacks(callbackQuery);
  }
  
  // Отвечаем на callback query
  answerCallbackQuery(callbackQuery.id);
}

/**
 * Обработка других callback'ов
 */
function handleOtherCallbacks(callbackQuery) {
  const data = callbackQuery.data;
  
  // Здесь можно добавить обработку других callback'ов
  if (data.startsWith('goal_')) {
    handleGoalSelection(callbackQuery);
  } else if (data.startsWith('sex_')) {
    handleSexSelection(callbackQuery);
  } else if (data.startsWith('activity_')) {
    handleActivitySelection(callbackQuery);
  } else {
    sendText(callbackQuery.from.id, '❌ Неизвестная команда');
  }
}

// --- Обработка команд ---
function handleCommand(chatId, msg, msgRaw, messageData) {
  if (msg === '/start') {
    onboardUser(chatId, messageData.from); // Создаем инфраструктуру, если ее нет
    const userFirstName = messageData.from.first_name || messageData.from.username || 'пользователь';
    startSetupDialog(chatId, userFirstName); // Запускаем диалог знакомства
    sendMenu(chatId); // Отправляем основное меню
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
      if (isAiMode()) {
        const userData = getUserData(chatId);
        if (userData.weight && userData.goal) {
          triggerNutritionCalculation(chatId, userData);
        } else {
          sendText(chatId, "Пожалуйста, сначала введите свои параметры и установите цель в настройках.");
        }
      } else {
        const userData = getUserData(chatId);
        try {
          const bmrData = calculateBMR(userData);
          const menu = generateMenu(bmrData);
          sendText(chatId, menu);
        } catch (e) {
          sendText(chatId, `Ошибка: ${e.message}`);
        }
      }
      return;
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
  Logger.log(`handleUserInput: Вызвана для chatId: ${chatId}, input: ${input}, awaitingInput: ${session.awaitingInput}`);
  if (session.awaitingInput) {
    switch (session.awaitingInput) {
      case 'awaiting_name_confirmation':
        const lowerInput = input.toLowerCase();
        let userNameToSave;

        if (lowerInput.includes('да') || lowerInput.includes('верно') || lowerInput.includes('yes')) {
          // User confirmed the Telegram name
          const telegramUser = session.data.telegramUser;
          userNameToSave = telegramUser.first_name || telegramUser.username || 'Пользователь';
          sendText(chatId, `Отлично, ${userNameToSave}!`);
        } else {
          // User provided a different name or wants to specify
          userNameToSave = input;
          sendText(chatId, `Хорошо, буду обращаться к тебе как ${userNameToSave}.`);
        }
        saveUserParam(chatId, 'name', userNameToSave); // Save the user's preferred name
        updateSession(chatId, 'awaiting_weight', session.data); // Transition to awaiting weight
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
  } else {
    // Если пользователь не в сессии и ввел не команду, сообщаем ему об этом
    sendText(chatId, "Я не распознал вашу команду. Пожалуйста, воспользуйтесь кнопками меню.", getMenu(chatId));
  }
}

function onboardUser(chatId, from) {
  const scriptProps = PropertiesService.getScriptProperties();
  const userFolderId = scriptProps.getProperty(String(chatId));
  if (userFolderId) return; // Пользователь уже зарегистрирован

  const rootFolder = DriveApp.getFolderById(scriptProps.getProperty('ROOT_FOLDER_ID'));
  const userFolder = rootFolder.createFolder(String(chatId));
  const userSpreadsheet = SpreadsheetApp.create(`${from.first_name || 'user'}_${chatId}`);
  const userFile = DriveApp.getFileById(userSpreadsheet.getId());
  userFolder.addFile(userFile);
  DriveApp.getRootFolder().removeFile(userFile); // Убираем из корня диска

  scriptProps.setProperty(String(chatId), userFolder.getId());

  // Добавляем пользователя в общую таблицу
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
      'Стандарт', // Категория по умолчанию
      false // Администратор по умолчанию
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
