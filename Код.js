const TELEGRAM_TOKEN = '8368578615:AAF6fDpa28k2a_LG0pa3dcn4mvmLTU2GqQY';
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1EK0i774b668t6bZEE3iTgtbHAs3OUyXdCpuOYxxMWHE/edit';

const userProps = PropertiesService.getUserProperties();
const scriptProps = PropertiesService.getScriptProperties();

function doPost(e) {
  Logger.log(JSON.stringify(e.postData.contents));
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    Logger.log('Error parsing JSON: ' + error.message);
    return; // Exit if JSON is invalid
  }

  // Check if it's a message update and has text
  if (!data || !data.message || !data.message.chat || !data.message.text) {
    Logger.log('Received update is not a text message or missing required fields.');
    // Handle other update types if necessary, or just ignore
    return;
  }

  const chatId = data.message.chat.id;
  const msgRaw = data.message.text.trim();
  const msg = msgRaw.toLowerCase();

  let session = getSession(chatId);

  if (session.awaitingInput) {
    handleUserInput(chatId, msgRaw, session);
    return;
  }

  switch (msg) {
    case '/start':
      return sendStart(chatId);
    case '🥅 установить цель':
      startSession(chatId, 'awaitGoal');
      return sendText(chatId, 'Выбери цель: похудение / набор / удержание веса');
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
function getSession(chatId) {
  let s = userProps.getProperty('session_' + chatId);
  return s ? JSON.parse(s) : {};
}

function startSession(chatId, awaitingInput) {
  userProps.setProperty('session_' + chatId, JSON.stringify({ awaitingInput }));
}

function clearSession(chatId) {
  userProps.deleteProperty('session_' + chatId);
}

function handleUserInput(chatId, input, session) {
  switch (session.awaitingInput) {
    case 'awaitGoal':
      if (['похудение', 'набор', 'удержание'].includes(input.toLowerCase())) {
        saveUserParam(chatId, 'goal', input.toLowerCase());
        clearSession(chatId);
        sendText(chatId, `Цель сохранена: *${input}*`, getMenu(chatId));
      } else {
        sendText(chatId, 'Неверная цель. Выбери из: похудение / набор / удержание');
      }
      break;

    case 'awaitParams':
      let parts = input.split(',').map(x => x.trim());
      if (parts.length !== 5) {
        sendText(chatId, 'Ошибка формата. Введи: вес, рост, возраст, пол(m/f), активность(низкий/средний/высокий)');
        return;
      }
      let [weight, height, age, sex, activity] = parts;
      if (isNaN(weight) || isNaN(height) || isNaN(age) || !['m', 'f'].includes(sex.toLowerCase()) || !['низкий', 'средний', 'высокий'].includes(activity.toLowerCase())) {
        sendText(chatId, 'Проверь данные. Пример: 70, 175, 40, m, средний');
        return;
      }
      saveUserParam(chatId, 'weight', weight);
      saveUserParam(chatId, 'height', height);
      saveUserParam(chatId, 'age', age);
      saveUserParam(chatId, 'sex', sex.toLowerCase());
      saveUserParam(chatId, 'activity', activity.toLowerCase());
      clearSession(chatId);
      sendText(chatId, 'Параметры сохранены.', getMenu(chatId));
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
  }
}

// --- Сохранение и получение данных пользователя ---
function saveUserParam(chatId, key, value) {
  let userData = getUserData(chatId);
  userData[key] = value;
  userProps.setProperty('user_' + chatId, JSON.stringify(userData));
  addUser(chatId);
}

function getUserData(chatId) {
  let data = userProps.getProperty('user_' + chatId);
  return data ? JSON.parse(data) : {};
}

// --- Регистрация пользователя в общем списке ---
function getAllUsers() {
  const usersJson = scriptProps.getProperty('all_users') || '[]';
  return JSON.parse(usersJson);
}

function addUser(chatId) {
  let users = getAllUsers();
  if (!users.includes(chatId)) {
    users.push(chatId);
    scriptProps.setProperty('all_users', JSON.stringify(users));
  }
}

// --- Клавиатура меню ---
function getMenu(chatId) {
  const userData = getUserData(chatId);
  const notifyTime = userData.notifyTime || 'не задано';

  return {
    keyboard: [
      [{ text: "🥅 Установить цель" }, { text: "⚖️ Ввести параметры" }],
      [{ text: "🕒 Установить время уведомлений" }, { text: "🍽 Показать меню" }],
      [{ text: "🛒 Список покупок" }, { text: "👨‍🍳 Что готовим?" }],
      [{ text: "🔄 Замена продукта" }],
      [{ text: `⏰ Текущее время уведомлений: ${notifyTime}` }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

function sendMenu(chatId) {
  sendText(chatId, "Выберите действие:", getMenu(chatId));
}

function sendStart(chatId) {
  sendText(chatId, "Добро пожаловать! Я ваш помощник по питанию. Выберите действие из меню:", getMenu(chatId));
}

// --- Проверка формата времени ---
function validateTimeFormat(timeStr) {
  return /^\d{2}:\d{2}$/.test(timeStr) &&
    Number(timeStr.substr(0, 2)) >= 0 && Number(timeStr.substr(0, 2)) < 24 &&
    Number(timeStr.substr(3, 2)) >= 0 && Number(timeStr.substr(3, 2)) < 60;
}

// --- Отправка текста ---
function sendText(chatId, text, keyboard = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  };
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard);
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
  };
  UrlFetchApp.fetch(url, options);
}

// --- Функции отправки данных из таблицы ---
function sendTodayMenu(chatId) {
  const sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName("Меню по дням");
  const today = new Date();
  const dayNum = (today.getDate() % 20) + 1;
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0] === dayNum);
  if (!row) return sendText(chatId, "Меню на сегодня не найдено.", getMenu(chatId));

  const [_, zavtrak, perk1, obed, perk2, uzhin, kcal, cost] = row;
  const text = `🍽 *Меню на день ${dayNum}*\n\n` +
    `*Завтрак:* ${zavtrak}\n` +
    `*Перекус 1:* ${perk1}\n` +
    `*Обед:* ${obed}\n` +
    `*Перекус 2:* ${perk2}\n` +
    `*Ужин:* ${uzhin}\n\n` +
    `Калорийность: *${kcal} ккал*\nСтоимость: *${cost} ₽*`;

  sendText(chatId, text, getMenu(chatId));
}

