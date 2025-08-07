var Modules = typeof Modules !== 'undefined' ? Modules : {};
Modules.Offline = Modules.Offline || {};

Modules.Offline.menu = function(chatId) {
  try {
    sendTodayMenu(chatId);
  } catch (e) {
    Logger.log('Offline.menu error: ' + e.message);
    sendText(chatId, 'Не удалось получить меню.');
  }
};

