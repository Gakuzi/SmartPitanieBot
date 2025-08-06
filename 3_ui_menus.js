/**
 * @file 3_ui_menus.js
 * @description Управление UI, меню и диалогами в Google Sheets и Telegram.
 */

const TEMPLATE_SHEET_ID = "ВАШ_ID_ШАБЛОНА"; // ЗАМЕНИТЕ ЭТО НА ID ВАШЕЙ ШАБЛОННОЙ ТАБЛИЦЫ

// --- Боковая панель администратора в Google Sheets ---

/**
 * Показывает модальное окно администратора.
 */
function showAdminPanel() {
  const html = HtmlService.createHtmlOutputFromFile('AdminPanel')
    .setWidth(600)
    .setHeight(550);
  SpreadsheetApp.getUi().showModalDialog(html, 'Центр управления ботом');
}

/**
 * Обрабатывает действия, вызванные из боковой панели администратора.
 * @param {string} actionName - Имя действия, которое нужно выполнить.
 */
function runAdminAction(actionName) {
  switch (actionName) {
    case 'setup':
      setupAdminSheet();
      break;
    case 'webhook':
      showWebhookManagerDialog();
      break;
    case 'clear':
      clearCurrentSheet(); // Предполагается, что эта функция будет создана
      break;
    case 'toggleProtection':
      toggleSheetProtection();
      break;
    case 'setTelegramToken':
      setTelegramToken();
      break;
    case 'setGeminiApiKey':
      setGeminiApiKey();
      break;
    case 'toggleMode':
      toggleMode();
      break;
    default:
      SpreadsheetApp.getUi().alert('Неизвестное действие: ' + actionName);
  }
}

/**
 * Переключает режим работы (AI/Ручной) с использованием getValue/setValue.
 */
function toggleMode() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Настройки');
  const ui = SpreadsheetApp.getUi();

  if (!settingsSheet) {
    ui.alert('Лист "Настройки" не найден. Пожалуйста, сначала настройте таблицу администратора.');
    return;
  }

  const modeCell = settingsSheet.getRange('B3');

  // Убедимся, что в ячейке установлен формат чекбокса
  const dataValidation = modeCell.getDataValidation();
  if (!dataValidation || dataValidation.getCriteriaType() !== SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
    modeCell.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  }

  const isAiMode = modeCell.getValue() === true;

  // Переключаем режим
  modeCell.setValue(!isAiMode);

  const newMode = !isAiMode ? 'AI' : 'Ручной';
  ui.alert(`Режим работы переключен на: ${newMode}`);
}

// --- Диалоговые окна в Google Sheets ---

/**
 * Создает кастомное меню в интерфейсе Google Sheets.
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  const adminMenu = ui.createMenu('Администрирование');

  adminMenu.addItem('Открыть панель администратора', 'showAdminPanel');
  adminMenu.addSeparator();
  adminMenu.addItem('Настроить таблицу', 'setupAdminSheet');
  adminMenu.addItem('Управление вебхуком', 'showWebhookManagerDialog');
  adminMenu.addSeparator();
  adminMenu.addItem('Снять/Установить защиту листов', 'toggleSheetProtection');
  adminMenu.addSeparator();

  const settingsSubMenu = ui.createMenu('Настройки')
      .addItem('Установить токен Telegram', 'setTelegramToken')
      .addItem('Установить ключ Gemini', 'setGeminiApiKey');
      
  adminMenu.addSubMenu(settingsSubMenu);
  adminMenu.addToUi();
}

/**
 * Показывает диалоговое окно для управления вебхуком.
 */
function showWebhookManagerDialog() {
  const html = HtmlService.createHtmlOutputFromFile('webhook_manager_dialog')
    .setWidth(700)
    .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, 'Анализатор статуса вебхука');
}

/**
 * Получает базовую информацию о вебхуке и проводит первичный анализ.
 * @returns {object} - Объект с базовой информацией и результатом анализа.
 */
