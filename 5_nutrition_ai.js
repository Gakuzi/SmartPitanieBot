/**
 * @file 5_nutrition_ai.js
 * @description Модуль для работы с AI, расчетом КБЖУ и ведения диалогов.
 */

// --- AI-модуль: Расчет КБЖУ ---
function calculateNutrition(userData) {
  const { weight, height, age, gender, activityLevel, goal } = userData;

  // Проверка на наличие всех данных
  if (!weight || !height || !age || !gender || !activityLevel || !goal) {
    Logger.log(`❌ Недостаточно данных для расчета КБЖУ для пользователя. Данные: ${JSON.stringify(userData)}`);
    return null;
  }

  // 1. Расчет базового метаболизма (BMR) по формуле Миффлина-Сан Жеора
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else { // female
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // 2. Коррекция на активность
  const activityMultipliers = {
    minimal: 1.2,
    light: 1.375,
    medium: 1.55,
    high: 1.725,
    extreme: 1.9
  };
  const tdee = bmr * (activityMultipliers[activityLevel] || 1.2);

  // 3. Коррекция на цель
  const goalMultipliers = { 
    loss: 0.85, 
    maintenance: 1.0, 
    gain: 1.15 
  };
  const finalCalories = Math.round(tdee * (goalMultipliers[goal] || 1.0));

  // 4. Расчет БЖУ (в граммах)
  const bjuRatios = {
    loss:        { p: 0.40, f: 0.30, c: 0.30 }, // Белок выше для сохранения мышц
    maintenance: { p: 0.30, f: 0.30, c: 0.40 },
    gain:        { p: 0.30, f: 0.25, c: 0.45 }  // Углеводы выше для энергии
  };
  const ratio = bjuRatios[goal] || bjuRatios['maintenance'];
  const proteins = Math.round((finalCalories * ratio.p) / 4);
  const fats = Math.round((finalCalories * ratio.f) / 9);
  const carbs = Math.round((finalCalories * ratio.c) / 4);

  return { calories: finalCalories, proteins, fats, carbs };
}

/**
 * Запускает расчет КБЖУ и сохраняет результат.
 * @param {string|number} chatId - ID чата.
 * @param {object} userData - Полные данные пользователя.
 */
function triggerNutritionCalculation(chatId, userData) {
    const nutrition = calculateNutrition(userData);
    if (!nutrition) {
        sendText(chatId, "Произошла ошибка при расчете КБЖУ. Не все данные были заполнены.");
        return;
    }
    // Сохраняем рассчитанные данные
    let finalUserData = saveUserParam(chatId, 'calories', nutrition.calories);
    finalUserData = saveUserParam(chatId, 'proteins', nutrition.proteins);
    finalUserData = saveUserParam(chatId, 'fats', nutrition.fats);
    finalUserData = saveUserParam(chatId, 'carbs', nutrition.carbs);

    // Отправляем результат пользователю
    const message = `🤖 *Ваша персональная норма КБЖУ рассчитана:*

` +
                    `*Калории:* ${nutrition.calories} ккал/день\n` +
                    `*Белки:* ${nutrition.proteins} г/день\n` +
                    `*Жиры:* ${nutrition.fats} г/день\n` +
                    `*Углеводы:* ${nutrition.carbs} г/день\n\n` +
                    `Я буду использовать эти данные для дальнейших рекомендаций.`;
    sendText(chatId, message);
}


// --- AI-модуль: Диалоги --- 

/**
 * Начинает диалог настройки профиля.
 * @param {string|number} chatId - ID чата.
 * @param {string} userName - Имя пользователя.
 */
function startSetupDialog(chatId, userName) {
  if (!isAiModeEnabled()) {
    sendText(chatId, "🤖 AI-ассистент в данный момент отключен администратором. Пожалуйста, воспользуйтесь командами из меню для настройки профиля вручную.", getMenu(chatId));
    return;
  }
  // Устанавливаем состояние пользователя
  setUserState(chatId, STATES.AWAITING_SETUP);
  
  // Генерируем первый промт
  const prompt = generateAcquaintancePrompt(userName);
  
  // Вызываем Gemini
  const geminiResponse = callGemini(prompt, chatId);
  
  // Отправляем ответ пользователю
  sendFormattedText(chatId, geminiResponse);
}

/**
 * Продолжает диалог настройки профиля.
 * @param {string|number} chatId - ID чата.
 * @param {string} userName - Имя пользователя.
 * @param {string} userMessage - Ответ пользователя (текст или callback_data).
 */
function continueSetupDialog(chatId, userName, userMessage) {
  let userData = getUserData(chatId) || {};

  // Обработка callback_data
  if (userMessage.startsWith('set_')) {
    const [_, param, value] = userMessage.split(':');
    userData = saveUserParam(chatId, param, value);
  } 
  // Обработка текстового ввода для числовых значений
  else if (!isNaN(parseInt(userMessage))) {
    const lastQuestion = findLastQuestion(userData);
    if (lastQuestion) {
      userData = saveUserParam(chatId, lastQuestion, parseInt(userMessage));
    }
  }

  // Генерируем следующий шаг
  const prompt = generateSetupStepPrompt(userData, userName);
  const geminiResponse = callGemini(prompt, chatId);

  // Отправляем ответ
  sendFormattedText(chatId, geminiResponse);

  // Проверяем, все ли данные собраны
  if (isProfileComplete(userData)) {
    // Сбрасываем состояние
    setUserState(chatId, STATES.IDLE);
    // Запускаем расчет КБЖУ
    triggerNutritionCalculation(chatId, userData);
    // Генерируем меню
    generateMenu(chatId);
  }
}

/**
 * Определяет, какой параметр запрашивался последним.
 * @param {object} userData - Данные пользователя.
 * @returns {string|null} - Ключ параметра ('age', 'height', 'weight') или null.
 */
function findLastQuestion(userData) {
  if (!userData.gender) return null; // Пол - первый, но он с кнопками
  if (!userData.age) return 'age';
  if (!userData.height) return 'height';
  if (!userData.weight) return 'weight';
  return null;
}

/**
 * Проверяет, все ли необходимые для расчета КБЖУ поля заполнены.
 * @param {object} userData - Данные пользователя.
 * @returns {boolean} - true, если профиль полный.
 */
function isProfileComplete(userData) {
    const requiredParams = ['gender', 'age', 'height', 'weight', 'goal', 'activityLevel'];
    return requiredParams.every(param => userData.hasOwnProperty(param) && userData[param] !== null);
}

/**
 * Генерирует меню на день с помощью AI.
 * @param {string|number} chatId - ID чата.
 */
function generateMenu(chatId) {
  const userData = getUserData(chatId);

  if (!isProfileComplete(userData) || !userData.calories) {
    sendText(chatId, "Пожалуйста, сначала полностью завершите настройку вашего профиля, чтобы я мог рассчитать КБЖУ и создать меню.");
    return;
  }

  sendText(chatId, "🤖 Создаю для вас персональное меню... Это может занять до минуты.");

  const prompt = generateMenuPrompt(userData);
  const menuResponse = callGemini(prompt);

  if (menuResponse.error) {
    sendText(chatId, `Произошла ошибка при создании меню: ${menuResponse.error}. Попробуйте позже.`);
    Logger.log(`❌ Ошибка генерации меню для ${chatId}: ${menuResponse.details}`);
    return;
  }

  // Сохраняем меню в данных пользователя
  saveUserParam(chatId, 'todayMenu', menuResponse);

  // Форматируем и отправляем меню пользователю
  const formattedMenu = formatMenuForDisplay(menuResponse);
  sendText(chatId, formattedMenu);
  
  // Предлагаем дальнейшие действия
  const buttons = [
    [{ text: "🛒 Список покупок", callback_data: "get_shopping_list" }],
    [{ text: "🔄 Запросить замену", callback_data: "request_menu_change" }]
  ];
  sendText(chatId, "Что делаем дальше?", { inline_keyboard: buttons });
}

/**
 * Обрабатывает свободный текстовый ввод, передавая его AI, и корректно распаковывает ответ.
 * @param {number|string} chatId - ID чата.
 * @param {string} text - Текст сообщения.
 */
function handleFreeText(chatId, text) {
  sendChatAction(chatId); // Отправляем "печатает..."

  const userData = getUserData(chatId);
  // Промпт обернут в обратные кавычки для корректной обработки многострочности и спецсимволов.
  const prompt = `Ты — AI-диетолог в Telegram-боте. Твой текущий пользователь: ${JSON.stringify(userData)}. Он написал тебе: "${text}".

**ИНСТРУКЦИИ ПО ФОРМАТИРОВАНИЮ:**
1.  **Обязательно используй MarkdownV2 разметку Telegram.**
2.  Твой ответ **ДОЛЖЕН** быть в формате JSON. Не пиши ничего, кроме JSON.

**ФОРМАТ JSON:**
\`\`\`json
{
  "response": "Твой отформатированный в MarkdownV2 и экранированный ответ.",
  "buttons": [
    {"text": "Текст кнопки 1", "callback_data": "action1:value1"}
  ]
}
\`\`\`
`;

  const aiResponse = callGemini(prompt, true); // Запрашиваем JSON

  if (aiResponse && aiResponse.response) {
    const keyboard = aiResponse.buttons ? { inline_keyboard: [aiResponse.buttons] } : getMenu(chatId);
    // Ответ от AI уже должен быть отформатирован и экранирован, поэтому передаем его напрямую
    sendText(chatId, aiResponse.response, keyboard);
  } else if (aiResponse && aiResponse.error) {
    Logger.log(`Ошибка AI при свободном общении для ${chatId}: ${aiResponse.details}`);
    sendText(chatId, `Произошла ошибка AI: ${aiResponse.error}. Попробуйте позже.`, getMenu(chatId));
  } else {
    Logger.log(`Неожиданный ответ от AI для ${chatId}: ${JSON.stringify(aiResponse)}`);
    sendText(chatId, "Произошла непредвиденная ошибка при обращении к AI. Попробуйте позже.", getMenu(chatId));
  }
}

/**
 * Форматирует JSON-объект меню в читаемый текст для Telegram.
 * @param {object} menu - JSON-объект меню.
 * @returns {string} - Отформатированное строковое представление меню.
 */
function formatMenuForDisplay(menu) {
  if (!menu || !menu.meals) return "Ошибка: не удалось отобразить меню.";

  let message = `*Ваше меню на день:*

`;
  message += `*КБЖУ: ${menu.summary.total_calories} ккал, Б:${menu.summary.total_proteins}г, Ж:${menu.summary.total_fats}г, У:${menu.summary.total_carbs}г*

`;

  menu.meals.forEach(meal => {
    message += `*${meal.name}: ${meal.recipe_name}*
`;
    message += `_${meal.description}_
`;
    message += `(КБЖУ: ${meal.calories} ккал, Б:${meal.proteins}г, Ж:${meal.fats}г, У:${meal.carbs}г)

`;
  });

  message += `Чтобы посмотреть рецепты, нажмите "👨‍🍳 Что готовим?".`;

  return message;
}
