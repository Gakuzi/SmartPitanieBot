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
    
    // Проверяем команды меню
    if (isMenuCommand(messageText)) {
      handleMenuCommand(chatId, messageText, userProfile);
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
 * Проверяет, является ли сообщение командой меню
 * @param {string} messageText - Текст сообщения
 * @returns {boolean} - True если это команда меню
 */
function isMenuCommand(messageText) {
  const menuCommands = [
    '🍽 показать меню', 'показать меню', '/menu',
    '🛒 список покупок', 'список покупок', '/shopping',
    '⚙️ настройки', 'настройки', '/settings',
    '🔄 замена продукта', 'замена продукта',
    '👨‍🍳 что готовим', 'что готовим', '/cooking',
    '/help', 'помощь', 'меню'
  ];
  
  return menuCommands.some(cmd => messageText.toLowerCase().includes(cmd.toLowerCase()));
}

/**
 * Обрабатывает команды меню
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Текст команды
 * @param {Object} userProfile - Профиль пользователя
 */
function handleMenuCommand(chatId, messageText, userProfile) {
  try {
    const lowerText = messageText.toLowerCase();
    
    if (lowerText.includes('показать меню') || lowerText.includes('/menu')) {
      handleShowMenu(chatId, userProfile);
    } else if (lowerText.includes('список покупок') || lowerText.includes('/shopping')) {
      handleShoppingList(chatId, userProfile);
    } else if (lowerText.includes('настройки') || lowerText.includes('/settings')) {
      handleSettings(chatId, userProfile);
    } else if (lowerText.includes('замена продукта')) {
      handleProductReplacement(chatId, messageText, userProfile);
    } else if (lowerText.includes('что готовим') || lowerText.includes('/cooking')) {
      handleCooking(chatId, userProfile);
    } else if (lowerText.includes('/help') || lowerText.includes('помощь')) {
      handleHelp(chatId, userProfile);
    } else if (lowerText === 'меню') {
      sendMainMenu(chatId);
    }
    
  } catch (error) {
    Logger.log(`Ошибка обработки команды меню для ${chatId}: ${error.message}`);
    sendText(chatId, "Произошла ошибка при обработке команды. Попробуйте еще раз.");
  }
}

/**
 * Обрабатывает команду "показать меню"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleShowMenu(chatId, userProfile) {
  try {
    // Проверяем, завершен ли онбординг
    if (!userProfile.onboardingCompleted) {
      sendText(chatId, "Для создания персонального меню нужно сначала завершить знакомство. Расскажите мне о своих целях и предпочтениях!");
      return;
    }
    
    // Проверяем наличие базовой информации
    if (!userProfile.name || !userProfile.goal) {
      const prompt = `Пользователь просит показать меню, но у него неполный профиль. 
      Профиль: ${JSON.stringify(userProfile)}
      
      Объясни дружелюбно, что для создания персонального меню нужна дополнительная информация, и попроси недостающие данные (возраст, цель, предпочтения в еде).`;
      
      const aiResponse = callGemini(prompt, { temperature: 0.7, maxTokens: 500 });
      
      if (aiResponse) {
        sendText(chatId, aiResponse);
        addToConversationHistory(chatId, 'assistant', aiResponse);
      } else {
        sendText(chatId, "Для создания персонального меню мне нужно больше информации о вас. Расскажите о своих целях, возрасте и предпочтениях в питании!");
      }
      return;
    }
    
    // Генерируем меню через ИИ
    generateAIMenu(chatId, userProfile);
    
  } catch (error) {
    Logger.log(`Ошибка создания меню для ${chatId}: ${error.message}`);
    sendText(chatId, "Произошла ошибка при создании меню. Попробуйте еще раз через несколько секунд.");
  }
}

/**
 * Генерирует меню через ИИ
 * @param {string|number} chatId - ID чата  
 * @param {Object} userProfile - Профиль пользователя
 */
function generateAIMenu(chatId, userProfile) {
  try {
    sendText(chatId, "🤖 Создаю для вас персональное меню... Это может занять до минуты.");
    
    const prompt = `Ты - опытный диетолог. Создай персональное меню на день для пользователя.

ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ:
- Имя: ${userProfile.name}
- Возраст: ${userProfile.age || 'не указан'}
- Цель: ${userProfile.goal || 'не указана'}
- Тип питания: ${userProfile.dietType || 'обычное'}
- Аллергии: ${userProfile.allergies ? userProfile.allergies.join(', ') : 'нет'}
- Нелюбимые продукты: ${userProfile.dislikedProducts ? userProfile.dislikedProducts.join(', ') : 'нет'}
- Любимые продукты: ${userProfile.favoriteProducts ? userProfile.favoriteProducts.join(', ') : 'нет'}
- Бюджет: ${userProfile.monthlyBudget || 'не указан'}
- Время на готовку: ${userProfile.cookingTime || 'не указано'}

ЗАДАЧА:
Создай сбалансированное меню на день (завтрак, обед, ужин) с учетом:
1. Целей пользователя
2. Его предпочтений и ограничений
3. Доступности продуктов
4. Простоты приготовления

ФОРМАТ ОТВЕТА:
🍽️ **Персональное меню для ${userProfile.name}**

**ЗАВТРАК** 🌅
- Название блюда
- Краткое описание (2-3 предложения)
- Примерные КБЖУ

**ОБЕД** 🌞  
- Название блюда
- Краткое описание (2-3 предложения)
- Примерные КБЖУ

**УЖИН** 🌙
- Название блюда
- Краткое описание (2-3 предложения)
- Примерные КБЖУ

**Итого за день:** примерное общее КБЖУ

💡 **Совет дня:** персональная рекомендация

Используй эмодзи умеренно и делай текст читаемым.`;

    const aiResponse = callGemini(prompt, { temperature: 0.8, maxTokens: 1500 });
    
    if (aiResponse) {
      sendText(chatId, aiResponse);
      addToConversationHistory(chatId, 'assistant', aiResponse);
      
      // Сохраняем меню в профиле
      updateUserProfileField(chatId, 'lastGeneratedMenu', {
        date: new Date().toISOString(),
        menu: aiResponse
      });
      
      // Предлагаем дальнейшие действия
      const keyboard = {
        inline_keyboard: [
          [
            { text: "🛒 Список покупок", callback_data: "shopping_list" },
            { text: "👨‍🍳 Рецепты", callback_data: "get_recipes" }
          ],
          [
            { text: "🔄 Другое меню", callback_data: "regenerate_menu" },
            { text: "📝 Настроить меню", callback_data: "customize_menu" }
          ]
        ]
      };
      
      sendText(chatId, "Что хотите сделать дальше?", keyboard);
      
    } else {
      sendText(chatId, "Извините, произошла ошибка при создании меню. Попробуйте еще раз через несколько минут.");
    }
    
  } catch (error) {
    Logger.log(`Ошибка генерации ИИ-меню для ${chatId}: ${error.message}`);
    sendText(chatId, "Произошла ошибка при создании меню. Попробуйте позже.");
  }
}

/**
 * Обрабатывает команду "список покупок"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleShoppingList(chatId, userProfile) {
  const message = "🛒 Функция списка покупок будет доступна после создания меню. Сначала попросите меня создать меню!";
  sendText(chatId, message);
}

/**
 * Обрабатывает команду "настройки"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleSettings(chatId, userProfile) {
  const settingsText = `⚙️ **Ваш профиль:**

👤 Имя: ${userProfile.name || 'не указано'}
🎯 Цель: ${userProfile.goal || 'не указана'}
📅 Возраст: ${userProfile.age || 'не указан'}
🍽️ Тип питания: ${userProfile.dietType || 'обычное'}
🚫 Аллергии: ${userProfile.allergies ? userProfile.allergies.join(', ') : 'нет'}
💰 Бюджет: ${userProfile.monthlyBudget || 'не указан'}

Что хотите изменить?`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "👤 Изменить имя", callback_data: "edit_name" },
        { text: "🎯 Изменить цель", callback_data: "edit_goal" }
      ],
      [
        { text: "🍽️ Тип питания", callback_data: "edit_diet" },
        { text: "🚫 Ограничения", callback_data: "edit_restrictions" }
      ],
      [
        { text: "💰 Бюджет", callback_data: "edit_budget" },
        { text: "🔄 Сбросить профиль", callback_data: "reset_profile" }
      ]
    ]
  };
  
  sendText(chatId, settingsText, keyboard);
}

/**
 * Обрабатывает команду замены продукта
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Текст сообщения
 * @param {Object} userProfile - Профиль пользователя
 */
function handleProductReplacement(chatId, messageText, userProfile) {
  const message = "🔄 Напишите: 'замена [продукт]', например 'замена творог', и я предложу альтернативы!";
  sendText(chatId, message);
}

/**
 * Обрабатывает команду "что готовим"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleCooking(chatId, userProfile) {
  const message = "👨‍🍳 Рецепты будут доступны после создания меню. Сначала попросите показать меню!";
  sendText(chatId, message);
}

/**
 * Обрабатывает команду помощи
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleHelp(chatId, userProfile) {
  const helpText = `🤖 **SmartPit - ваш ИИ-помощник по питанию!**

**Основные команды:**
🍽️ "показать меню" - создать персональное меню
🛒 "список покупок" - план покупок
⚙️ "настройки" - управление профилем  
🔄 "замена [продукт]" - найти альтернативы
👨‍🍳 "что готовим" - рецепты блюд

**Возможности:**
• Персональные планы питания
• Учет ваших целей и ограничений
• Умные рекомендации по продуктам
• Помощь с планированием покупок
• Ответы на вопросы о питании

**Просто общайтесь со мной!** 💬
Задавайте вопросы о питании, просите советы или используйте команды выше.`;

  sendText(chatId, helpText);
}

/**
 * Отправляет главное меню с кнопками
 * @param {string|number} chatId - ID чата
 */
function sendMainMenu(chatId) {
  const mainMenu = getMainMenu(chatId);
  const text = "Чем могу помочь?";
  sendText(chatId, text, mainMenu);
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
    // Проверяем, редактирует ли пользователь поле профиля
    if (userProfile.editingField) {
      handleFieldEdit(chatId, messageText, userProfile.editingField);
      return;
    }
    
    // Проверяем, ожидается ли кастомизация меню
    if (userProfile.waitingForCustomization) {
      handleMenuCustomization(chatId, messageText, userProfile);
      return;
    }
    
    // Проверяем команды замены продуктов
    if (messageText.toLowerCase().includes('замена ')) {
      handleProductReplacementText(chatId, messageText, userProfile);
      return;
    }
    
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
 * Обрабатывает редактирование поля профиля
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Новое значение
 * @param {string} fieldName - Название поля
 */
function handleFieldEdit(chatId, messageText, fieldName) {
  try {
    let success = false;
    let message = '';
    
    switch (fieldName) {
      case 'name':
        success = updateUserProfileField(chatId, 'name', messageText);
        message = success ? `✅ Имя обновлено: ${messageText}` : '❌ Ошибка обновления имени';
        break;
        
      case 'restrictions':
        const restrictions = messageText.split(',').map(item => item.trim()).filter(item => item);
        success = updateUserProfileField(chatId, 'allergies', restrictions);
        message = success ? `✅ Ограничения обновлены: ${restrictions.join(', ')}` : '❌ Ошибка обновления ограничений';
        break;
        
      case 'budget':
        const budget = parseInt(messageText.replace(/\D/g, ''));
        if (budget > 0) {
          success = updateUserProfileField(chatId, 'monthlyBudget', budget);
          message = success ? `✅ Бюджет обновлен: ${budget} рублей` : '❌ Ошибка обновления бюджета';
        } else {
          message = '❌ Пожалуйста, укажите корректную сумму в рублях';
        }
        break;
        
      default:
        message = '❌ Неизвестное поле для редактирования';
    }
    
    // Сбрасываем состояние редактирования
    updateUserProfileField(chatId, 'editingField', null);
    
    sendText(chatId, message);
    
    // Показываем обновленные настройки
    if (success) {
      setTimeout(() => {
        const updatedProfile = getUserProfile(chatId);
        handleSettings(chatId, updatedProfile);
      }, 1000);
    }
    
  } catch (error) {
    Logger.log(`Ошибка редактирования поля ${fieldName} для ${chatId}: ${error.message}`);
    sendText(chatId, "Произошла ошибка при обновлении. Попробуйте еще раз.");
  }
}

/**
 * Обрабатывает кастомизацию меню
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Пожелания по изменению меню
 * @param {Object} userProfile - Профиль пользователя
 */
function handleMenuCustomization(chatId, messageText, userProfile) {
  try {
    sendText(chatId, "🤖 Создаю кастомизированное меню с учетом ваших пожеланий...");
    
    const prompt = `Ты - опытный диетолог. Измени меню для пользователя с учетом его новых пожеланий.

ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:
- Имя: ${userProfile.name}
- Цель: ${userProfile.goal}
- Тип питания: ${userProfile.dietType || 'обычное'}
- Ограничения: ${userProfile.allergies ? userProfile.allergies.join(', ') : 'нет'}

ПОСЛЕДНЕЕ МЕНЮ:
${userProfile.lastGeneratedMenu ? userProfile.lastGeneratedMenu.menu : 'Меню не создано'}

ПОЖЕЛАНИЯ ПОЛЬЗОВАТЕЛЯ:
"${messageText}"

Создай новое персональное меню, учитывая все пожелания пользователя. Объясни, какие изменения ты сделал.

ФОРМАТ:
🍽️ **Кастомизированное меню для ${userProfile.name}**

[Меню в том же формате, что и раньше]

📝 **Изменения:**
- Что изменено по сравнению с предыдущим меню
- Как учтены пожелания пользователя`;

    const aiResponse = callGemini(prompt, { temperature: 0.8, maxTokens: 2000 });
    
    if (aiResponse) {
      sendText(chatId, aiResponse);
      addToConversationHistory(chatId, 'assistant', aiResponse);
      
      // Сохраняем новое меню
      updateUserProfileField(chatId, 'lastGeneratedMenu', {
        date: new Date().toISOString(),
        menu: aiResponse,
        customized: true
      });
      
      // Предлагаем дальнейшие действия
      const keyboard = {
        inline_keyboard: [
          [
            { text: "🛒 Список покупок", callback_data: "shopping_list" },
            { text: "👨‍🍳 Рецепты", callback_data: "get_recipes" }
          ],
          [
            { text: "🔄 Еще изменить", callback_data: "customize_menu" },
            { text: "✅ Оставить так", callback_data: "menu_accepted" }
          ]
        ]
      };
      
      sendText(chatId, "Что хотите сделать дальше?", keyboard);
      
    } else {
      sendText(chatId, "Не удалось создать кастомизированное меню. Попробуйте переформулировать ваши пожелания.");
    }
    
    // Сбрасываем состояние ожидания кастомизации
    updateUserProfileField(chatId, 'waitingForCustomization', false);
    
  } catch (error) {
    Logger.log(`Ошибка кастомизации меню для ${chatId}: ${error.message}`);
    sendText(chatId, "Произошла ошибка при создании кастомизированного меню.");
    updateUserProfileField(chatId, 'waitingForCustomization', false);
  }
}

/**
 * Обрабатывает текстовые команды замены продуктов
 * @param {string|number} chatId - ID чата
 * @param {string} messageText - Текст с командой замены
 * @param {Object} userProfile - Профиль пользователя
 */
function handleProductReplacementText(chatId, messageText, userProfile) {
  try {
    const product = messageText.toLowerCase().replace('замена ', '').trim();
    
    if (!product) {
      sendText(chatId, "Пожалуйста, укажите продукт для замены. Например: 'замена творог'");
      return;
    }
    
    const prompt = `Пользователь хочет заменить продукт "${product}".

ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:
- Цель: ${userProfile.goal || 'не указана'}
- Тип питания: ${userProfile.dietType || 'обычное'}
- Ограничения: ${userProfile.allergies ? userProfile.allergies.join(', ') : 'нет'}

Предложи 3-5 хороших альтернатив этому продукту с учетом:
1. Похожей пищевой ценности
2. Целей пользователя
3. Его ограничений
4. Доступности в магазинах

Для каждой альтернативы кратко объясни, почему она подходит.

ФОРМАТ:
🔄 **Замена для "${product}"**

1. **[Продукт]** - причина
2. **[Продукт]** - причина
3. **[Продукт]** - причина

💡 **Совет:** дополнительная рекомендация`;

    const aiResponse = callGemini(prompt, { temperature: 0.7, maxTokens: 800 });
    
    if (aiResponse) {
      sendText(chatId, aiResponse);
      addToConversationHistory(chatId, 'assistant', aiResponse);
    } else {
      sendText(chatId, `Для замены ${product} попробуйте: похожие по составу продукты, учитывающие ваши цели и ограничения.`);
    }
    
  } catch (error) {
    Logger.log(`Ошибка замены продукта для ${chatId}: ${error.message}`);
    sendText(chatId, "Произошла ошибка при поиске замены. Попробуйте еще раз.");
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

/**
 * Расширенная обработка callback query для ИИ-ассистента
 * @param {Object} callbackQuery - Объект callback query
 */
function handleCallbackQuery(callbackQuery) {
  try {
    const data = callbackQuery.data;
    const chatId = callbackQuery.from.id;
    const userProfile = getUserProfile(chatId);
    
    // Отвечаем на callback query сразу
    answerCallbackQuery(callbackQuery.id);
    
    // Обрабатываем callback'ы меню
    switch (data) {
      case 'menu_nutrition':
      case 'show_menu':
        handleShowMenu(chatId, userProfile);
        break;
        
      case 'shopping_list':
        handleShoppingListCallback(chatId, userProfile);
        break;
        
      case 'get_recipes':
        handleGetRecipes(chatId, userProfile);
        break;
        
      case 'regenerate_menu':
        handleRegenerateMenu(chatId, userProfile);
        break;
        
      case 'customize_menu':
        handleCustomizeMenu(chatId, userProfile);
        break;
        
      case 'settings':
        handleSettings(chatId, userProfile);
        break;
        
      case 'edit_name':
        handleEditName(chatId);
        break;
        
      case 'edit_goal':
        handleEditGoal(chatId);
        break;
        
      case 'edit_diet':
        handleEditDiet(chatId);
        break;
        
      case 'edit_restrictions':
        handleEditRestrictions(chatId);
        break;
        
      case 'edit_budget':
        handleEditBudget(chatId);
        break;
        
      case 'reset_profile':
        handleResetProfile(chatId);
        break;
        
      // Обработка выбора цели
      case 'goal_weight_loss':
        updateUserProfileField(chatId, 'goal', 'похудение');
        sendText(chatId, "✅ Цель обновлена: Похудение");
        handleSettings(chatId, userProfile);
        break;
        
      case 'goal_gain_weight':
        updateUserProfileField(chatId, 'goal', 'набор массы');
        sendText(chatId, "✅ Цель обновлена: Набор массы");
        handleSettings(chatId, userProfile);
        break;
        
      case 'goal_maintain':
        updateUserProfileField(chatId, 'goal', 'поддержание веса');
        sendText(chatId, "✅ Цель обновлена: Поддержание веса");
        handleSettings(chatId, userProfile);
        break;
        
      case 'goal_fitness':
        updateUserProfileField(chatId, 'goal', 'улучшение формы');
        sendText(chatId, "✅ Цель обновлена: Улучшение формы");
        handleSettings(chatId, userProfile);
        break;
        
      // Обработка выбора типа питания
      case 'diet_regular':
        updateUserProfileField(chatId, 'dietType', 'обычное');
        sendText(chatId, "✅ Тип питания обновлен: Обычное");
        handleSettings(chatId, userProfile);
        break;
        
      case 'diet_vegetarian':
        updateUserProfileField(chatId, 'dietType', 'вегетарианское');
        sendText(chatId, "✅ Тип питания обновлен: Вегетарианское");
        handleSettings(chatId, userProfile);
        break;
        
      case 'diet_vegan':
        updateUserProfileField(chatId, 'dietType', 'веганское');
        sendText(chatId, "✅ Тип питания обновлен: Веганское");
        handleSettings(chatId, userProfile);
        break;
        
      case 'diet_keto':
        updateUserProfileField(chatId, 'dietType', 'кето');
        sendText(chatId, "✅ Тип питания обновлен: Кето");
        handleSettings(chatId, userProfile);
        break;
        
      case 'diet_gluten_free':
        updateUserProfileField(chatId, 'dietType', 'безглютеновое');
        sendText(chatId, "✅ Тип питания обновлен: Безглютеновое");
        handleSettings(chatId, userProfile);
        break;
        
      case 'diet_lactose_free':
        updateUserProfileField(chatId, 'dietType', 'безлактозное');
        sendText(chatId, "✅ Тип питания обновлен: Безлактозное");
        handleSettings(chatId, userProfile);
        break;
        
      // Подтверждение сброса профиля
      case 'confirm_reset':
        resetUserProfile(chatId);
        sendText(chatId, "🔄 Профиль сброшен! Давайте знакомиться заново.");
        startAiOnboarding(chatId, {first_name: 'Пользователь'}, createEmptyProfile());
        break;
        
      case 'cancel_reset':
        sendText(chatId, "❌ Отменено. Ваш профиль остается без изменений.");
        handleSettings(chatId, userProfile);
        break;
        
      default:
        // Если callback не найден, используем старую логику
        if (typeof handleCallbackQueryOriginal === 'function') {
          handleCallbackQueryOriginal(callbackQuery);
        } else {
          sendText(chatId, "Извините, не удалось обработать это действие. Попробуйте еще раз.");
        }
    }
    
  } catch (error) {
    Logger.log(`Ошибка обработки callback query: ${error.message}`);
    sendText(callbackQuery.from.id, "Произошла ошибка. Попробуйте еще раз.");
  }
}

/**
 * Обрабатывает callback "список покупок"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleShoppingListCallback(chatId, userProfile) {
  if (!userProfile.lastGeneratedMenu) {
    sendText(chatId, "Сначала создайте меню, и я составлю список покупок!");
    return;
  }
  
  const prompt = `На основе этого меню составь список покупок:

${userProfile.lastGeneratedMenu.menu}

Создай структурированный список покупок по категориям:
🥬 Овощи и зелень
🥩 Мясо и рыба  
🥛 Молочные продукты
🍞 Хлеб и крупы
🧄 Приправы и соусы

Указывай примерные количества для одного человека.`;

  const aiResponse = callGemini(prompt, { temperature: 0.5, maxTokens: 1000 });
  
  if (aiResponse) {
    sendText(chatId, `🛒 **Список покупок**\n\n${aiResponse}`);
    addToConversationHistory(chatId, 'assistant', aiResponse);
  } else {
    sendText(chatId, "Не удалось составить список покупок. Попробуйте позже.");
  }
}

/**
 * Обрабатывает callback "рецепты"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleGetRecipes(chatId, userProfile) {
  if (!userProfile.lastGeneratedMenu) {
    sendText(chatId, "Сначала создайте меню, и я дам рецепты!");
    return;
  }
  
  sendText(chatId, "👨‍🍳 Готовлю детальные рецепты...");
  
  const prompt = `Для этого меню дай подробные рецепты приготовления:

${userProfile.lastGeneratedMenu.menu}

Для каждого блюда укажи:
- Ингредиенты с количествами
- Пошаговый рецепт
- Время приготовления
- Полезные советы

Делай рецепты простыми и понятными.`;

  const aiResponse = callGemini(prompt, { temperature: 0.6, maxTokens: 2000 });
  
  if (aiResponse) {
    sendText(chatId, `👨‍🍳 **Рецепты**\n\n${aiResponse}`);
    addToConversationHistory(chatId, 'assistant', aiResponse);
  } else {
    sendText(chatId, "Не удалось загрузить рецепты. Попробуйте позже.");
  }
}

/**
 * Обрабатывает callback "другое меню"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleRegenerateMenu(chatId, userProfile) {
  sendText(chatId, "🔄 Создаю новый вариант меню...");
  generateAIMenu(chatId, userProfile);
}

/**
 * Обрабатывает callback "настроить меню"
 * @param {string|number} chatId - ID чата
 * @param {Object} userProfile - Профиль пользователя
 */
function handleCustomizeMenu(chatId, userProfile) {
  const message = "📝 Расскажите, что хотите изменить в меню?\n\nНапример:\n• Убрать определенные продукты\n• Добавить больше белка\n• Сделать веганское меню\n• Учесть бюджетные ограничения";
  sendText(chatId, message);
  
  // Устанавливаем состояние ожидания кастомизации
  updateUserProfileField(chatId, 'waitingForCustomization', true);
}

/**
 * Обрабатывает редактирование имени
 * @param {string|number} chatId - ID чата
 */
function handleEditName(chatId) {
  sendText(chatId, "👤 Как вас зовут? Напишите новое имя:");
  updateUserProfileField(chatId, 'editingField', 'name');
}

/**
 * Обрабатывает редактирование цели
 * @param {string|number} chatId - ID чата
 */
function handleEditGoal(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "🔥 Похудение", callback_data: "goal_weight_loss" },
        { text: "💪 Набор массы", callback_data: "goal_gain_weight" }
      ],
      [
        { text: "⚖️ Поддержание веса", callback_data: "goal_maintain" },
        { text: "🏃 Улучшение формы", callback_data: "goal_fitness" }
      ]
    ]
  };
  
  sendText(chatId, "🎯 Выберите вашу цель:", keyboard);
}

