/**
 * @file 0_onOpen.js
 * @description Этот файл содержит функцию onOpen(), которая автоматически выполняется при открытии Google Таблицы.
 */

/**
 * Создает кастомное меню в интерфейсе Google Sheets при открытии документа.
 */
function onOpen() {
  try {
    createCustomMenu();
  } catch (e) {
    Logger.log(`❌ ОШИБКА при создании меню: ${e.message}\nStack: ${e.stack || 'N/A'}`);
    SpreadsheetApp.getUi().alert(`Ошибка при загрузке меню: ${e.message}. Проверьте логи.`);
  }
}
