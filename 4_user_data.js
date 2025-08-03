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
