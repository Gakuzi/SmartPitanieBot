// --- Сохранение и получение данных пользователя ---
function saveUserParam(chatId, key, value) {
  const userProps = PropertiesService.getUserProperties();
  let userData = getUserData(chatId);
  userData[key] = value;
  userProps.setProperty('user_' + chatId, JSON.stringify(userData));
  addUser(chatId);
  return userData; // Возвращаем обновленные данные
}

function getUserData(chatId) {
  const userProps = PropertiesService.getUserProperties();
  let data = userProps.getProperty('user_' + chatId);
  try {
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

// --- Регистрация пользователя в общем списке ---
function getAllUsers() {
  const scriptProps = PropertiesService.getScriptProperties();
  const usersJson = scriptProps.getProperty('all_users') || '[]';
  return JSON.parse(usersJson);
}

function addUser(chatId) {
  const scriptProps = PropertiesService.getScriptProperties();
  let users = getAllUsers();
  if (!users.includes(chatId)) {
    users.push(chatId);
    scriptProps.setProperty('all_users', JSON.stringify(users));
  }
}

// --- Сессии для пользовательского ввода ---
function getSession(chatId) {
  const userProps = PropertiesService.getUserProperties();
  let s = userProps.getProperty('session_' + chatId);
  if (s) {
    try {
      return JSON.parse(s);
    } catch (e) {
      clearSession(chatId);
      return {};
    }
  }
  return {};
}

function startSession(chatId, awaitingInput, data = {}) {
  const userProps = PropertiesService.getUserProperties();
  const session = { awaitingInput, data };
  userProps.setProperty('session_' + chatId, JSON.stringify(session));
  return session;
}

function updateSession(chatId, awaitingInput, data) {
  return startSession(chatId, awaitingInput, data); // Просто перезаписываем сессию с новыми данными
}

function clearSession(chatId) {
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty('session_' + chatId);
}

// --- Онбординг и создание инфраструктуры для нового пользователя ---
function onboardUser(chatId) {
  const userProps = PropertiesService.getUserProperties();
  const userData = getUserData(chatId);

  // Если у пользователя уже есть таблица, ничего не делаем
  if (userData.sheetId) {
    return;
  }

  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    const templateSheetId = scriptProps.getProperty('TEMPLATE_SHEET_ID');

    if (!rootFolderId || !templateSheetId) {
      throw new Error("Ключевые ID инфраструктуры не найдены. Запустите setupProjectInfrastructure().");
    }

    const rootFolder = DriveApp.getFolderById(rootFolderId);
    const templateFile = DriveApp.getFileById(templateSheetId);

    // 1. Создаем персональную папку
    const userFolder = rootFolder.createFolder(String(chatId));
    
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
