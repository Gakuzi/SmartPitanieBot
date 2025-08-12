/**
 * @file AI_assistant.js
 * @description Модуль ИИ-ассистента для интеллектуальной обработки сообщений пользователей
 */

/**
 * Главная функция ИИ-ассистента, заменяющая DEBUG router
 * @param {Object} data - Данные от Telegram
 */
function aiAssistant(data) {
  try {
    let chatId = null;
    let messageText = '';
    let updateType = 'unknown';

    // Определяем тип обновления и извлекаем chatId
    if (data.message) {
      updateType = 'message';
      chatId = data.message.chat.id;
      
      if (data.message.text) {
        messageText = data.message.text;
        
        // Сохраняем сообщение пользователя в историю
        addToConversationHistory(chatId, 'user', messageText);
        
        // Обрабатываем сообщение через ИИ
        handleUserMessage(chatId, messageText, data.message.from);
        
      } else {
        // Обработка других типов контента (фото, документы и т.д.)
        handleNonTextMessage(chatId, data.message);
      }
      
    } else if (data.callback_query) {
      updateType = 'callback_query';
      chatId = data.callback_query.from.id;
      
      // Обрабатываем callback query
      handleCallbackQuery(data.callback_query);
      
    } else if (data.edited_message) {
      updateType = 'edited_message';
      chatId = data.edited_message.chat.id;
      
      // Уведомляем об отредактированном сообщении
      sendText(chatId, "Я заметил, что вы отредактировали сообщение. Пожалуйста, отправьте новое сообщение, чтобы я мог вам помочь.");
      
    } else {
      Logger.log('Получен неизвестный тип обновления от Telegram');
      return;
    }

    Logger.log(`AI Assistant: Обработано ${updateType} от пользователя ${chatId}`);

  } catch (error) {
    Logger.log(`Критическая ошибка в AI Assistant: ${error.message}\nСтек: ${error.stack}`);
    
    // Пытаемся отправить сообщение об ошибке пользователю
    if (chatId) {
      sendText(chatId, "Произошла техническая ошибка. Пожалуйста, попробуйте еще раз через несколько секунд.");
    }
  }
}

/**
 * Обрабатывает текстовые сообщения пользователя через ИИ
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Текст сообщения
 * @param {Object} fromUser - Информация о пользователе
 */
function handleUserMessage(chatId, messageText, fromUser) {
  try {
    // Показываем индикатор "печатает"
    sendChatAction(chatId, 'typing');
    
    // Получаем профиль пользователя
    const userProfile = getUserProfile(chatId);
    
    // Если это команда /start, запускаем онбординг
    if (messageText === '/start') {
      startAiOnboarding(chatId, fromUser, userProfile);
      return;
    }
    
    // Если пользователь не прошел онбординг, продолжаем его
    if (!userProfile.onboardingCompleted) {
      continueOnboarding(chatId, messageText, userProfile);
      return;
    }
    
    // Обычная обработка сообщения через ИИ
    processMessageWithAI(chatId, messageText, userProfile);
    
  } catch (error) {
    Logger.log(`Ошибка обработки сообщения для пользователя ${chatId}: ${error.message}`);
    sendText(chatId, "Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.");
  }
}

/**
 * Запускает процесс знакомства с новым пользователем
 * @param {string|number} chatId - ID чата
 * @param {Object} fromUser - Информация о пользователе из Telegram
 * @param {Object} userProfile - Профиль пользователя
 */
