const TELEGRAM_TOKEN = '8368578615:AAF6fDpa28k2a_LG0pa3dcn4mvmLTU2GqQY';
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1EK0i774b668t6bZEE3iTgtbHAs3OUyXdCpuOYxxMWHE/edit';

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

function startSession(chatId, awaitingInput) {
  const userProps = PropertiesService.getUserProperties();
  userProps.setProperty('session_' + chatId, JSON.stringify({ awaitingInput }));
}

function clearSession(chatId) {
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty('session_' + chatId);
}

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

// --- AI-модуль: Расчет КБЖУ ---
function calculateNutrition(userData) {
  const { weight, height, age, sex, activity, goal } = userData;

  // 1. Расчет базового метаболизма (BMR) по формуле Миффлина-Сан Жеора
  let bmr;
  if (sex === 'm') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // 2. Коррекция на активность
  const activityMultipliers = { 'низкий': 1.2, 'средний': 1.55, 'высокий': 1.9 };
  const tdee = bmr * (activityMultipliers[activity] || 1.2);

  // 3. Коррекция на цель
  const goalMultipliers = { 'похудение': 0.85, 'набор': 1.15, 'удержание': 1.0 };
  const finalCalories = Math.round(tdee * (goalMultipliers[goal] || 1.0));

  // 4. Расчет БЖУ (в граммах)
  const bjuRatios = {
    'похудение': { p: 0.35, f: 0.30, c: 0.35 },
    'набор':     { p: 0.30, f: 0.25, c: 0.45 },
    'удержание': { p: 0.30, f: 0.30, c: 0.40 },
  };
  const ratio = bjuRatios[goal] || bjuRatios['удержание'];
  const proteins = Math.round((finalCalories * ratio.p) / 4);
  const fats = Math.round((finalCalories * ratio.f) / 9);
  const carbs = Math.round((finalCalories * ratio.c) / 4);

  return { calories: finalCalories, proteins, fats, carbs };
}

function triggerNutritionCalculation(chatId, userData) {
    const nutrition = calculateNutrition(userData);
    // Сохраняем рассчитанные данные
    let finalUserData = saveUserParam(chatId, 'calories', nutrition.calories);
    finalUserData = saveUserParam(chatId, 'proteins', nutrition.proteins);
    finalUserData = saveUserParam(chatId, 'fats', nutrition.fats);
    finalUserData = saveUserParam(chatId, 'carbs', nutrition.carbs);

    // Отправляем результат пользователю
    const message = `🤖 *Ваша персональная норма КБЖУ:*\n\n` +
                    `*Калории:* ${nutrition.calories} ккал/день\n` +
                    `*Белки:* ${nutrition.proteins} г/день\n` +
                    `*Жиры:* ${nutrition.fats} г/день\n` +
                    `*Углеводы:* ${nutrition.carbs} г/день\n\n` +
                    `Я буду использовать эти данные для составления вашего меню.`;
    sendText(chatId, message);
}


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

// --- Клавиатуры ---
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

function sendGoalOptions(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "Похудение", callback_data: "setGoal:похудение" },
        { text: "Набор веса", callback_data: "setGoal:набор" },
        { text: "Удержание", callback_data: "setGoal:удержание" }
      ]
    ]
  };
  sendText(chatId, "Выберите вашу цель:", keyboard);
}

// --- Функции отправки сообщений ---
function sendMenu(chatId) {
  sendText(chatId, "Выберите действие:", getMenu(chatId));
}

function sendStart(chatId) {
  sendText(chatId, "Добро пожаловать! Я ваш помощник по питанию. Выберите действие из меню:", getMenu(chatId));
}

function sendText(chatId, text, keyboard = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: String(chatId),
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
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log(`ERROR sending message to ${chatId}: ${e.message}`);
  }
}

function editMessageText(chatId, messageId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/editMessageText`;
  const payload = {
    chat_id: String(chatId),
    message_id: messageId,
    text: text,
    parse_mode: 'Markdown'
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    Logger.log(`ERROR editing message ${messageId} for ${chatId}: ${e.message}`);
  }
}

function answerCallbackQuery(callbackQueryId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/answerCallbackQuery`;
  UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify({ callback_query_id: callbackQueryId }) });
}

// --- Проверка формата времени ---
function validateTimeFormat(timeStr) {
  return /^\d{2}:\d{2}$/.test(timeStr) &&
    Number(timeStr.substr(0, 2)) >= 0 && Number(timeStr.substr(0, 2)) < 24 &&
    Number(timeStr.substr(3, 2)) >= 0 && Number(timeStr.substr(3, 2)) < 60;
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