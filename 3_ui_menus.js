// --- Клавиатуры ---
function getMenu(chatId) {
  const userData = getUserData(chatId);
  const notifyTime = userData.notifyTime || 'не задано';

  return {
    keyboard: [
      [{ text: "🍽 Показать меню" }, { text: "🛒 Список покупок" }],
      [{ text: "👨‍🍳 Что готовим?" }, { text: "🔄 Замена продукта" }],
      [{ text: "⚙️ Настройки" }],
      [{ text: `⏰ Текущее время уведомлений: ${notifyTime}` }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

function sendSettingsMenu(chatId) {
  const keyboard = {
    keyboard: [
      [{ text: "🥅 Установить цель" }, { text: "⚖️ Ввести параметры" }],
      [{ text: "🕒 Установить время уведомлений" }],
      [{ text: "⬅️ Назад" }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
  sendText(chatId, "Выберите настройку:", keyboard);
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

function sendMenu(chatId) {
  sendText(chatId, "Выберите действие:", getMenu(chatId));
}

function sendStart(chatId) {
  sendText(chatId, "Добро пожаловать! Я ваш помощник по питанию. Выберите действие из меню:", getMenu(chatId));
}
