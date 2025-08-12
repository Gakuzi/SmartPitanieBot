/**
 * @file doPost.js
 * @description Единая точка входа для обработки webhook'ов от Telegram через ИИ-ассистента.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Получен пустой или некорректный запрос от Telegram.');
      return;
    }
    const data = JSON.parse(e.postData.contents);
    
    // --- РЕЖИМ ИИ-АССИСТЕНТА ---
    // Передаем все данные в ИИ-ассистент для интеллектуальной обработки
    aiAssistant(data);
    // --- КОНЕЦ РЕЖИМА ИИ-АССИСТЕНТА ---


  } catch (err) {
    Logger.log(`КРИТИЧЕСКАЯ ОШИБКА в doPost: ${err.message}\nСтек: ${err.stack}`);
  }
}