/**
 * Обрабатывает редактирование типа питания
 * @param {string|number} chatId - ID чата
 */
function handleEditDiet(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "🍽️ Обычное", callback_data: "diet_regular" },
        { text: "🥬 Вегетарианское", callback_data: "diet_vegetarian" }
      ],
      [
        { text: "🌱 Веганское", callback_data: "diet_vegan" },
        { text: "🥩 Кето", callback_data: "diet_keto" }
      ],
      [
        { text: "🍞 Безглютеновое", callback_data: "diet_gluten_free" },
        { text: "🥛 Безлактозное", callback_data: "diet_lactose_free" }
      ]
    ]
  };
  
  sendText(chatId, "🍽️ Выберите тип питания:", keyboard);
}

/**
 * Обрабатывает редактирование ограничений
 * @param {string|number} chatId - ID чата
 */
function handleEditRestrictions(chatId) {
  sendText(chatId, "🚫 Напишите ваши пищевые ограничения и аллергии через запятую:\n\nНапример: орехи, молоко, глютен");
  updateUserProfileField(chatId, 'editingField', 'restrictions');
}

/**
 * Обрабатывает редактирование бюджета
 * @param {string|number} chatId - ID чата
 */
function handleEditBudget(chatId) {
  sendText(chatId, "💰 Укажите примерный месячный бюджет на питание в рублях:\n\nНапример: 15000");
  updateUserProfileField(chatId, 'editingField', 'budget');
}

/**
 * Обрабатывает сброс профиля
 * @param {string|number} chatId - ID чата
 */
function handleResetProfile(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Да, сбросить", callback_data: "confirm_reset" },
        { text: "❌ Отмена", callback_data: "cancel_reset" }
      ]
    ]
  };
  
  sendText(chatId, "⚠️ **Внимание!**\n\nВы действительно хотите сбросить весь профиль? Вся информация будет удалена и придется заново проходить знакомство.", keyboard);
}