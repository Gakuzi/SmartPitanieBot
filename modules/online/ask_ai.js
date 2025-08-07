var Modules = typeof Modules !== 'undefined' ? Modules : {};
Modules.Online = Modules.Online || {};

Modules.Online.askAi = function(chatId, text) {
  try {
    if (!text) {
      Core.State.set(chatId, { awaiting: 'ask_ai' });
      return sendText(chatId, 'Задайте свой вопрос для AI.');
    }
    const prompt = 'Пользователь спрашивает: "' + text + '"';
    const res = callGeminiStructured(prompt, false);
    const answer = res && res.text ? res.text : 'AI недоступен.';
    sendText(chatId, answer);
    Core.State.clear(chatId);
  } catch (e) {
    Logger.log('Online.askAi error: ' + e.message);
    sendText(chatId, 'Ошибка AI.');
  }
};

