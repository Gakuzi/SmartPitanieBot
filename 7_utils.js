/**
 * Экранирует строку для безопасного использования в Telegram MarkdownV2.
 * Эта версия более надежна и использует простой, проверенный regex.
 * @param {string} text - Исходный текст.
 * @returns {string} - Экранированный текст.
 */
function escapeMarkdownV2(text) {
  if (typeof text !== 'string') {
    return '';
  }
  // In MarkdownV2, these characters must be escaped: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\$1');
}


// --- Проверка формата времени ---
function validateTimeFormat(timeStr) {
  return /^\d{2}:\d{2}$/.test(timeStr) &&
    Number(timeStr.substr(0, 2)) >= 0 && Number(timeStr.substr(0, 2)) < 24 &&
    Number(timeStr.substr(3, 2)) >= 0 && Number(timeStr.substr(3, 2)) < 60;
}

/**
 * Проверяет, включен ли режим AI в настройках администратора.
 * @returns {boolean} - true, если режим AI включен, иначе false.
 */
function isAiModeEnabled() {
  try {
    const ssId = PropertiesService.getScriptProperties().getProperty('ADMIN_SHEET_ID');
    if (!ssId) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) {
            Logger.log("Не удалось получить ID таблицы администратора. Режим AI считается выключенным.");
            return false;
        }
        PropertiesService.getScriptProperties().setProperty('ADMIN_SHEET_ID', ss.getId());
        return ss.getSheetByName('Настройки').getRange('B3').isChecked() === true;
    }

    const ss = SpreadsheetApp.openById(ssId);
    const settingsSheet = ss.getSheetByName('Настройки');
    if (!settingsSheet) {
      Logger.log("Лист 'Настройки' не найден в таблице администратора. Режим AI считается выключенным.");
      return false;
    }
    const isEnabled = settingsSheet.getRange('B3').isChecked();
    return isEnabled === true;
  } catch (e) {
    Logger.log(`Ошибка при проверке режима AI: ${e.message}. Режим AI считается выключенным.`);
    return false;
  }
}