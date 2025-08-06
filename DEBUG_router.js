function debugRouter(data) {
  try {
    let updateType = 'unknown';
    let chatId = null;
    let responseText = 'Debug response';

    if (data.message) {
      updateType = 'message';
      chatId = data.message.chat.id;
      const message = data.message;
      
      if (message.text) {
        const contentType = message.text.startsWith('/') ? 'command' : 'text';
        responseText = 'Update: message, Content: ' + contentType + ', Text: ' + message.text;
        Logger.log('DEBUG: Received text: ' + message.text);
      } else if (message.photo) {
        responseText = 'Update: message, Content: photo';
        Logger.log('DEBUG: Received photo');
      } else {
        responseText = 'Update: message, Content: unknown';
        Logger.log('DEBUG: Unknown message type');
      }
    } else if (data.callback_query) {
      updateType = 'callback_query';
      chatId = data.callback_query.from.id;
      responseText = 'Update: callback_query, Data: ' + data.callback_query.data;
      answerCallbackQuery(data.callback_query.id);
      Logger.log('DEBUG: Callback query: ' + data.callback_query.data);
    }

    if (chatId) {
      sendText(chatId, responseText);
    }

  } catch (err) {
    Logger.log('ERROR in debugRouter: ' + err.message);
  }
}
