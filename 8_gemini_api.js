/**
 * Модуль для взаимодействия с Google Gemini API.
 */

/**
 * Вызывает модель Gemini Flash и возвращает структурированный ответ с подробным логированием.
 * @param {string} prompt - Текстовый промт для нейросети.
 * @param {boolean} [isJsonResponse=true] - Ожидается ли JSON в ответе.
 * @returns {object|string} - Распарсенный JSON, строка или объект с ошибкой.
 */
function callGemini(prompt, isJsonResponse = true) {
  const scriptProps = PropertiesService.getScriptProperties();
  const apiKey = scriptProps.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    const errorMsg = 'Ключ GEMINI_API_KEY не найден в ScriptProperties.';
    Logger.log(`❌ ОШИБКА: ${errorMsg}`);
    return { error: 'Ключ не найден', details: errorMsg };
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {}
  };

  if (isJsonResponse) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    connectTimeout: 20000 
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const data = JSON.parse(responseBody);
      // Безопасное извлечение текста
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        const errorMsg = 'Gemini API вернул пустой текстовый ответ.';
        Logger.log(`❌ ОШИБКА: ${errorMsg} Ответ: ${responseBody}`);
        return { error: 'Пустой ответ от AI', details: responseBody };
      }

      if (isJsonResponse) {
        try {
          const cleanJson = rawText.replace(/^```json\s*|```$/g, '');
          return JSON.parse(cleanJson);
        } catch (e) {
          const errorMsg = `Ошибка парсинга JSON от Gemini: ${e.message}`;
          Logger.log(`❌ ОШИБКА: ${errorMsg} Ответ: ${rawText}`);
          return { error: 'Ошибка парсинга ответа AI', details: rawText };
        }
      } else {
        return rawText;
      }
    } else {
      const errorMsg = `Ошибка вызова Gemini API. Статус: ${responseCode}`;
      Logger.log(`❌ ОШИБКА: ${errorMsg} Ответ: ${responseBody}`);
      return { error: `Ошибка API. Статус: ${responseCode}`, details: responseBody };
    }
  } catch (e) {
    const errorMsg = `КРИТИЧЕСКАЯ ОШИБКА при вызове UrlFetchApp: ${e.message}`;
    Logger.log(`❌ ${errorMsg}\nStack: ${e.stack || 'N/A'}`);
    return { error: 'Критическая ошибка сети', details: e.message };
  }
}

/**
 * Анализирует статус вебхука с помощью Gemini.
 * @param {object} webhookInfo - Объект с информацией о вебхуке от Telegram.
 * @param {string} webAppUrl - URL текущего веб-приложения.
 * @returns {object} - Структурированный анализ от Gemini.
 */
function analyzeWebhookStatus(webhookInfo, webAppUrl) {
  const prompt = generateWebhookAnalysisPrompt(webhookInfo, webAppUrl);
  if (!prompt) {
      // Этот случай обрабатывается в getWebhookStatusForDialog, но для надежности оставляем
      return {
          status: "CRITICAL",
          summary: "Вебхук не установлен.",
          details: "Система не обнаружила установленный вебхук для вашего бота.",
          solution: "1. Убедитесь, что вы развернули проект как веб-приложение.\n2. Скопируйте URL развертывания и вставьте его в поле ниже.\n3. Нажмите кнопку 'Установить / Обновить'."
      };
  }
  return callGemini(prompt, true);
}

/**
 * Генерирует промт для анализа статуса вебхука.
 * @param {object} webhookInfo - Информация о вебхуке.
 * @param {string} webAppUrl - URL веб-приложения.
 * @returns {string|null} - Сгенерированный промт или null.
 */