function sendShoppingList(chatId) {
  const sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName("Список покупок");
  const data = sheet.getDataRange().getValues();
  const today = new Date().toLocaleDateString("ru-RU");
  const todayItems = data.filter(r => r[0] === today);

  if (!todayItems.length) return sendText(chatId, "На сегодня список покупок пуст.", getMenu(chatId));

  const list = todayItems.map(r => `☐ ${r[1]} — ${r[3]} ${r[2]}`).join("\n");
  sendText(chatId, `🛒 *Список покупок на ${today}*\n\n${list}`, getMenu(chatId));
}

function sendCookingList(chatId) {
  const sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName("Готовка");
  const data = sheet.getDataRange().getValues();
  const today = new Date().toLocaleDateString("ru-RU");
  const todayCook = data.filter(r => r[0] === today);

  if (!todayCook.length) return sendText(chatId, "Сегодня ничего готовить не нужно.", getMenu(chatId));

  const list = todayCook.map(r => `🍲 ${r[1]} — из: ${r[2]} на ${r[3]} дней`).join("\n");
  sendText(chatId, `👨‍🍳 *Сегодня готовим:*\n\n${list}`, getMenu(chatId));
}

function sendSubstitute(chatId, msg) {
  const parts = msg.split(" ");
  if (parts.length < 3) return sendText(chatId, "Укажите продукт после слова 'замена', например:\n🔄 замена творог", getMenu(chatId));
  const target = parts.slice(2).join(" ").toLowerCase();

  const sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName("Замены");
  const data = sheet.getDataRange().getValues();
  const row = data.find(r => r[0].toLowerCase() === target);

  if (!row) return sendText(chatId, `Нет информации о заменах для "${target}".`, getMenu(chatId));

  const substitutes = row.slice(1).filter(v => v);
  const list = substitutes.map(s => `🔁 ${s}`).join("\n");
  const text = `♻️ Возможные замены для *${target}*:\n\n${list}`;

  sendText(chatId, text, getMenu(chatId));
}

// --- Авторассылка по времени пользователя ---
// В редакторе GAS создать триггер на функцию sendDailyNotifications, например, каждую минуту.
function sendDailyNotifications() {
  const allUsers = getAllUsers();
  const now = new Date();
  const nowStr = Utilities.formatDate(now, "GMT+3", "HH:mm");

  allUsers.forEach(chatId => {
    const userData = getUserData(chatId);
    if (userData.notifyTime === nowStr) {
      sendTodayMenu(chatId);
      sendShoppingList(chatId);
      sendCookingList(chatId);
    }
  });
}