function startAiOnboarding(chatId, fromUser, userProfile) {
  try {
    // Создаем инфраструктуру пользователя, если её нет
    onboardUser(chatId, fromUser);
    
    // Если онбординг уже пройден, приветствуем как старого знакомого
    if (userProfile.onboardingCompleted && userProfile.name) {
      const welcomeBackMessage = `Привет, ${userProfile.name}! 😊\n\nРад тебя снова видеть! Я твой персональный помощник по питанию.\n\nЧем могу помочь сегодня? Могу:\n• Составить план питания\n• Предложить рецепты\n• Помочь с планированием покупок\n• Ответить на вопросы о питании\n\nИли просто пообщаемся! 💬`;
      
      sendText(chatId, welcomeBackMessage);
      addToConversationHistory(chatId, 'assistant', welcomeBackMessage);
      return;
    }
    
    // Приветствие для нового пользователя
    const userName = fromUser.first_name || fromUser.username || 'друг';
    const onboardingMessage = `Привет, ${userName}! 👋\n\nЯ - твой персональный ИИ-помощник по питанию и здоровому образу жизни! 🤖🍎\n\nМеня зовут SmartPit, и я помогу тебе:\n• Составлять персональные планы питания\n• Подбирать рецепты по твоим предпочтениям\n• Планировать покупки и бюджет\n• Следить за твоими целями в питании\n\nДавай знакомиться! Как тебя зовут? И расскажи немного о себе - что тебя привело ко мне? 😊`;
    
    sendText(chatId, onboardingMessage);
    addToConversationHistory(chatId, 'assistant', onboardingMessage);
    
    // Начинаем процесс онбординга
    updateUserProfileField(chatId, 'onboardingStep', 'name_and_intro');
    
  } catch (error) {
    Logger.log(`Ошибка запуска онбординга для пользователя ${chatId}: ${error.message}`);
    sendText(chatId, "Привет! Произошла небольшая ошибка, но я готов с тобой общаться. Расскажи, чем могу помочь?");
  }
}

/**
 * Продолжает процесс онбординга пользователя
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Сообщение пользователя
 * @param {Object} userProfile - Профиль пользователя
 */
function continueOnboarding(chatId, messageText, userProfile) {
  try {
    const history = getConversationHistory(chatId, 10);
    const currentStep = userProfile.onboardingStep || 'name_and_intro';
    
    // Создаем контекст для ИИ на основе истории и текущего шага
    const prompt = createOnboardingPrompt(currentStep, messageText, history, userProfile);
    
    // Получаем ответ от ИИ
    const aiResponse = callGemini(prompt, { temperature: 0.8, maxTokens: 1500 });
    
    if (!aiResponse) {
      sendText(chatId, "Извините, произошла проблема с ИИ. Давайте продолжим знакомство - расскажите о своих целях в питании.");
      return;
    }
    
    // Отправляем ответ пользователю
    sendText(chatId, aiResponse);
    addToConversationHistory(chatId, 'assistant', aiResponse);
    
    // Анализируем ответ ИИ и обновляем профиль пользователя
    analyzeAndUpdateProfile(chatId, messageText, aiResponse, userProfile);
    
  } catch (error) {
    Logger.log(`Ошибка продолжения онбординга для пользователя ${chatId}: ${error.message}`);
    sendText(chatId, "Давайте продолжим знакомство! Расскажите о ваших предпочтениях в питании.");
  }
}

/**
 * Создает промпт для ИИ в процессе онбординга
 * @param {string} currentStep - Текущий шаг онбординга
 * @param {string} userMessage - Сообщение пользователя
 * @param {Array} history - История общения
 * @param {Object} userProfile - Профиль пользователя
 * @returns {string} Промпт для ИИ
 */
