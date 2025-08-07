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
    let responseText = 'Не удалось обработать запрос.';

    // 1. Determine update type and extract chatId
    if (data.message) {
      updateType = 'message';
      chatId = data.message.chat.id;
      const message = data.message;
      
      // 2. Determine message content type
      if (message.text) {
        const contentType = message.text.startsWith('/') ? 'command' : 'text';
        responseText = 'Тип обновления: message\nТип контента: ' + contentType + '\nСодержимое: ' + message.text;
        Logger.log('DEBUG_router: Получена команда или текст: ' + message.text);
      } else if (message.photo) {
        responseText = 'Тип обновления: message\nТип контента: photo\nПолучено фото.';
        Logger.log('DEBUG_router: Получено фото.');
      } else if (message.document) {
        responseText = 'Тип обновления: message\nТип контента: document\nПолучен документ.';
        Logger.log('DEBUG_router: Получен документ.');
      } else if (message.voice) {
        responseText = 'Тип обновления: message\nТип контента: voice\nПолучено голосовое сообщение.';
        Logger.log('DEBUG_router: Получено голосовое сообщение.');
      } else if (message.video_note) {
        responseText = 'Тип обновления: message\nТип контента: video_note\nПолучен видео-кружок.';
        Logger.log('DEBUG_router: Получен видео-кружок.');
      } else if (message.video) {
        responseText = 'Тип обновления: message\nТип контента: video\nПолучено видео.';
        Logger.log('DEBUG_router: Получено видео.');
      } else if (message.sticker) {
        responseText = 'Тип обновления: message\nТип контента: sticker\nПолучен стикер с эмодзи: ' + (message.sticker.emoji || '');
        Logger.log('DEBUG_router: Получен стикер: ' + (message.sticker.emoji || ''));
      } else if (message.location) {
        responseText = 'Тип обновления: message\nТип контента: location\nПолучена геолокация.';
        Logger.log('DEBUG_router: Получена геолокация.');
      } else if (message.contact) {
        responseText = 'Тип обновления: message\nТип контента: contact\nПолучен контакт.';
        Logger.log('DEBUG_router: Получен контакт.');
      } else {
        responseText = 'Тип обновления: message\nТип контента: unknown\nПолучен неизвестный тип контента.';
        Logger.log('DEBUG_router: Получен неизвестный тип контента в сообщении.');
      }

    } else if (data.edited_message) {
      updateType = 'edited_message';
      chatId = data.edited_message.chat.id;
      responseText = 'Тип обновления: edited_message\nПолучено отредактированное сообщение.';
      Logger.log('DEBUG_router: Получено отредактированное сообщение.');

    } else if (data.callback_query) {
      updateType = 'callback_query';
      chatId = data.callback_query.from.id;
      responseText = 'Тип обновления: callback_query\nСодержимое: ' + data.callback_query.data;
      answerCallbackQuery(data.callback_query.id); // Answer callback to remove loading
      Logger.log('DEBUG_router: Обработка callback_query: ' + data.callback_query.data);

    } else if (data.my_chat_member) {
      updateType = 'my_chat_member';
      chatId = data.my_chat_member.chat.id;
      responseText = 'Тип обновления: my_chat_member\nНовый статус: ' + data.my_chat_member.new_chat_member.status;
      Logger.log('DEBUG_router: Изменился статус участника: ' + data.my_chat_member.new_chat_member.status);
    }

    // 3. Send debug response
    if (chatId) {
      sendText(chatId, responseText);
    }

  } catch (err) {
    Logger.log('КРИТИЧЕСКАЯ ОШИБКА в DEBUG_router: ' + err.message + '\nСтек: ' + err.stack);
    // Try to send error message to admin if possible
    const adminChatId = PropertiesService.getScriptProperties().getProperty('ADMIN_CHAT_ID');
    if (adminChatId) {
      sendText(adminChatId, 'Критическая ошибка в отладочном маршрутизаторе: ' + err.message);
    }
  }
}