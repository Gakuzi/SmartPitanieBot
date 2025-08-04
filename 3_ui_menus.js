/**
 * @file 3_ui_menus.js
 * @description Управление UI, меню и диалогами в Google Sheets и Telegram.
 */

// --- Меню в Google Sheets ---

/**
 * Создает кастомное меню в интерфейсе Google Sheets.
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  const adminMenu = ui.createMenu('Администрирование');

  adminMenu.addItem('Настроить таблицу', 'setupAdminSheet');
  adminMenu.addItem('Управление вебхуком', 'showWebhookManagerDialog');
  adminMenu.addSeparator();

  const settingsSubMenu = ui.createMenu('Настройки')
      .addItem('Установить токен Telegram', 'setTelegramToken')
      .addItem('Установить ключ Gemini', 'setGeminiApiKey');
      
  adminMenu.addSubMenu(settingsSubMenu);
  adminMenu.addToUi();
}

// --- Диалоговые окна в Google Sheets ---

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
    const webhookInfo = getTelegramWebhookInfo();
    if (!webhookInfo.ok) {
      throw new Error(webhookInfo.description || 'Неизвестная ошибка Telegram API.');
    }

    const basicInfo = {
      editorUrl: editorUrl,
      rawInfo: webhookInfo.result || {},
    };

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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const scriptProps = PropertiesService.getScriptProperties();

  try {
    let usersSsId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    let usersSs;

    // 1. Ищем или создаем таблицу пользователей
    if (usersSsId) {
      try {
        usersSs = SpreadsheetApp.openById(usersSsId);
      } catch (e) {
        usersSsId = null; // Файл был удален, создаем новый
      }
    }

    if (!usersSsId) {
      usersSs = SpreadsheetApp.create('SmartPit_Users');
      usersSsId = usersSs.getId();
      scriptProps.setProperty('USERS_SPREADSHEET_ID', usersSsId);
    }

    // 2. Проверяем и настраиваем структуру таблицы пользователей
    const usersSheet = usersSs.getSheetByName('Пользователи') || usersSs.insertSheet('Пользователи', 0);
    const headers = ['id', 'is_bot', 'first_name', 'last_name', 'username', 'language_code', 'is_premium', 'RegistrationDate', 'UserFolderLink', 'UserSheetLink', 'Категория', 'Администратор'];
    let currentHeaders = [];
    if (usersSheet.getLastColumn() > 0) {
        currentHeaders = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    }
    if (JSON.stringify(headers) !== JSON.stringify(currentHeaders)) {
        usersSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        usersSheet.setFrozenRows(1);
    }

    // 3. Настройка категорий и проверки данных
    let categoriesSheet = usersSs.getSheetByName('Категории');
    if (!categoriesSheet) {
      categoriesSheet = usersSs.insertSheet('Категории', 1);
      categoriesSheet.getRange('A1:A3').setValues([['Стандарт'], ['Премиум'], ['Тестировщик']]);
    }
    const categoryRange = categoriesSheet.getRange(`A1:A${categoriesSheet.getLastRow()}`);
    const rule = SpreadsheetApp.newDataValidation().requireValueInRange(categoryRange).build();
    usersSheet.getRange('K2:K').setDataValidation(rule);
    usersSheet.getRange('L2:L').insertCheckboxes();

    // 4. Создание и настройка листа "Настройки" в основной таблице
    let settingsSheet = ss.getSheetByName('Настройки');
    if (!settingsSheet) {
      settingsSheet = ss.insertSheet('Настройки', 0);
    }
    settingsSheet.clear();
    const folder = DriveApp.getFileById(ss.getId()).getParents().next();
    settingsSheet.getRange('A1:B3').setValues([
      ['ID таблицы пользователей', `=HYPERLINK("${usersSs.getUrl()}"; "${usersSsId}")`],
      ['ID папки проекта', `=HYPERLINK("${folder.getUrl()}"; "${folder.getId()}")`],
      ['Режим работы', 'AI']
    ]);

    // 5. Создание и настройка листа "Пользователи (Импорт)"
    let importSheet = ss.getSheetByName('Пользователи (Импорт)');
    if (!importSheet) {
      importSheet = ss.insertSheet('Пользователи (Импорт)', 1);
    }
    importSheet.clear();
    importSheet.getRange('A1').setFormula(`=IMPORTRANGE("${usersSsId}"; "Пользователи!A:L")`);

    // 6. Аккуратное удаление лишних листов
    const requiredSheets = ['Настройки', 'Пользователи (Импорт)'];
    ss.getSheets().forEach(sheet => {
      if (requiredSheets.indexOf(sheet.getName()) === -1) {
        ss.deleteSheet(sheet);
      }
    });

    ui.alert('Таблица администратора успешно настроена.');

  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при настройке таблицы администратора: ${e.message}\nStack: ${e.stack || 'N/A'}`);
    ui.alert(`Произошла ошибка: ${e.message}`);
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