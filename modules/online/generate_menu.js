var Modules = typeof Modules !== 'undefined' ? Modules : {};
Modules.Online = Modules.Online || {};

Modules.Online.generateMenu = function(chatId) {
  try {
    const userData = getUserData(chatId);
    if (!userData || !userData.calories) {
      return sendText(chatId, 'Сначала завершите настройку профиля и расчёт КБЖУ.');
    }
    const prompt = generateMenuPrompt(userData);
    const response = callGeminiStructured(prompt, false);
    let menu = response && response.text ? null : null;
    try {
      menu = response && response.text ? JSON.parse(response.text) : null;
    } catch (e) {}
    if (!menu || !menu.meals) {
      menu = buildFallbackMenu(userData);
    }
    saveMenuToSheet(chatId, menu);
    sendText(chatId, '✅ Меню сгенерировано и сохранено!');
  } catch (e) {
    Logger.log('Online.generateMenu error: ' + e.message);
    sendText(chatId, 'Ошибка генерации меню.');
  }
};

