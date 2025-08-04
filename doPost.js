/**
 * @file doPost.js
 * @description Единая точка входа и интеллектуальный маршрутизатор для всех запросов от Telegram.
 */

/**
 * Главная функция, обрабатывающая все входящие POST-запросы от Telegram.
 * @param {object} e - Объект события от Google Apps Script.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log("Получен пустой или некорректный запрос от Telegram.");
      return;
    }

    const data = JSON.parse(e.postData.contents);
    Logger.log(`Входящие данные: ${JSON.stringify(data)}`);

    if (data.callback_query) {
      // Обработка нажатий на встроенные кнопки
      handleCallbackQuery(data.callback_query);
      return;
    }

    if (!data.message || !data.message.text) {
      Logger.log(`Пропускаем нетекстовое сообщение или другой тип обновления.`);
      return;
    }

    const chatId = data.message.chat.id;
    const text = data.message.text.trim();
    const session = getSession(chatId);

    // 1. Проверка на системную команду
    if (isCommand(text)) {
      handleCommand(chatId, text, text, data.message);
      return;
    }

    // 2. Проверка, ожидает ли система ввода от пользователя в рамках сценария
    if (session.awaitingInput) {
      handleUserInput(chatId, text, session);
      return;
    }

    // 3. Если это не команда и не ответ в сценарии, передаем в AI (если включен)
    if (isAiMode()) {
      handleFreeText(chatId, text);
    } else {
      sendText(chatId, "🤖 AI-ассистент в данный момент отключен. Пожалуйста, воспользуйтесь командами из меню.", getMenu(chatId));
    }

  } catch (err) {
    Logger.log(`КРИТИЧЕСКАЯ ОШИБКА в doPost: ${err.message}\nСтек: ${err.stack}`);
    const adminChatId = PropertiesService.getScriptProperties().getProperty('ADMIN_CHAT_ID');
    if (adminChatId) {
      sendText(adminChatId, `Критическая ошибка в боте: ${err.message}`);
    }
  }
}

/**
 * Обрабатывает свободный текстовый ввод, передавая его AI.
 * @param {number|string} chatId - ID чата.
 * @param {string} text - Текст сообщения.
 */
function handleFreeText(chatId, text) {
  // Здесь будет логика для вызова Gemini (Этап 3)
  // Пока просто имитируем ответ
  const prompt = `Ты — AI-диетолог. Пользователь написал тебе: "${text}". Ответь ему в своей роли.`;
  const aiResponse = callGemini(prompt); // Предполагается, что callGemini существует
  if (aiResponse) {
    sendText(chatId, aiResponse);
  } else {
    sendText(chatId, "Произошла ошибка при обращении к AI. Попробуйте позже.");
  }
}
