var Modules = typeof Modules !== 'undefined' ? Modules : {};
Modules.Offline = Modules.Offline || {};

Modules.Offline.purchases = function(chatId) {
  try {
    sendShoppingList(chatId);
  } catch (e) {
    Logger.log('Offline.purchases error: ' + e.message);
    sendText(chatId, 'Не удалось получить список покупок.');
  }
};

