/**
 * Модуль для взаимодействия с Google Gemini API.
 */

/**
 * Вызывает модель Gemini Flash с заданным промтом.
 * @param {string} prompt - Текстовый промт для нейросети.
 * @returns {string|null} - Сгенерированный нейросетью текст или null в случае ошибки.
 */
function callGemini(prompt) {
  const scriptProps = PropertiesService.getScriptProperties();
  const apiKey = scriptProps.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    Logger.log("❌ Ошибка: Ключ GEMINI_API_KEY не найден в ScriptProperties.");
    return null;
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true // Важно, чтобы видеть полные ответы об ошибках
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const data = JSON.parse(responseBody);
      // Проверяем наличие текста в ответе
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        Logger.log(`❌ Gemini API вернул успешный статус, но ответ не содержит текста. Ответ: ${responseBody}`);
        return null;
      }
    } else {
      Logger.log(`❌ Ошибка вызова Gemini API. Статус: ${responseCode}. Ответ: ${responseBody}`);
      return null;
    }
  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при вызове UrlFetchApp: ${e.message}`);
    return null;
  }
}
