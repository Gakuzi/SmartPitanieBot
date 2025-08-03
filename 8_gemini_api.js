/**
 * Модуль для взаимодействия с Google Gemini API.
 */

/**
 * Вызывает модель Gemini Flash с заданным промтом.
 * @param {string} prompt - Текстовый промт для нейросети.
 * @returns {string|null} - Сгенерированный нейросетью текст или null в случае ошибки.
 */
function callGemini(prompt, chatId) {
  if (chatId) sendText(chatId, "DEBUG: Inside callGemini.");
  const scriptProps = PropertiesService.getScriptProperties();
  const apiKey = scriptProps.getProperty('GEMINI_API_KEY');

  if (!apiKey) {
    Logger.log("❌ Ошибка: Ключ GEMINI_API_KEY не найден в ScriptProperties.");
    if (chatId) sendText(chatId, "DEBUG: ERROR - GEMINI_API_KEY not found.");
    return null;
  }
  if (chatId) sendText(chatId, "DEBUG: API Key found.");

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
    muteHttpExceptions: true
  };

  try {
    if (chatId) sendText(chatId, "DEBUG: Fetching Gemini API...");
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    if (chatId) sendText(chatId, `DEBUG: API Response Code: ${responseCode}`);

    if (responseCode === 200) {
      const data = JSON.parse(responseBody);
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        const textResponse = data.candidates[0].content.parts[0].text.trim();
        if (chatId) sendText(chatId, `DEBUG: Gemini success, text extracted: ${textResponse.substring(0, 50)}...`);
        return textResponse;
      } else {
        Logger.log(`❌ Gemini API вернул успешный статус, но ответ не содержит текста. Ответ: ${responseBody}`);
        if (chatId) sendText(chatId, `DEBUG: ERROR - Gemini response OK, but no text. Body: ${responseBody}`);
        return null;
      }
    } else {
      Logger.log(`❌ Ошибка вызова Gemini API. Статус: ${responseCode}. Ответ: ${responseBody}`);
      if (chatId) sendText(chatId, `DEBUG: ERROR - Gemini API call failed. Status: ${responseCode}. Body: ${responseBody}`);
      return null;
    }
  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при вызове UrlFetchApp: ${e.message}`);
    if (chatId) sendText(chatId, `DEBUG: CRITICAL ERROR - UrlFetchApp failed: ${e.message}`);
    return null;
  }
}
