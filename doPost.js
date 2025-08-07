/**
 * @file doPost.js
 * @description Единая точка входа. В режиме отладки передает управление в DEBUG_router.js.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Получен пустой или некорректный запрос от Telegram.');
      return;
    }
    const data = JSON.parse(e.postData.contents);
    
    // --- РЕЖИМ ОТЛАДКИ ---
    // Просто передаем все данные в отладочный маршрутизатор
    debugRouter(data);
    // --- КОНЕЦ РЕЖИЛА ОТЛАДКИ ---

  } catch (err) {
    Logger.log(`КРИТИЧЕСКАЯ ОШИБКА в doPost (оболочка отладки): ${err.message}\nСтек: ${err.stack}`);
  }
}
