/**
 * Экранирует строку для безопасного использования в Telegram MarkdownV2.
 * @param {string} text - Исходный текст.
 * @returns {string} - Экранированный текст.
 */
function escapeMarkdownV2(text) {
  if (typeof text !== 'string') return '';
  // Список символов, которые нужно экранировать в MarkdownV2
  const charsToEscape = '\\_[]()~`>#+-=|{}.!';
  return text.replace(new RegExp(`[${charsToEscape.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\// --- Проверка формата времени ---
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
    // Так как скрипт привязан к таблице администратора, мы можем получить ее ID
    const ssId = PropertiesService.getScriptProperties().getProperty('ADMIN_SHEET_ID');
    if (!ssId) {
        // Фоллбэк для старых версий: пытаемся получить активную таблицу
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) {
            Logger.log("Не удалось получить ID таблицы администратора. Режим AI считается выключенным.");
            return false;
        }
        // Сохраняем ID на будущее
        PropertiesService.getScriptProperties().setProperty('ADMIN_SHEET_ID', ss.getId());
        return ss.getSheetByName('Настройки').getRange('B3').isChecked() === true;
    }

    const ss = SpreadsheetApp.openById(ssId);
    const settingsSheet = ss.getSheetByName('Настройки');
    if (!settingsSheet) {
      Logger.log("Лист 'Настройки' не найден в таблице администратора. Режим AI считается выключенным.");
      return false;
    }
    // isChecked() возвращает true, если флажок установлен, false если снят, и null если ячейка пуста.
    const isEnabled = settingsSheet.getRange('B3').isChecked();
    return isEnabled === true; // Строгое сравнение, чтобы null стал false
  } catch (e) {
    Logger.log(`Ошибка при проверке режима AI: ${e.message}. Режим AI считается выключенным.`);
    return false; // В случае любой ошибки, безопаснее считать, что AI выключен.
  }
}')}]`, 'g'), '\\// --- Проверка формата времени ---
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
    // Так как скрипт привязан к таблице администратора, мы можем получить ее ID
    const ssId = PropertiesService.getScriptProperties().getProperty('ADMIN_SHEET_ID');
    if (!ssId) {
        // Фоллбэк для старых версий: пытаемся получить активную таблицу
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) {
            Logger.log("Не удалось получить ID таблицы администратора. Режим AI считается выключенным.");
            return false;
        }
        // Сохраняем ID на будущее
        PropertiesService.getScriptProperties().setProperty('ADMIN_SHEET_ID', ss.getId());
        return ss.getSheetByName('Настройки').getRange('B3').isChecked() === true;
    }

    const ss = SpreadsheetApp.openById(ssId);
    const settingsSheet = ss.getSheetByName('Настройки');
    if (!settingsSheet) {
      Logger.log("Лист 'Настройки' не найден в таблице администратора. Режим AI считается выключенным.");
      return false;
    }
    // isChecked() возвращает true, если флажок установлен, false если снят, и null если ячейка пуста.
    const isEnabled = settingsSheet.getRange('B3').isChecked();
    return isEnabled === true; // Строгое сравнение, чтобы null стал false
  } catch (e) {
    Logger.log(`Ошибка при проверке режима AI: ${e.message}. Режим AI считается выключенным.`);
    return false; // В случае любой ошибки, безопаснее считать, что AI выключен.
  }
}');
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
    // Так как скрипт привязан к таблице администратора, мы можем получить ее ID
    const ssId = PropertiesService.getScriptProperties().getProperty('ADMIN_SHEET_ID');
    if (!ssId) {
        // Фоллбэк для старых версий: пытаемся получить активную таблицу
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (!ss) {
            Logger.log("Не удалось получить ID таблицы администратора. Режим AI считается выключенным.");
            return false;
        }
        // Сохраняем ID на будущее
        PropertiesService.getScriptProperties().setProperty('ADMIN_SHEET_ID', ss.getId());
        return ss.getSheetByName('Настройки').getRange('B3').isChecked() === true;
    }

    const ss = SpreadsheetApp.openById(ssId);
    const settingsSheet = ss.getSheetByName('Настройки');
    if (!settingsSheet) {
      Logger.log("Лист 'Настройки' не найден в таблице администратора. Режим AI считается выключенным.");
      return false;
    }
    // isChecked() возвращает true, если флажок установлен, false если снят, и null если ячейка пуста.
    const isEnabled = settingsSheet.getRange('B3').isChecked();
    return isEnabled === true; // Строгое сравнение, чтобы null стал false
  } catch (e) {
    Logger.log(`Ошибка при проверке режима AI: ${e.message}. Режим AI считается выключенным.`);
    return false; // В случае любой ошибки, безопаснее считать, что AI выключен.
  }
}