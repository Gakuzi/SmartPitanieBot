/**
 * @file 8_gemini_api.js
 * @description Модуль для работы с Google Gemini API для генерации контента с помощью ИИ.
 */

/**
 * Вызывает Gemini API для генерации текста по промпту.
 * @param {string} prompt - Промпт для генерации.
 * @param {Object} [options] - Дополнительные параметры.
 * @returns {string|null} Сгенерированный текст или null в случае ошибки.
 */
function callGemini(prompt, options = {}) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
      Logger.log('❌ ОШИБКА: GEMINI_API_KEY не найден в ScriptProperties');
      return null;
    }

    const {
      temperature = 0.7,
      maxTokens = 1000,
      model = 'gemini-pro'
    } = options;

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topP: 0.8,
        topK: 10
      }
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    Logger.log('🤖 Отправляем запрос к Gemini API');
    
    const response = UrlFetchApp.fetch(url, requestOptions);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      Logger.log('❌ ОШИБКА Gemini API. Код: ' + responseCode + '. Ответ: ' + responseText);
      return null;
    }

    const responseData = JSON.parse(responseText);
    
    if (responseData.candidates && responseData.candidates.length > 0) {
      const candidate = responseData.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const generatedText = candidate.content.parts[0].text;
        Logger.log('✅ Получен ответ от Gemini API');
        return generatedText.trim();
      }
    }

    Logger.log('❌ Неожиданная структура ответа от Gemini API: ' + responseText);
    return null;

  } catch (error) {
    Logger.log('❌ КРИТИЧЕСКАЯ ОШИБКА при вызове Gemini API: ' + error.message);
    return null;
  }
}