function generateWebhookAnalysisPrompt(webhookInfo, webAppUrl) {
    if (!webhookInfo || !webhookInfo.url) {
        return null; // Вебхук не установлен
    }

    return `
    Ты — технический эксперт, который помогает пользователям Google Apps Script настроить Telegram вебхук.
    Твоя задача — проанализировать JSON-данные о статусе вебхука, сравнить их с ожидаемым URL и дать четкий, полезный и дружелюбный фидбек.

    Вот данные для анализа:
    - Ожидаемый URL веб-приложения: ${webAppUrl}
    - Данные от Telegram API (getWebhookInfo): ${JSON.stringify(webhookInfo, null, 2)}

    Проанализируй эти данные и верни JSON-объект СТРОГО следующей структуры:
    {
      "status": "OK" | "WARNING" | "CRITICAL",
      "summary": "Краткий вердикт на русском языке (до 10 слов)",
      "details": "Подробное объяснение ситуации на русском языке. Что означает текущий статус или ошибка? На что это влияет?",
      "solution": "Пошаговая инструкция на русском языке, что пользователю нужно сделать, чтобы исправить проблему. Если все хорошо, пожелай хорошего дня."
    }

    Критерии для статусов:
    - "OK": URL вебхука ТОЧНО совпадает с ожидаемым URL, и нет сообщений об ошибках (last_error_message is null or empty).
    - "WARNING": URL совпадает, но есть last_error_message. Это означает, что Telegram не может связаться с твоим скриптом. Или есть ожидающие обновления (pending_update_count > 0), что может говорить о проблемах.
    - "CRITICAL": URL вебхука НЕ СОВПАДАЕТ с ожидаемым URL. Это самая главная ошибка, бот не будет работать.

    Проведи анализ и верни только JSON.
  `;
}


/**
 * Генерирует промт для знакомства с пользователем.
 * @param {string} userName - Имя пользователя.
 * @returns {string} - Сгенерированный промт.
 */
function generateAcquaintancePrompt(userName) {
    return `
    Ты — дружелюбный и профессиональный ассистент по питанию SmartPit.
    Твоя задача — познакомиться с пользователем по имени ${userName} и помочь ему настроить профиль для дальнейшей работы.
    Общайся вежливо и задавай вопросы по одному.

    Твой ответ ДОЛЖЕН БЫТЬ в формате JSON.
    Вот структура:
    {
      "text": "Твой основной текст сообщения здесь. Он должен быть информативным и дружелюбным.",
      "buttons": [
        { "text": "Текст для кнопки 1", "callback_data": "айди_кнопки_1" },
        { "text": "Текст для кнопки 2", "callback_data": "айди_кнопки_2" }
      ]
    }

    Начни диалог. Представься и спроси у пользователя, готов ли он начать настройку.
    Предложи две кнопки: "Да, давай начнем!" и "Нет, позже".
    Используй callback_data "start_setup" для "Да" и "cancel_setup" для "Нет".
  `;
}


/**
 * Генерирует промт для следующего шага настройки профиля пользователя.
 * @param {object} userData - Объект с текущими данными пользователя.
 * @param {string} userName - Имя пользователя.
 * @returns {string} - Сгенерированный промт для Gemini.
 */