function createOnboardingPrompt(currentStep, userMessage, history, userProfile) {
  const basePrompt = `Ты - дружелюбный ИИ-помощник по питанию по имени SmartPit. Ты проводишь знакомство с новым пользователем.

ТВОЯ ЦЕЛЬ: Собрать информацию о пользователе в дружелюбной манере для создания персонального плана питания.

ВАЖНЫЕ ПРИНЦИПЫ:
- Будь дружелюбным, но не навязчивым
- Задавай по 1-2 вопроса за раз
- Используй эмодзи, но умеренно
- Если пользователь отвечает кратко, проси уточнения
- Адаптируйся к стилю общения пользователя

ИНФОРМАЦИЯ ДЛЯ СБОРА:
1. Имя и базовая информация
2. Возраст, пол, рост, вес
3. Цели (похудение/набор массы/поддержание)
4. Уровень активности
5. Предпочтения в еде (любимые/нелюбимые продукты)
6. Ограничения (аллергии, диета)
7. Бюджет на питание
8. Время на готовку

Текущий шаг: ${currentStep}`;

  let contextPrompt = '';
  
  if (history.length > 0) {
    contextPrompt += '\n\nИСТОРИЯ РАЗГОВОРА:\n';
    history.forEach(msg => {
      contextPrompt += `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.message}\n`;
    });
  }
  
  contextPrompt += `\n\nНОВОЕ СООБЩЕНИЕ ПОЛЬЗОВАТЕЛЯ: "${userMessage}"`;
  
  if (currentStep === 'name_and_intro') {
    contextPrompt += '\n\nЭто первое сообщение после приветствия. Узнай имя пользователя и что его привело к тебе. Задай 1-2 уточняющих вопроса о его целях.';
  }
  
  contextPrompt += '\n\nОТВЕТ ДОЛЖЕН БЫТЬ:\n- Дружелюбным и персональным\n- Не более 3-4 предложений\n- С 1-2 вопросами для продолжения диалога\n- Без технических терминов\n\nЕсли ты собрал достаточно информации для базового профиля, закончи фразой: "ОНБОРДИНГ_ЗАВЕРШЕН"';
  
  return basePrompt + contextPrompt;
}

/**
 * Анализирует ответ ИИ и обновляет профиль пользователя
 * @param {string|number} chatId - ID чата
 * @param {string} userMessage - Сообщение пользователя
 * @param {string} aiResponse - Ответ ИИ
 * @param {Object} userProfile - Профиль пользователя
 */
function analyzeAndUpdateProfile(chatId, userMessage, aiResponse, userProfile) {
  try {
    // Простой анализ сообщения пользователя для извлечения данных
    const message = userMessage.toLowerCase();
    
    // Извлекаем имя (если пользователь его упомянул)
    if (!userProfile.name && (message.includes('меня зовут') || message.includes('я ') || message.includes('имя'))) {
      const nameMatch = userMessage.match(/(?:меня зовут|я|имя|зовут меня)\s+([а-яё]+)/i);
      if (nameMatch) {
        updateUserProfileField(chatId, 'name', nameMatch[1]);
      }
    }
    
    // Извлекаем возраст
    const ageMatch = message.match(/(\d{1,2})\s*(?:лет|год|года)/);
    if (ageMatch) {
      updateUserProfileField(chatId, 'age', parseInt(ageMatch[1]));
    }
    
    // Определяем цель
    if (message.includes('похуд') || message.includes('сбросить') || message.includes('снизить вес')) {
      updateUserProfileField(chatId, 'goal', 'похудение');
    } else if (message.includes('набрать') || message.includes('поправ') || message.includes('массу')) {
      updateUserProfileField(chatId, 'goal', 'набор массы');
    } else if (message.includes('поддерж') || message.includes('сохран')) {
      updateUserProfileField(chatId, 'goal', 'поддержание веса');
    }
    
    // Проверяем, завершен ли онбординг
    if (aiResponse.includes('ОНБОРДИНГ_ЗАВЕРШЕН')) {
      updateUserProfileField(chatId, 'onboardingCompleted', true);
      
      // Отправляем финальное сообщение онбординга
      const finalMessage = `Отлично! Теперь я знаю о тебе достаточно, чтобы стать твоим персональным помощником по питанию! 🎉\n\nЯ готов помочь тебе:\n• Составить персональное меню\n• Подобрать рецепты\n• Спланировать покупки\n• Ответить на вопросы о питании\n\nЧто хочешь попробовать первым? 😊`;
      
      sendText(chatId, finalMessage);
      addToConversationHistory(chatId, 'assistant', finalMessage);
    }
    
  } catch (error) {
    Logger.log(`Ошибка анализа профиля для пользователя ${chatId}: ${error.message}`);
  }
}

