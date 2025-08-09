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

    // Определяем, включен ли режим отладки по ScriptProperties (DEBUG_MODE=true)
    const isDebug = PropertiesService.getScriptProperties().getProperty('DEBUG_MODE') === 'true';

    if (isDebug) {
      // --- РЕЖИМ ОТЛАДКИ ---
      debugRouter(data);
    } else {
      // --- ПРОДАКШН РЕЖИМ ---
      handleUpdate(data);
    }

  } catch (err) {
    Logger.log(`КРИТИЧЕСКАЯ ОШИБКА в doPost: ${err.message}\nСтек: ${err.stack}`);
  }
}
