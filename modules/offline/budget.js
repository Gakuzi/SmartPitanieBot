var Modules = typeof Modules !== 'undefined' ? Modules : {};
Modules.Offline = Modules.Offline || {};

Modules.Offline.budget = function(chatId) {
  try {
    sendText(chatId, 'Бюджет: модуль в разработке.');
  } catch (e) {
    Logger.log('Offline.budget error: ' + e.message);
  }
};