/**
 * Обрабатывает обычные сообщения через ИИ после завершения онбординга
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Текст сообщения
 * @param {Object} userProfile - Профиль пользователя
 */
function processMessageWithAI(chatId, messageText, userProfile) {
  try {
    const history = getConversationHistory(chatId, 5);
    
    const prompt = `Ты - персональный ИИ-помощник по питанию SmartPit для пользователя ${userProfile.name || 'друг'}.

ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:
- Имя: ${userProfile.name || 'не указано'}
- Возраст: ${userProfile.age || 'не указан'}
- Цель: ${userProfile.goal || 'не указана'}
- Предпочтения: ${userProfile.dietType || 'обычное питание'}
- Ограничения: ${userProfile.allergies ? userProfile.allergies.join(', ') : 'нет'}

ТВОИ ВОЗМОЖНОСТИ:
- Советы по питанию
- Рецепты и планы питания
- Помощь с планированием покупок
- Ответы на вопросы о здоровом питании
- Мотивация и поддержка

ИСТОРИЯ РАЗГОВОРА:
${history.map(msg => `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.message}`).join('\n')}

НОВОЕ СООБЩЕНИЕ: "${messageText}"

Отвечай дружелюбно, персонально и помогай достигать целей пользователя. Используй эмодзи умеренно. Если нужна дополнительная информация - спрашивай.`;

    const aiResponse = callGemini(prompt, { temperature: 0.7, maxTokens: 1000 });
    
    if (aiResponse) {
      sendText(chatId, aiResponse);
      addToConversationHistory(chatId, 'assistant', aiResponse);
    } else {
      sendText(chatId, "Извините, у меня временные проблемы с обработкой вашего запроса. Попробуйте еще раз через несколько секунд.");
    }
    
  } catch (error) {
    Logger.log(`Ошибка обработки сообщения ИИ для пользователя ${chatId}: ${error.message}`);
    sendText(chatId, "Произошла ошибка. Попробуйте переформулировать ваш вопрос.");
  }
}

/**
 * Обрабатывает нетекстовые сообщения
 * @param {string|number} chatId - ID чата
 * @param {Object} message - Объект сообщения
 */
function handleNonTextMessage(chatId, message) {
  try {
    let responseText = '';
    
    if (message.photo) {
      responseText = "Спасибо за фото! 📷 В будущем я смогу анализировать изображения блюд и продуктов. А пока расскажите текстом, что вас интересует?";
    } else if (message.voice) {
      responseText = "Я получил ваше голосовое сообщение! 🎤 К сожалению, пока я не умею их обрабатывать, но скоро научусь. Напишите текстом, пожалуйста.";
    } else if (message.document) {
      responseText = "Вы отправили документ! 📄 Пока я не умею их анализировать, но в будущем смогу помочь с анализом планов питания и рецептов.";
    } else if (message.sticker) {
      responseText = `Классный стикер! ${message.sticker.emoji || '😄'} Давайте лучше поговорим о ваших целях в питании!`;
    } else if (message.location) {
      responseText = "Спасибо за геолокацию! 📍 В будущем я смогу предлагать блюда на основе местной кухни и доступных продуктов. А пока расскажите о ваших предпочтениях!";
    } else {
      responseText = "Интересно! 🤔 Я пока учусь обрабатывать разные типы сообщений. Напишите текстом, чем могу помочь?";
    }
    
    sendText(chatId, responseText);
    addToConversationHistory(chatId, 'assistant', responseText);
    
  } catch (error) {
    Logger.log(`Ошибка обработки нетекстового сообщения для ${chatId}: ${error.message}`);
    sendText(chatId, "Получил ваше сообщение! Напишите текстом, как могу помочь?");
  }
}