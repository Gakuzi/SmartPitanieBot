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
  const text = `♻️ Возможные замены для *${target}*:*\n\n${list}`;

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
