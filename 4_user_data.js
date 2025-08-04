/**
 * @file 4_user_data.js
 * @description Управление данными и состоянием пользователей.
 */

// --- Константы состояний пользователя ---
const STATES = {
  IDLE: 'idle', // Обычное состояние, бот ждет команд
  AWAITING_SETUP: 'awaiting_setup', // Пользователь в процессе настройки профиля
  // Можно добавлять другие состояния, например, AWAITING_MEAL_PHOTO
};

// --- Управление состоянием пользователя ---

/**
 * Устанавливает текущее состояние для пользователя.
 * @param {string|number} chatId - ID чата.
 * @param {string} state - Состояние из констант STATES.
 */
function setUserState(chatId, state) {
  const userProps = PropertiesService.getUserProperties();
  userProps.setProperty(`state_${chatId}`, state);
}

/**
 * Получает текущее состояние пользователя.
 * @param {string|number} chatId - ID чата.
 * @returns {string} - Текущее состояние (по умолчанию STATES.IDLE).
 */
function getUserState(chatId) {
  const userProps = PropertiesService.getUserProperties();
  return userProps.getProperty(`state_${chatId}`) || STATES.IDLE;
}


// --- Сохранение и получение данных пользователя ---
function saveUserParam(chatId, key, value) {
  const userProps = PropertiesService.getUserProperties();
  let userData = getUserData(chatId);
  userData[key] = value;
  userProps.setProperty('user_' + chatId, JSON.stringify(userData));
  addUser(chatId); // Убедимся, что пользователь зарегистрирован
  return userData; // Возвращаем обновленные данные
}

function getUserData(chatId) {
  const userProps = PropertiesService.getUserProperties();
  let data = userProps.getProperty('user_' + chatId);
  try {
    return data ? JSON.parse(data) : {};
  } catch (e) {
    Logger.log(`Ошибка парсинга JSON для пользователя ${chatId}: ${e.message}. Данные: ${data}`);
    return {};
  }
}

// --- Регистрация пользователя в общем списке ---
function getAllUsers() {
  const scriptProps = PropertiesService.getScriptProperties();
  const usersJson = scriptProps.getProperty('all_users') || '[]';
  try {
    return JSON.parse(usersJson);
  } catch (e) {
    Logger.log(`Ошибка парсинга JSON all_users: ${e.message}. Данные: ${usersJson}`);
    return [];
  }
}

function addUser(chatId) {
  const scriptProps = PropertiesService.getScriptProperties();
  let users = getAllUsers();
  if (!users.includes(chatId)) {
    users.push(chatId);
    scriptProps.setProperty('all_users', JSON.stringify(users));
  }
}

// --- Онбординг и создание инфраструктуры для нового пользователя ---
function onboardUser(chatId) {
  const userData = getUserData(chatId);

  // Если у пользователя уже есть таблица, ничего не делаем
  if (userData.sheetId) {
    Logger.log(`Пользователь ${chatId} уже имеет инфраструктуру.`);
    return;
  }

  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    const templateSheetId = scriptProps.getProperty('TEMPLATE_SHEET_ID');

    if (!rootFolderId || !templateSheetId) {
      throw new Error("Ключевые ID инфраструктуры (ROOT_FOLDER_ID или TEMPLATE_SHEET_ID) не найдены. Запустите setupProjectInfrastructure() из 0_setup.js.");
    }

    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const templateFile = DriveApp.getFileById(templateSheetId);

    // 1. Создаем персональную папку
    const userFolder = rootFolder.createFolder(`User_${String(chatId)}`);
    
    // 2. Копируем шаблонную таблицу в папку пользователя
    const userSheet = templateFile.makeCopy(`SmartPit_Sheet_${chatId}`, userFolder);
    const userSheetId = userSheet.getId();

    // 3. Сохраняем ID таблицы и папки в данных пользователя
    saveUserParam(chatId, 'sheetId', userSheetId);
    saveUserParam(chatId, 'folderId', userFolder.getId());

    Logger.log(`✅ Успешно создана инфраструктура для пользователя ${chatId}. ID таблицы: ${userSheetId}`);

  } catch (e) {
    Logger.log(`❌ Ошибка при создании инфраструктуры для пользователя ${chatId}: ${e.message}`);
    sendText(chatId, "Произошла критическая ошибка при настройке вашего аккаунта. Пожалуйста, свяжитесь с администратором.");
  }
}