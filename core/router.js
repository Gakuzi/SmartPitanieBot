var Core = typeof Core !== 'undefined' ? Core : {};

Core.Router = (function() {
  function route(update) {
    try {
      if (update.callback_query) {
        return handleCallback(update.callback_query);
      }
      if (update.message) {
        return handleMessage(update.message);
      }
    } catch (e) {
      Logger.log('Router error: ' + e.message + '\n' + (e.stack || ''));
    }
  }

  function handleMessage(message) {
    var chatId = message.chat.id;
    var text = message.text || '';

    if (text.startsWith('/')) {
      return handleCommand(chatId, text);
    }

    // Fallback: делегируем существующей логике
    handleIncomingUpdate({ message: message });
  }

  function handleCallback(callbackQuery) {
    // Делегируем существующей логике
    handleIncomingUpdate({ callback_query: callbackQuery });
  }

  function handleCommand(chatId, cmd) {
    switch (cmd) {
      case '/start':
        return handleIncomingUpdate({ message: { chat: { id: chatId }, text: '/start' } });
      case '/get_menu':
        return Modules.Offline.menu(chatId);
      case '/show_purchases':
        return Modules.Offline.purchases(chatId);
      case '/my_budget':
        return Modules.Offline.budget(chatId);
      case '/create_new_menu':
        return Modules.Online.generateMenu(chatId);
      case '/ask_ai':
        Core.State.set(chatId, { awaiting: 'ask_ai' });
        return sendText(chatId, 'Задайте свой вопрос для AI.');
      default:
        return handleIncomingUpdate({ message: { chat: { id: chatId }, text: cmd } });
    }
  }

  return { route: route };
})();

