/**
 * @file DEBUG_router.js
 * @description Debug module for testing Telegram data routing.
 */

/**
 * Main debug function. Takes data, identifies it and returns standardized response.
 * @param {object} data - Full Telegram data object.
 */
function debugRouter(data) {
  try {
    let updateType = 'unknown';
    let chatId = null;

    if (data.message) {
      updateType = 'message';
      chatId = data.message.chat.id;
      const message = data.message;

      if (message.text) {
        const text = message.text.trim();
        const session = getSession(chatId);
        if (text.startsWith('/')) {
          handleCommand(chatId, text, message.text, message);
        } else if (session && session.awaitingInput) {
          handleUserInput(chatId, text, session);
        } else {
          // свободный текст: если AI включён — передаём, иначе меню
          if (isAiModeEnabled()) {
            handleFreeText(chatId, text);
          } else {
            sendMenu(chatId);
          }
        }
      } else {
        sendText(chatId, 'Пока я понимаю только текстовые сообщения.');
      }

    } else if (data.callback_query) {
      updateType = 'callback_query';
      chatId = data.callback_query.from.id;
      handleCallbackQuery(data.callback_query);

    } else if (data.edited_message) {
      // Игнорируем
    }

  } catch (err) {
    Logger.log('КРИТИЧЕСКАЯ ОШИБКА в DEBUG_router: ' + err.message + '\nСтек: ' + err.stack);
    const adminChatId = PropertiesService.getScriptProperties().getProperty('ADMIN_CHAT_ID');
    if (adminChatId) {
      sendText(adminChatId, 'Критическая ошибка в маршрутизаторе: ' + err.message);
    }
  }
}