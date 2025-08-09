// router.js - Main update handler integrating AI intro dialog and database persistence

/**
 * Handles incoming Telegram update and routes it to appropriate modules.
 * This function is intended for production use (non-debug mode).
 * @param {object} data - Raw update object sent by Telegram.
 */
function handleUpdate(data) {
  try {
    if (!data) {
      Logger.log('handleUpdate: received empty update');
      return;
    }

    // 1. Callback queries have priority – processed first
    if (data.callback_query) {
      const callback = data.callback_query;
      const chatId = callback.from.id;
      const userName = callback.from.first_name || callback.from.username || 'пользователь';
      const currentState = getUserState(chatId);

      // If user is still in onboarding flow – delegate to continueSetupDialog
      if (currentState === STATES.AWAITING_SETUP) {
        continueSetupDialog(chatId, userName, callback.data);
      } else {
        // Fallback to generic callback handler from 1_main.js
        handleCallbackQuery(callback);
      }
      return; // Done processing callback_query
    }

    // 2. Standard incoming message processing
    if (data.message) {
      const message = data.message;
      const chatId = message.chat.id;
      const userName = message.from.first_name || message.from.username || 'пользователь';
      const text = message.text || '';

      // Non-text messages are ignored for now
      if (!text) {
        Logger.log('handleUpdate: non-text message received, skipping');
        return;
      }

      const trimmedText = text.trim();
      const lowerText = trimmedText.toLowerCase();

      // 2.a. Commands (start with '/') → handleCommand
      if (trimmedText.startsWith('/')) {
        handleCommand(chatId, lowerText, trimmedText, message);
        return;
      }

      // 2.b. If user is in onboarding AI dialog → continueSetupDialog
      const currentState = getUserState(chatId);
      if (currentState === STATES.AWAITING_SETUP) {
        continueSetupDialog(chatId, userName, trimmedText);
        return;
      }

      // 2.c. If there is a pending explicit session awaiting input (classic flow)
      const session = getSession(chatId);
      if (session && session.awaitingInput) {
        handleUserInput(chatId, trimmedText, session);
        return;
      }

      // 2.d. Fallback – free text handled by AI assistant
      handleFreeText(chatId, trimmedText);
      return;
    }

    // 3. Other update types are currently not handled
    Logger.log('handleUpdate: unsupported update type');

  } catch (err) {
    Logger.log('CRITICAL ERROR in handleUpdate: ' + err.message + '\nStack: ' + (err.stack || 'N/A'));
    const adminChatId = PropertiesService.getScriptProperties().getProperty('ADMIN_CHAT_ID');
    if (adminChatId) {
      sendText(adminChatId, 'Критическая ошибка в боте: ' + err.message);
    }
  }
}