function generateSetupStepPrompt(userData, userName) {
  const basePrompt = `
Ты — ассистент по питанию SmartPit. Ты помогаешь пользователю ${userName} настроить его профиль.
Твоя задача — задать следующий вопрос, чтобы собрать необходимые данные.
Задавай только ОДИН вопрос за раз. Будь краток и дружелюбен.
Текущие данные профиля: ${JSON.stringify(userData, null, 2)}.

Твой ответ ДОЛЖЕН БЫТЬ в формате JSON: {"text": "Твой вопрос...", "buttons": [...]}.
Если нужны кнопки, используй формат { "text": "Текст кнопки", "callback_data": "callback_данные" }.
Если ввод данных предполагается текстом, верни пустой массив для кнопок.
`;

  if (!userData.gender) {
    return basePrompt + `
Спроси пол пользователя.
Предложи две кнопки: "Мужской" и "Женский".
Используй callback_data: "set_gender:male" и "set_gender:female".
`;
  }
  if (!userData.age) {
    return basePrompt + `
Спроси возраст пользователя (полных лет).
Попроси пользователя просто отправить число в ответ.
Кнопки не нужны.
`;
  }
  if (!userData.height) {
    return basePrompt + `
Спроси рост пользователя в сантиметрах.
Попроси пользователя просто отправить число в ответ.
Кнопки не нужны.
`;
  }
  if (!userData.weight) {
    return basePrompt + `
Спроси вес пользователя в килограммах.
Попроси пользователя просто отправить число в ответ.
Кнопки не нужны.
`;
  }
  if (!userData.goal) {
    return basePrompt + `
Спроси основную цель пользователя.
Предложи три кнопки: "Сбросить вес", "Поддерживать вес", "Набрать массу".
Используй callback_data: "set_goal:loss", "set_goal:maintenance", "set_goal:gain".
`;
  }
  if (!userData.activityLevel) {
    return basePrompt + `
Спроси об уровне физической активности.
Предложи кнопки с вариантами:
1.  "Минимальная" (сидячая работа, нет тренировок)
2.  "Легкая" (тренировки 1-3 раза в неделю)
3.  "Средняя" (тренировки 3-5 раз в неделю)
4.  "Высокая" (интенсивные тренировки 6-7 раз в неделю)
5.  "Экстремальная" (тяжелая физическая работа или спорт)

Используй callback_data: "set_activity:minimal", "set_activity:light", "set_activity:medium", "set_activity:high", "set_activity:extreme".
`;
  }

  // Если все данные собраны
  return `
Ты — ассистент по питанию SmartPit. Ты помогаешь пользователю ${userName} настроить его профиль.
Все данные успешно собраны: ${JSON.stringify(userData, null, 2)}.

Твоя задача — сообщить пользователю, что настройка завершена, и кратко показать собранные данные.
Поблагодари за ответы.
Сообщи, что теперь он может использовать основные функции бота, например, команду /meal для записи приема пищи.

Твой ответ ДОЛЖЕН БЫТЬ в формате JSON: {"text": "Твой текст...", "buttons": []}.
Кнопки не нужны.
`;
}

/**
 * Генерирует промт для создания меню на день.
 * @param {object} userData - Данные пользователя (включая КБЖУ).
 * @returns {string} - Сгенерированный промт для Gemini.
 */
function generateMenuPrompt(userData) {
  const { name, goal, calories, proteins, fats, carbs, preferences, allergies } = userData;

  return `
  Ты — AI-диетолог высочайшего класса. Твоя задача — создать персонализированное, сбалансированное и вкусное меню на один день для пользователя по имени ${name}.

  **АНАЛИЗ ПОЛЬЗОВАТЕЛЯ:**
  - **Цель:** ${goal}
  - **Суточная норма:** ${calories} ккал, Белки: ${proteins}г, Жиры: ${fats}г, Углеводы: ${carbs}г.
  - **Предпочтения:** ${preferences || 'Не указаны'}
  - **Аллергии/исключения:** ${allergies || 'Не указаны'}

  **ТРЕБОВАНИЯ К МЕНЮ:**
  1.  **Структура:** Меню должно включать 3-5 приемов пищи (например, Завтрак, Обед, Ужин, и опционально 1-2 перекуса).
  2.  **Баланс:** Распредели КБЖУ в течение дня. Завтрак и обед должны быть более калорийными, ужин — легче. Белки должны присутствовать в каждом основном приеме пищи.
  3.  **Простота:** Рецепты должны быть простыми, быстрыми в приготовлении (не более 30-40 минут на блюдо) и из доступных продуктов.
  4.  **Разнообразие:** Не используй один и тот же продукт слишком часто. Предложи разнообразные блюда.

  **ФОРМАТ ОТВЕТА:**
  Верни JSON-объект СТРОГО следующей структуры. Не добавляй никаких лишних символов или текста до или после JSON.

  {
    "summary": {
      "total_calories": <число>,
      "total_proteins": <число>,
      "total_fats": <число>,
      "total_carbs": <число>
    },
    "meals": [
      {
        "name": "Завтрак",
        "recipe_name": "Название блюда",
        "description": "Краткое описание блюда, почему оно полезно.",
        "calories": <число>,
        "proteins": <число>,
        "fats": <число>,
        "carbs": <число>,
        "ingredients": [
          { "name": "Продукт 1", "amount": "100 г" },
          { "name": "Продукт 2", "amount": "1 шт" }
        ],
        "instructions": [
          "Шаг 1. ...",
          "Шаг 2. ..."
        ]
      },
      // ... другие приемы пищи в таком же формате
    ]
  }

  Проанализируй данные и создай идеальное меню для ${name}.
  `;
}