function getBasicWebhookInfo() {
  const editorUrl = `https://script.google.com/d/${ScriptApp.getScriptId()}/edit`;
  try {
    Logger.log('DEBUG: Вызов getTelegramWebhookInfo()');
    Logger.log('DEBUG: Вызов getTelegramWebhookInfo()');
    const webhookInfo = getTelegramWebhookInfo();
    Logger.log(`DEBUG: Результат getTelegramWebhookInfo(): ${JSON.stringify(webhookInfo)}`);

    if (!webhookInfo.ok) {
      // Если getTelegramWebhookInfo вернула ошибку, обрабатываем ее здесь
      return {
        ok: false,
        basicInfo: { editorUrl: editorUrl, rawInfo: {} },
        analysis: {
          status: 'CRITICAL',
          summary: 'Ошибка получения данных о вебхуке',
          details: webhookInfo.description || 'Неизвестная ошибка Telegram API.',
          solution: 'Пожалуйста, проверьте ваш токен Telegram и разрешения скрипта.'
        }
      };
    }

    const basicInfo = {
      editorUrl: editorUrl,
      rawInfo: webhookInfo.result || {},
    };
    Logger.log(`DEBUG: basicInfo.rawInfo: ${JSON.stringify(basicInfo.rawInfo)}`);

    let initialAnalysis;
    if (basicInfo.rawInfo.url) {
      initialAnalysis = {
        status: 'OK',
        summary: 'Вебхук успешно установлен и работает.',
        details: `Ваш бот подключен к Telegram через URL: ${basicInfo.rawInfo.url}`,
        solution: 'Все выглядит хорошо. Если бот перестал отвечать, попробуйте нажать кнопку "Обновить". Если это не поможет, переустановите вебхук, используя форму ниже.'
      };
    } else {
      initialAnalysis = {
        status: 'CRITICAL',
        summary: 'Вебхук не установлен',
        details: 'URL вебхука отсутствует в информации от Telegram. Бот не будет работать.',
        solution: 'Пожалуйста, разверните проект как веб-приложение, скопируйте URL и вставьте его в поле ниже, затем нажмите "Установить / Обновить".'
      };
    }
    Logger.log(`DEBUG: initialAnalysis: ${JSON.stringify(initialAnalysis)}`);

    return {
      ok: true,
      basicInfo: basicInfo,
      analysis: initialAnalysis
    };

  } catch (e) {
    const errorMessage = `Ошибка при получении базовой информации: ${e.message}`;
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${errorMessage}\nStack: ${e.stack || 'N/A'}`);
    return {
      ok: false,
      basicInfo: { editorUrl: editorUrl, rawInfo: {} },
      analysis: {
        status: 'CRITICAL',
        summary: 'Ошибка получения данных',
        details: errorMessage,
        solution: 'Не удалось связаться с API Telegram. Проверьте ваш токен и подключение к сети.'
      }
    };
  }
}


/**
 * Запускает анализ статуса вебхука с помощью AI.
 * @param {object} basicInfo - Объект с базовой информацией о вебхуке.
 * @returns {object} - Результат анализа от AI.
 */
function getAiAnalysis(basicInfo) {
  try {
    const analysis = analyzeWebhookStatus(basicInfo.rawInfo, basicInfo.webAppUrl);
    if (analysis.error) {
      throw new Error(`AI вернул ошибку: ${analysis.error}. Детали: ${analysis.details}`);
    }
    return { ok: true, analysis: analysis, basicInfo: basicInfo };
  } catch (aiError) {
    const errorMessage = `Ошибка анализа AI: ${aiError.message}`;
    Logger.log(`⚠️ ПРЕДУПРЕЖДЕНИЕ: ${errorMessage}\nStack: ${aiError.stack || 'N/A'}`);
    return {
      ok: false,
      analysis: {
        status: "WARNING",
        summary: "AI-анализатор недоступен",
        details: `Данные от Telegram успешно получены, но не удалось получить их анализ от нейросети. Ошибка: ${aiError.message}`,
        solution: "1. Проверьте правильность ключа Gemini API и его активацию в Google Cloud Console.\n2. Проблема может быть временной. Попробуйте обновить через минуту.",
        rawTelegramData: JSON.stringify(basicInfo.rawInfo, null, 2)
      },
      basicInfo: basicInfo
    };
  }
}


/**
 * Устанавливает вебхук из диалогового окна.
 * @param {string} url - URL для установки вебхука.
 * @returns {object} - Результат операции.
 */
function setWebhookFromDialog(url) {
  if (!url || !url.startsWith("https://script.google.com/macros/s/")) {
    const errorDesc = "Предоставлен недействительный URL веб-приложения Google Apps Script.";
    Logger.log(`❌ Ошибка установки вебхука: ${errorDesc} URL: ${url}`);
    return { ok: false, description: errorDesc };
  }
  return setTelegramWebhook(url);
}

/**
 * Удаляет вебхук из диалогового окна.
 * @returns {object} - Результат операции.
 */
function deleteWebhookFromDialog() {
  return deleteTelegramWebhook();
}

/**
 * Настраивает таблицу администратора.
 */
function setupAdminSheet() {
  const scriptProps = PropertiesService.getScriptProperties();
  try {
    Logger.log('🚀 Начинаем настройку таблицы администратора...');
    
    let usersSsId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    let usersSs;

    // 1. Ищем или создаем таблицу пользователей
    if (usersSsId) {
      try {
        usersSs = SpreadsheetApp.openById(usersSsId);
        Logger.log(`✅ Найдена существующая таблица пользователей: ${usersSsId}`);
        restoreTemplateStructure(usersSs, TEMPLATE_SHEET_ID); // Восстанавливаем структуру
      } catch (e) {
        Logger.log(`⚠️ Таблица пользователей не найдена, создаем новую...`);
        usersSsId = null; // Файл был удален, создаем новый
      }
    }

    if (!usersSsId) {
      Logger.log('📊 Создаем новую таблицу пользователей...');
      usersSs = SpreadsheetApp.create('SmartPit_Users_Database');
      usersSsId = usersSs.getId();
      scriptProps.setProperty('USERS_SPREADSHEET_ID', usersSsId);
      Logger.log(`✅ Таблица пользователей создана: ${usersSsId}`);
      restoreTemplateStructure(usersSs, TEMPLATE_SHEET_ID); // Восстанавливаем структуру
    }

    // 2. Проверяем и настраиваем структуру таблицы пользователей
    Logger.log('📋 Настраиваем структуру таблицы пользователей...');
    const usersSheet = usersSs.getSheetByName('Пользователи') || usersSs.insertSheet('Пользователи', 0);
    const headers = ['ID', 'is_bot', 'first_name', 'last_name', 'username', 'language_code', 'is_premium', 'date_joined', 'folder_link', 'sheet_link', 'category', 'is_admin'];
    
    // Проверяем текущие заголовки
    let currentHeaders = [];
    if (usersSheet.getLastColumn() > 0) {
        currentHeaders = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    }
    
    // Обновляем заголовки если нужно
    if (JSON.stringify(headers) !== JSON.stringify(currentHeaders)) {
        usersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        usersSheet.setFrozenRows(1);
        Logger.log('✅ Заголовки таблицы пользователей обновлены');
    }

    // 3. Настройка категорий
    Logger.log('🏷️ Настраиваем категории пользователей...');
    let categoriesSheet = usersSs.getSheetByName('Категории');
    if (!categoriesSheet) {
      categoriesSheet = usersSs.insertSheet('Категории', 1);
      categoriesSheet.getRange('A1:A3').setValues([['Стандарт'], ['Премиум'], ['Тестировщик']]);
      Logger.log('✅ Лист категорий создан');
    }
    
    // Устанавливаем валидацию данных
    const categoryRange = categoriesSheet.getRange(`A1:A${categoriesSheet.getLastRow()}`);
    const rule = SpreadsheetApp.newDataValidation().requireValueInRange(categoryRange).build();
    usersSheet.getRange('K2:K').setDataValidation(rule);
    usersSheet.getRange('L2:L').insertCheckboxes();
    Logger.log('✅ Валидация данных настроена');

    // 4. Создаем основную таблицу администратора
    Logger.log('📊 Создаем основную таблицу администратора...');
    const adminSheet = SpreadsheetApp.create('SmartPit_Admin_Panel');
    const adminSheetId = adminSheet.getId();
    scriptProps.setProperty('ADMIN_SHEET_ID', adminSheetId);
    Logger.log(`✅ Таблица администратора создана: ${adminSheetId}`);
    
    // 5. Настраиваем листы в таблице администратора (упрощенная версия)
    Logger.log('📋 Настраиваем листы в таблице администратора...');
    
    // Лист настроек
    let settingsSheet = adminSheet.getSheetByName('Настройки') || adminSheet.insertSheet('Настройки', 0);
    settingsSheet.clear();
    settingsSheet.getRange('A1:B3').setValues([
      ['ID таблицы пользователей', usersSsId],
      ['ID папки проекта', scriptProps.getProperty('ROOT_FOLDER_ID') || 'Не настроена'],
      ['Режим работы (AI)', 'TRUE']
    ]);
    Logger.log('✅ Лист настроек создан');

    // Лист импорта пользователей
    let importSheet = adminSheet.getSheetByName('Пользователи (Импорт)') || adminSheet.insertSheet('Пользователи (Импорт)', 1);
    importSheet.clear();
    importSheet.getRange('A1').setValue('Импорт пользователей');
    Logger.log('✅ Лист импорта создан');

    Logger.log('✅ Таблица администратора успешно настроена');
    return { success: true, adminSheetId: adminSheetId, usersSheetId: usersSsId };

  } catch (e) {
    const errorMessage = `❌ КРИТИЧЕСКАЯ ОШИБКА при настройке таблицы администратора: ${e.message}`;
    Logger.log(errorMessage);
    Logger.log(`Стек ошибки: ${e.stack || 'N/A'}`);
    return { success: false, error: e.message };
  }
}

/**
 * Устанавливает или снимает защиту с ключевых листов и диапазонов.
 * @param {boolean} [protect] - Если true, устанавливает защиту. Если false, снимает. Если не указано, переключает.
 */
function toggleSheetProtection(protect) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const protections = ss.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  const isProtected = protections.length > 0;

  if (protect === undefined) {
    protect = !isProtected;
  }

  if (protect) {
    setProtection(true);
    ui.alert('Защита установлена.');
  } else {
    protections.forEach(p => p.remove());
    const rangeProtections = ss.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    rangeProtections.forEach(p => p.remove());
    ui.alert('Защита снята. Теперь вы можете редактировать все ячейки.');
  }
}

/**
 * Внутренняя функция для установки защиты.
 */
function setProtection() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.getSheetByName('Настройки');
  if (settingsSheet) {
    const protection = settingsSheet.protect().setDescription('Защита настроек');
    protection.setUnprotectedRanges([settingsSheet.getRange('B3')]);
    protection.removeEditors(protection.getEditors());
    protection.addEditor(Session.getEffectiveUser());
  }

  const importSheet = ss.getSheetByName('Пользователи (Импорт)');
  if (importSheet) {
    const protection = importSheet.getRange('A1').protect().setDescription('Защита формулы импорта');
    protection.removeEditors(protection.getEditors());
    protection.addEditor(Session.getEffectiveUser());
  }
}

/**
 * Запрашивает и сохраняет токен Telegram.
 */
function setTelegramToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Настройка токена Telegram',
    'Пожалуйста, введите ваш токен Telegram API:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const token = response.getResponseText().trim();
    if (token) {
      PropertiesService.getScriptProperties().setProperty('TELEGRAM_TOKEN', token);
      ui.alert('Токен Telegram успешно сохранен.');
    } else {
      ui.alert('Токен не может быть пустым.');
    }
  }
}

/**
 * Запрашивает и сохраняет ключ Gemini API.
 */
function setGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Настройка Gemini API',
    'Пожалуйста, введите ваш ключ Google Gemini API:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() == ui.Button.OK) {
    const apiKey = response.getResponseText().trim();
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
      ui.alert('Ключ Gemini API успешно сохранен.');
    } else {
      ui.alert('Ключ API не может быть пустым.');
    }
  }
}

/**
 * Очищает текущий активный лист.
 */
function clearCurrentSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Очистка листа',
    `Вы уверены, что хотите полностью очистить лист "${sheet.getName()}"? Это действие необратимо.`,
    ui.ButtonSet.YES_NO
  );

  if (response == ui.Button.YES) {
    sheet.clear();
    ui.alert('Лист успешно очищен.');
  } else {
    ui.alert('Очистка отменена.');
  }
}

/**
 * Восстанавливает структуру книги из шаблона.
 * @param {SpreadsheetApp.Spreadsheet} targetSs Спредшит, который нужно восстановить
 * @param {string} templateId ID шаблонной таблицы
 */
function restoreTemplateStructure(targetSs, templateId) {
  try {
    const templateSs = SpreadsheetApp.openById(templateId);
    if (!templateSs) throw new Error('Не удалось открыть таблицу-шаблон');

    // Удаляем все листы, кроме первого (Google требует хотя бы один лист)
    const sheets = targetSs.getSheets();
    for (let i = sheets.length - 1; i >= 1; i--) {
      targetSs.deleteSheet(sheets[i]);
    }

    // Копируем листы из шаблона
    templateSs.getSheets().forEach(tplSheet => {
      const copy = tplSheet.copyTo(targetSs).setName(tplSheet.getName());
      copy.activate();
    });

    // Удаляем автоматически созданный пустой первый лист, если он остался
    const first = targetSs.getSheets()[0];
    if (first.getMaxRows() === 1000 && first.getMaxColumns() === 26 && first.getSheetName() === 'Лист1') {
      targetSs.deleteSheet(first);
    }

    Logger.log('✅ Структура восстановлена из шаблона');
  } catch (e) {
    Logger.log(`❌ Ошибка восстановления структуры: ${e.message}`);
    throw e;
  }
}

/**
 * Возвращает объект ReplyKeyboardMarkup для Telegram с основными командами.
 * @param {number} chatId - ID чата пользователя (не используется в этой базовой реализации, но может быть полезен для персонализации).
 * @returns {object} Объект ReplyKeyboardMarkup.
 */
function getMenu(chatId) {
  return {
    keyboard: [
      [{ text: '🍽 Показать меню' }, { text: '🛒 Список покупок' }],
      [{ text: '⚙️ Настройки' }, { text: '🔄 Замена продукта' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

/**
 * Отправляет главное меню с основной клавиатурой.
 * @param {string|number} chatId - ID чата.
 */
function sendMenu(chatId) {
  const text = 'Чем могу помочь?';
  sendText(chatId, text, getMenu(chatId));
}
