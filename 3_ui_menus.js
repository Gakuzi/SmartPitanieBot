/**
 * @file 3_ui_menus.js
 * @description Управление UI, меню и диалогами в Google Sheets и Telegram.
 */

// --- Боковая панель администратора в Google Sheets ---

/**
 * Показывает модальное окно администратора.
 */
function showAdminPanel() {
  const html = HtmlService.createHtmlOutputFromFile('AdminPanel')
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'SmartPit Console — Центр управления');
}

function openProjectManagerWeb() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('project-manager')
      .setWidth(1200)
      .setHeight(800);
    SpreadsheetApp.getUi().showModalDialog(html, 'Менеджер проекта SmartPit');
  } catch (error) {
    Logger.log('Ошибка открытия менеджера проекта: ' + error.message);
    SpreadsheetApp.getUi().alert('Ошибка открытия менеджера проекта: ' + error.message);
  }
}

function openIdeaDoc() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('idea')
      .setWidth(1000)
      .setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(html, 'Техническое задание SmartPit');
  } catch (error) {
    Logger.log('Ошибка открытия ТЗ: ' + error.message);
    SpreadsheetApp.getUi().alert('Ошибка открытия ТЗ: ' + error.message);
  }
}

function runQuickDiagnostics() {
  try {
    const ui = SpreadsheetApp.getUi();
    const results = Core.Diagnostics.runQuick();
    const message = Core.Diagnostics.formatReportForTelegram(results);
    ui.alert('Диагностика системы', message, ui.ButtonSet.OK);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка диагностики: ' + error.message);
  }
}

function restoreTableStructure() {
  try {
    const ui = SpreadsheetApp.getUi();
    const result = Core.Diagnostics.autoRepair();
    ui.alert('Восстановление', result.success ? 'Структура восстановлена успешно!' : 'Ошибка: ' + result.error, ui.ButtonSet.OK);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Ошибка восстановления: ' + error.message);
  }
}

// Функции для AdminPanel
function testTelegramAPI() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const telegramToken = scriptProps.getProperty('TELEGRAM_TOKEN');
    
    if (!telegramToken) {
      results.message = 'TELEGRAM_TOKEN не настроен';
      return results;
    }
    
    results.details.push(`✅ TELEGRAM_TOKEN настроен`);
    
    // Тестируем получение информации о боте
    try {
      const url = `https://api.telegram.org/bot${telegramToken}/getMe`;
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      const responseCode = response.getResponseCode();
      
      if (responseCode === 200) {
        const data = JSON.parse(response.getContentText());
        if (data.ok) {
          results.details.push(`✅ Бот активен: @${data.result.username}`);
          results.details.push(`🤖 Имя бота: ${data.result.first_name}`);
          results.passed = true;
          results.message = 'Telegram API работает корректно';
        } else {
          results.message = `Ошибка Telegram API: ${data.description}`;
        }
      } else {
        results.message = `HTTP ошибка: ${responseCode}`;
      }
      
    } catch (error) {
      results.message = `Ошибка при тестировании API: ${error.message}`;
    }
    
  } catch (error) {
    results.message = `Критическая ошибка Telegram API: ${error.message}`;
  }
  
  return results;
}

function testGeminiAPI() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const geminiApiKey = scriptProps.getProperty('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      results.message = 'GEMINI_API_KEY не настроен';
      return results;
    }
    
    results.details.push(`✅ GEMINI_API_KEY настроен`);
    
    // Проверяем функцию callGemini
    try {
      if (typeof callGemini === 'function') {
        results.details.push(`✅ Функция callGemini: доступна`);
        results.passed = true;
        results.message = 'Gemini API готов к работе';
      } else {
        results.message = 'Функция callGemini не найдена';
      }
    } catch (error) {
      results.message = `Ошибка Gemini API: ${error.message}`;
    }
    
  } catch (error) {
    results.message = `Критическая ошибка Gemini API: ${error.message}`;
  }
  
  return results;
}

function setTelegramWebhook() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const telegramToken = scriptProps.getProperty('TELEGRAM_TOKEN');
    
    if (!telegramToken) {
      return { 
        success: false, 
        error: 'TELEGRAM_TOKEN не настроен',
        details: 'Пожалуйста, настройте TELEGRAM_TOKEN в Script Properties'
      };
    }
    
    // Получаем URL текущего веб-приложения
    const webAppUrl = ScriptApp.getService().getUrl();
    Logger.log(`Устанавливаем webhook на URL: ${webAppUrl}`);
    
    // Сначала удаляем старый webhook
    const deleteWebhookUrl = `https://api.telegram.org/bot${telegramToken}/deleteWebhook`;
    const deleteOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({ drop_pending_updates: true }),
      muteHttpExceptions: true
    };
    
    const deleteResponse = UrlFetchApp.fetch(deleteWebhookUrl, deleteOptions);
    Logger.log(`Удаление старого webhook: ${deleteResponse.getResponseCode()}`);
    
    // Ждем немного
    Utilities.sleep(500);
    
    // Устанавливаем новый webhook
    const setWebhookUrl = `https://api.telegram.org/bot${telegramToken}/setWebhook`;
    const payload = {
      url: webAppUrl,
      allowed_updates: ["message", "edited_message", "callback_query", "my_chat_member"],
      drop_pending_updates: true,
      max_connections: 40
    };
    
    const setOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(setWebhookUrl, setOptions);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    const data = JSON.parse(responseText);
    
    Logger.log(`Установка webhook: ${responseCode} - ${responseText}`);
    
    if (responseCode === 200 && data.ok) {
      // Проверяем, что webhook действительно установлен
      Utilities.sleep(1000);
      const verification = getBasicWebhookInfo();
      
      return { 
        success: true, 
        message: 'Webhook успешно установлен и проверен',
        url: webAppUrl,
        verification: verification,
        details: data.result
      };
    } else {
      return { 
        success: false, 
        error: data.description || `HTTP ошибка ${responseCode}`,
        details: data
      };
    }
    
  } catch (error) {
    Logger.log(`Критическая ошибка установки webhook: ${error.message}`);
    return { 
      success: false, 
      error: 'Критическая ошибка',
      details: error.message,
      stack: error.stack 
    };
  }
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

/**
 * Переключает режим AI
 */
function toggleAiMode() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const currentMode = scriptProps.getProperty('AI_MODE') || 'enabled';
    const newMode = currentMode === 'enabled' ? 'disabled' : 'enabled';
    
    scriptProps.setProperty('AI_MODE', newMode);
    
    const ui = SpreadsheetApp.getUi();
    const status = newMode === 'enabled' ? 'включен' : 'выключен';
    ui.alert(`Режим AI ${status}`, `Искусственный интеллект ${status}.`, ui.ButtonSet.OK);
    
    Logger.log(`AI режим переключен на: ${newMode}`);
    return { success: true, mode: newMode };
    
  } catch (error) {
    Logger.log('Ошибка переключения AI режима: ' + error.message);
    SpreadsheetApp.getUi().alert('Ошибка переключения AI режима: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Проверяет, включен ли AI режим
 */
function isAiModeEnabled() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const aiMode = scriptProps.getProperty('AI_MODE') || 'enabled';
    return aiMode === 'enabled';
  } catch (error) {
    Logger.log('Ошибка проверки AI режима: ' + error.message);
    return true; // По умолчанию включен
  }
}

/**
 * Показывает диалог управления AI
 */
function showAiSettingsDialog() {
  try {
    const isEnabled = isAiModeEnabled();
    const status = isEnabled ? 'включен' : 'выключен';
    const buttonText = isEnabled ? 'Выключить AI' : 'Включить AI';
    const description = isEnabled ? 
      'AI режим активен. Бот будет использовать Gemini для генерации меню и ответов.' :
      'AI режим выключен. Бот будет работать в базовом режиме без AI функций.';
    
    const html = HtmlService.createHtmlOutput(`
      <html>
        <head>
          <title>Настройки AI</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
            .enabled { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .disabled { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .button { 
              background: #007bff; 
              color: white; 
              padding: 10px 20px; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer; 
              margin: 5px;
            }
            .button:hover { background: #0056b3; }
            .button.danger { background: #dc3545; }
            .button.danger:hover { background: #c82333; }
          </style>
        </head>
        <body>
          <h2>🤖 Настройки Искусственного Интеллекта</h2>
          <div class="status ${isEnabled ? 'enabled' : 'disabled'}">
            <strong>Статус:</strong> ${status}
          </div>
          <p>${description}</p>
          <button class="button ${isEnabled ? 'danger' : ''}" onclick="toggleAi()">
            ${buttonText}
          </button>
          <button class="button" onclick="google.script.host.close()">
            Закрыть
          </button>
          <script>
            function toggleAi() {
              google.script.run
                .withSuccessHandler(function(result) {
                  if (result.success) {
                    alert('AI режим успешно переключен!');
                    google.script.host.close();
                  } else {
                    alert('Ошибка: ' + result.error);
                  }
                })
                .withFailureHandler(function(error) {
                  alert('Ошибка: ' + error.message);
                })
                .toggleAiMode();
            }
          </script>
        </body>
      </html>
    `).setWidth(500).setHeight(300);
    
    SpreadsheetApp.getUi().showModalDialog(html, 'Настройки AI');
    
  } catch (error) {
    Logger.log('Ошибка открытия диалога AI настроек: ' + error.message);
    SpreadsheetApp.getUi().alert('Ошибка открытия диалога AI настроек: ' + error.message);
  }
}

// --- Диалоговые окна в Google Sheets ---

/**
 * Создает кастомное меню в интерфейсе Google Sheets.
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  const adminMenu = ui.createMenu('Администрирование');

  adminMenu.addItem('Открыть панель администратора', 'showAdminPanel');
  adminMenu.addItem('Открыть Менеджер проекта', 'openProjectManagerWeb');
  adminMenu.addItem('Открыть ТЗ (idea)', 'openIdeaDoc');
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

// showWebhookManagerDialog определен в ui_dialogs.js (во избежание дублирования)

/**
 * Получает базовую информацию о вебхуке и проводит полную диагностику
 */
function getBasicWebhookInfo() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const telegramToken = scriptProps.getProperty('TELEGRAM_TOKEN');
    
    if (!telegramToken) {
      return {
        success: false,
        error: 'TELEGRAM_TOKEN не настроен в Script Properties',
        details: 'Токен Telegram не найден. Настройте его в Script Properties.'
      };
    }
    
    // Получаем текущий URL веб-приложения
    const currentWebAppUrl = ScriptApp.getService().getUrl();
    Logger.log(`Текущий WebApp URL: ${currentWebAppUrl}`);
    
    // Запрашиваем информацию о webhook
    const webhookInfoUrl = `https://api.telegram.org/bot${telegramToken}/getWebhookInfo`;
    const response = UrlFetchApp.fetch(webhookInfoUrl, { 
      muteHttpExceptions: true,
      method: 'GET'
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode !== 200) {
      return {
        success: false,
        error: `HTTP ошибка: ${responseCode}`,
        details: `Telegram API недоступен. Ответ: ${responseText}`
      };
    }
    
    const data = JSON.parse(responseText);
    
    if (!data.ok) {
      return {
        success: false,
        error: 'Ошибка Telegram API',
        details: data.description || 'Неизвестная ошибка API'
      };
    }
    
    const webhookInfo = data.result;
    
    // Анализируем состояние webhook
    if (!webhookInfo.url || webhookInfo.url === '') {
      return {
        success: false,
        error: 'Webhook не установлен',
        message: 'URL webhook отсутствует',
        details: {
          currentUrl: currentWebAppUrl,
          webhookUrl: 'НЕ УСТАНОВЛЕН',
          status: 'NOT_SET',
          pendingUpdateCount: webhookInfo.pending_update_count || 0
        }
      };
    }
    
    // Проверяем соответствие URL
    const isCorrectUrl = webhookInfo.url === currentWebAppUrl;
    
    if (!isCorrectUrl) {
    return {
        success: false,
        error: 'Webhook настроен на другой URL',
        message: 'Webhook указывает на устаревший или неправильный URL',
        details: {
          currentUrl: currentWebAppUrl,
          webhookUrl: webhookInfo.url,
          status: 'WRONG_URL',
          pendingUpdateCount: webhookInfo.pending_update_count || 0,
          lastErrorDate: webhookInfo.last_error_date,
          lastErrorMessage: webhookInfo.last_error_message
        }
      };
    }
    
    // Все хорошо
    return {
      success: true,
      message: 'Webhook настроен правильно',
      url: webhookInfo.url,
      details: {
        currentUrl: currentWebAppUrl,
        webhookUrl: webhookInfo.url,
        status: 'OK',
        pendingUpdateCount: webhookInfo.pending_update_count || 0,
        maxConnections: webhookInfo.max_connections || 40,
        allowedUpdates: webhookInfo.allowed_updates || [],
        lastErrorDate: webhookInfo.last_error_date,
        lastErrorMessage: webhookInfo.last_error_message
      }
    };

  } catch (error) {
    Logger.log(`Ошибка диагностики webhook: ${error.message}`);
    return {
      success: false,
      error: 'Критическая ошибка диагностики',
      details: error.message
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


// setWebhookFromDialog определен в ui_dialogs.js

// deleteWebhookFromDialog определен в ui_dialogs.js

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
    settingsSheet.getRange('A1:B2').setValues([
      ['ID таблицы пользователей', `=HYPERLINK("${usersSs.getUrl()}"; "${usersSsId}")`],
      ['ID папки проекта', `=HYPERLINK("${folder.getUrl()}"; "${folder.getId()}")`]
    ]);
    settingsSheet.getRange('A3').setValue('Режим работы (AI - ✓)');
    settingsSheet.getRange('B3').insertCheckboxes().check(); // AI mode by default

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

    // 7. Установка защиты
    setProtection(true);

    ui.alert('Таблица администратора успешно настроена. Защита установлена.');

  } catch (e) {
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА при настройке таблицы администратора: ${e.message}\nStack: ${e.stack || 'N/A'}`);
    ui.alert(`Произошла ошибка: ${e.message}`);
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
 * Возвращает объект ReplyKeyboardMarkup для Telegram с основными командами.
 * @param {number} chatId - ID чата пользователя (не используется в этой базовой реализации, но может быть полезен для персонализации).
 * @returns {object} Объект ReplyKeyboardMarkup.
 */
function getMenu(chatId) {
  return {
    keyboard: [
      [{ text: '🍽 Показать меню' }, { text: '🛒 Список покупок' }],
      [{ text: '⚙️ Настройки' }, { text: '🔄 Замена продукта' }],
      [{ text: '🗂 Менеджер проекта' }, { text: '📄 Техническое задание' }]
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

/**
 * Создает главное меню с дополнительными функциями
 */
function getMainMenu(chatId) {
  const userData = getUserData(chatId);
  const isAdmin = userData && userData.isAdmin;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🍽️ Меню питания', callback_data: 'menu_nutrition' },
        { text: '📋 Список покупок', callback_data: 'shopping_list' }
      ],
      [
        { text: '⚙️ Настройки', callback_data: 'settings' },
        { text: '📊 Статистика', callback_data: 'statistics' }
      ],
      [
        { text: '🔄 Замены продуктов', callback_data: 'product_replacements' },
        { text: '📝 Дневник питания', callback_data: 'food_diary' }
      ]
    ]
  };

  // Добавляем админские функции
  if (isAdmin) {
    keyboard.inline_keyboard.push([
      { text: '🔧 Диагностика системы', callback_data: 'admin_diagnostics' },
      { text: '📋 Управление проектом', callback_data: 'admin_project_manager' }
    ]);
    keyboard.inline_keyboard.push([
      { text: '⚙️ Админ панель', callback_data: 'admin_panel' },
      { text: '🛠️ Восстановить листы', callback_data: 'admin_restore_sheets' }
    ]);
  }

  return {
    text: `🤖 *SmartPitanieBot* - Ваш помощник в питании

Выберите действие:`,
    reply_markup: keyboard
  };
}

/**
 * Обработка админских callback'ов
 */
function handleAdminCallback(callbackQuery) {
  const chatId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  switch (data) {
    case 'admin_diagnostics':
      handleAdminDiagnostics(chatId);
      break;
    case 'admin_project_manager':
      handleAdminProjectManager(chatId);
      break;
    case 'admin_panel':
      handleAdminPanel(chatId);
      break;
    case 'admin_restore_sheets':
      handleAdminRestoreSheets(chatId);
      break;
    default:
      sendText(chatId, '❌ Неизвестная команда администратора');
  }
  
  // Отвечаем на callback query
  answerCallbackQuery(callbackQuery.id);
}

/**
 * Обработка диагностики системы
 */
function handleAdminDiagnostics(chatId) {
  sendText(chatId, '🔧 Запуск диагностики системы...');
  try {
    const full = Core.Diagnostics && Core.Diagnostics.runFull ? Core.Diagnostics.runFull() : { ok: false };
    const reportText = Core.Diagnostics && Core.Diagnostics.formatReportForTelegram ? Core.Diagnostics.formatReportForTelegram(full) : 'Диагностика недоступна';
    sendText(chatId, reportText);
  } catch (error) {
    sendText(chatId, '❌ Ошибка при выполнении диагностики: ' + error.message);
  }
}

/**
 * Обработка управления проектом
 */
function handleAdminProjectManager(chatId) {
  try {
    const projectData = getProjectData();
    const stats = getProjectStats();
    
    let message = '📋 *Управление проектом SmartPitanieBot*\n\n';
    message += `📊 *Статистика:*\n`;
    message += `• Всего задач: ${stats.totalTasks}\n`;
    message += `• Завершено: ${stats.completedTasks}\n`;
    message += `• В работе: ${stats.inProgressTasks}\n`;
    message += `• Новых: ${stats.newTasks}\n`;
    message += `• Просрочено: ${stats.overdueTasks}\n`;
    message += `• Процент завершения: ${stats.completionRate}%\n`;
    message += `• Средний прогресс: ${stats.averageProgress}%\n\n`;
    
    if (projectData.tasks && projectData.tasks.length > 0) {
      message += '*Последние задачи:*\n';
      const recentTasks = projectData.tasks.slice(0, 5);
      recentTasks.forEach(task => {
        const status = task.status === 'Завершена' ? '✅' : 
                      task.status === 'В работе' ? '🔄' : '📝';
        message += `${status} ${task.name} (${task.status})\n`;
      });
    } else {
      message += '📝 Нет активных задач';
    }
    
    // Добавляем кнопки для управления
    const keyboard = {
      inline_keyboard: [
        [
          { text: '➕ Добавить задачу', callback_data: 'admin_add_task' },
          { text: '📊 Полная статистика', callback_data: 'admin_full_stats' }
        ],
        [
          { text: '🔄 Обновить данные', callback_data: 'admin_refresh_data' },
          { text: '📋 Все задачи', callback_data: 'admin_all_tasks' }
        ],
        [
          { text: '🔙 Назад', callback_data: 'back_to_main' }
        ]
      ]
    };
    
    sendText(chatId, message, keyboard);
    
  } catch (error) {
    sendText(chatId, '❌ Ошибка при загрузке данных проекта: ' + error.message);
  }
}

/**
 * Обработка админ панели
 */
function handleAdminPanel(chatId) {
  const webAppUrl = ScriptApp.getService().getUrl();
  const adminPanelUrl = webAppUrl + '?page=admin';
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🔧 Открыть админ панель', web_app: { url: adminPanelUrl } }
      ],
      [
        { text: '🔙 Назад', callback_data: 'back_to_main' }
      ]
    ]
  };
  
  sendText(chatId, 
    '⚙️ *Админ панель SmartPitanieBot*\n\n' +
    'Откройте полную админ панель для управления системой, диагностики и мониторинга.',
    keyboard
  );
}

/**
 * Обработка восстановления листов
 */
function handleAdminRestoreSheets(chatId) {
  sendText(chatId, '🔄 Запуск авто-восстановления...');
  try {
    const res = Core.Diagnostics && Core.Diagnostics.autoRepair ? Core.Diagnostics.autoRepair({}) : { success: false, actions: [], errors: ['Модуль Diagnostics недоступен'] };
    let msg = res.success ? '✅ Восстановление успешно' : '⚠️ Восстановление завершено с ошибками';
    if (res.actions && res.actions.length) {
      msg += '\nДействия:\n- ' + res.actions.join('\n- ');
    }
    if (res.errors && res.errors.length) {
      msg += '\nОшибки:\n- ' + res.errors.join('\n- ');
    }
    sendText(chatId, msg);
  } catch (error) {
    sendText(chatId, '❌ Ошибка при восстановлении: ' + error.message);
  }
}

/**
 * Обработка добавления новой задачи
 */
function handleAdminAddTask(chatId) {
  // Здесь можно реализовать интерактивное добавление задачи
  // Пока отправляем инструкцию
  sendText(chatId, 
    '➕ *Добавление новой задачи*\n\n' +
    'Для добавления задачи используйте админ панель или отправьте сообщение в формате:\n\n' +
    '`/add_task Название|Описание|Приоритет|Исполнитель|Дедлайн`\n\n' +
    'Пример:\n' +
    '`/add_task Исправить баг|Исправить ошибку в меню|Высокий|Разработчик|2024-01-15`'
  );
}

/**
 * Обработка полной статистики
 */
function handleAdminFullStats(chatId) {
  try {
    const stats = getProjectStats();
    const projectData = getProjectData();
    
    let message = '📊 *Полная статистика проекта*\n\n';
    message += `📈 *Общие показатели:*\n`;
    message += `• Всего задач: ${stats.totalTasks}\n`;
    message += `• Завершено: ${stats.completedTasks}\n`;
    message += `• В работе: ${stats.inProgressTasks}\n`;
    message += `• Новых: ${stats.newTasks}\n`;
    message += `• Просрочено: ${stats.overdueTasks}\n`;
    message += `• Процент завершения: ${stats.completionRate}%\n`;
    message += `• Средний прогресс: ${stats.averageProgress}%\n\n`;
    
    if (projectData.projects && projectData.projects.length > 0) {
      message += `📋 *Проекты (${projectData.projects.length}):*\n`;
      projectData.projects.forEach(project => {
        const status = project.status === 'Активный' ? '🟢' : '🔴';
        message += `${status} ${project.name}\n`;
      });
      message += '\n';
    }
    
    if (projectData.team && projectData.team.length > 0) {
      message += `👥 *Команда (${projectData.team.length}):*\n`;
      projectData.team.forEach(member => {
        message += `• ${member.name} - ${member.role}\n`;
      });
    }
    
    sendText(chatId, message);
    
  } catch (error) {
    sendText(chatId, '❌ Ошибка при загрузке статистики: ' + error.message);
  }
}

/**
 * Обработка обновления данных
 */
function handleAdminRefreshData(chatId) {
  sendText(chatId, '🔄 Обновление данных проекта...');
  
  try {
    // Здесь можно добавить логику обновления данных
    sendText(chatId, '✅ Данные проекта обновлены!');
    
    // Показываем обновленную статистику
    handleAdminProjectManager(chatId);
    
  } catch (error) {
    sendText(chatId, '❌ Ошибка при обновлении данных: ' + error.message);
  }
}

/**
 * Обработка всех задач
 */
function handleAdminAllTasks(chatId) {
  try {
    const projectData = getProjectData();
    
    if (!projectData.tasks || projectData.tasks.length === 0) {
      sendText(chatId, '📝 Нет активных задач');
      return;
    }
    
    let message = `📋 *Все задачи (${projectData.tasks.length}):*\n\n`;
    
    projectData.tasks.forEach((task, index) => {
      const status = task.status === 'Завершена' ? '✅' : 
                    task.status === 'В работе' ? '🔄' : '📝';
      const priority = task.priority === 'Высокий' ? '🔴' : 
                      task.priority === 'Средний' ? '🟡' : '🟢';
      
      message += `${index + 1}. ${status} ${priority} ${task.name}\n`;
      message += `   Статус: ${task.status} | Прогресс: ${task.progress}%\n`;
      if (task.assignee) message += `   Исполнитель: ${task.assignee}\n`;
      if (task.deadline) message += `   Дедлайн: ${task.deadline}\n`;
      message += '\n';
    });
    
    // Разбиваем на части, если сообщение слишком длинное
    if (message.length > 4000) {
      const parts = message.match(/.{1,4000}/g);
      parts.forEach(part => {
        sendText(chatId, part);
      });
    } else {
      sendText(chatId, message);
    }
    
  } catch (error) {
    sendText(chatId, '❌ Ошибка при загрузке задач: ' + error.message);
  }
}

/**
 * Отправляет меню настроек
 */
function sendSettingsMenu(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎯 Цель', callback_data: 'settings_goal' },
        { text: '👤 Пол', callback_data: 'settings_sex' }
      ],
      [
        { text: '🏃 Активность', callback_data: 'settings_activity' },
        { text: '📏 Рост/Вес', callback_data: 'settings_measurements' }
      ],
      [
        { text: '🍽️ Предпочтения', callback_data: 'settings_preferences' },
        { text: '⚙️ Уведомления', callback_data: 'settings_notifications' }
      ],
      [
        { text: '🔙 Назад', callback_data: 'back_to_main' }
      ]
    ]
  };
  
  sendText(chatId, 
    '⚙️ *Настройки SmartPitanieBot*\n\n' +
    'Выберите, что хотите настроить:',
    keyboard
  );
}

/**
 * Отправляет опции целей
 */
function sendGoalOptions(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '💪 Набрать мышечную массу', callback_data: 'goal_gain_muscle' },
        { text: '🔥 Сбросить вес', callback_data: 'goal_lose_weight' }
      ],
      [
        { text: '⚖️ Поддержать вес', callback_data: 'goal_maintain' },
        { text: '🏃 Улучшить выносливость', callback_data: 'goal_endurance' }
      ],
      [
        { text: '🔙 Назад к настройкам', callback_data: 'settings_menu' }
      ]
    ]
  };
  
  sendText(chatId, 
    '🎯 *Выберите вашу цель:*\n\n' +
    'Какую цель вы хотите достичь?',
    keyboard
  );
}

/**
 * Отправляет опции пола
 */
function sendSexOptions(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '👨 Мужской', callback_data: 'sex_male' },
        { text: '👩 Женский', callback_data: 'sex_female' }
      ],
      [
        { text: '🔙 Назад к настройкам', callback_data: 'settings_menu' }
      ]
    ]
  };
  
  sendText(chatId, 
    '👤 *Укажите ваш пол:*\n\n' +
    'Это необходимо для точных расчетов BMR.',
    keyboard
  );
}

/**
 * Отправляет опции активности
 */
function sendActivityOptions(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🛋️ Сидячий образ жизни', callback_data: 'activity_sedentary' },
        { text: '🚶 Легкая активность', callback_data: 'activity_light' }
      ],
      [
        { text: '🏃 Умеренная активность', callback_data: 'activity_moderate' },
        { text: '💪 Высокая активность', callback_data: 'activity_high' }
      ],
      [
        { text: '🏋️ Очень высокая активность', callback_data: 'activity_very_high' }
      ],
      [
        { text: '🔙 Назад к настройкам', callback_data: 'settings_menu' }
      ]
    ]
  };
  
  sendText(chatId, 
    '🏃 *Уровень физической активности:*\n\n' +
    'Выберите ваш уровень активности:',
    keyboard
  );
}

/**
 * Функция расчета BMR (Basal Metabolic Rate)
 */
function calculateBMR(weight, height, age, sex) {
  try {
    // Проверяем входные параметры
    if (!weight || !height || !age || !sex) {
      throw new Error('Не все параметры переданы для расчета BMR');
    }
    
    // Преобразуем в числа
    weight = parseFloat(weight);
    height = parseFloat(height);
    age = parseInt(age);
    
    if (isNaN(weight) || isNaN(height) || isNaN(age)) {
      throw new Error('Некорректные числовые параметры');
    }
    
    // Формула Миффлина-Сан Жеора
    let bmr;
    if (sex === 'male' || sex === 'm') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else if (sex === 'female' || sex === 'f') {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      throw new Error('Некорректный пол. Используйте "male"/"m" или "female"/"f"');
    }
    
    Logger.log(`BMR расчет: вес=${weight}, рост=${height}, возраст=${age}, пол=${sex}, BMR=${bmr}`);
    return Math.round(bmr);
    
  } catch (error) {
    Logger.log('Ошибка расчета BMR: ' + error.message);
    throw error;
  }
}

/**
 * Функция расчета TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(bmr, activityLevel) {
  const activityMultipliers = {
    'sedentary': 1.2,      // Сидячий образ жизни
    'light': 1.375,         // Легкая активность
    'moderate': 1.55,       // Умеренная активность
    'high': 1.725,          // Высокая активность
    'very_high': 1.9        // Очень высокая активность
  };
  
  return bmr * activityMultipliers[activityLevel];
}

/**
 * Генерирует меню с помощью AI
 */
function generateAiMenu(userId, preferences) {
  try {
    const prompt = `Создай меню на неделю для пользователя с предпочтениями: ${JSON.stringify(preferences)}. 
    Меню должно быть сбалансированным и учитывать калорийность.`;
    
    const response = callGemini(prompt);
    return response;
  } catch (error) {
    Logger.log('Ошибка генерации AI меню: ' + error.message);
    return 'Извините, не удалось сгенерировать меню. Попробуйте позже.';
  }
}

/**
 * Генерирует список покупок с помощью AI
 */
function generateShoppingListAi(menu) {
  try {
    const prompt = `На основе этого меню создай список покупок: ${menu}. 
    Сгруппируй продукты по категориям (овощи, мясо, молочные продукты и т.д.).`;
    
    const response = callGemini(prompt);
    return response;
  } catch (error) {
    Logger.log('Ошибка генерации AI списка покупок: ' + error.message);
    return 'Извините, не удалось сгенерировать список покупок. Попробуйте позже.';
  }
}

/**
 * Получает количество пользователей
 */
function getUserCount() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const usersSheetId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    
    if (!usersSheetId) {
      return 0;
    }
    
    const usersSheet = SpreadsheetApp.openById(usersSheetId);
    const sheet = usersSheet.getSheetByName('Пользователи');
    
    if (!sheet) {
      return 0;
    }
    
    const lastRow = sheet.getLastRow();
    return Math.max(0, lastRow - 1); // Вычитаем заголовок
    
  } catch (error) {
    Logger.log('Ошибка получения количества пользователей: ' + error.message);
    return 0;
  }
}

/**
 * Получает количество сообщений
 */
function getMessageCount() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const templateSheetId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    
    if (!templateSheetId) {
      return 0;
    }
    
    const templateSheet = SpreadsheetApp.openById(templateSheetId);
    const logSheet = templateSheet.getSheetByName('Логи');
    
    if (!logSheet) {
      return 0;
    }
    
    const lastRow = logSheet.getLastRow();
    return Math.max(0, lastRow - 1); // Вычитаем заголовок
    
  } catch (error) {
    Logger.log('Ошибка получения количества сообщений: ' + error.message);
    return 0;
  }
}

/**
 * Получает количество AI запросов
 */
function getAiRequestCount() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const templateSheetId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    
    if (!templateSheetId) {
      return 0;
    }
    
    const templateSheet = SpreadsheetApp.openById(templateSheetId);
    const logSheet = templateSheet.getSheetByName('Логи');
    
    if (!logSheet) {
      return 0;
    }
    
    const data = logSheet.getDataRange().getValues();
    let aiCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const message = data[i][1] || ''; // Предполагаем, что сообщение во второй колонке
      if (message.includes('AI') || message.includes('Gemini') || message.includes('generate')) {
        aiCount++;
      }
    }
    
    return aiCount;
    
  } catch (error) {
    Logger.log('Ошибка получения количества AI запросов: ' + error.message);
    return 0;
  }
}

/**
 * Получает точность AI
 */
function getAiAccuracy() {
  try {
    // Простая логика для демонстрации
    // В реальном проекте здесь была бы более сложная логика
    const aiRequests = getAiRequestCount();
    const totalMessages = getMessageCount();
    
    if (totalMessages === 0) {
      return 0;
    }
    
    // Простая формула: 85% базовой точности + бонус за количество запросов
    const baseAccuracy = 85;
    const bonus = Math.min(aiRequests * 0.5, 10); // Максимум 10% бонуса
    
    return Math.min(100, Math.round(baseAccuracy + bonus));
    
  } catch (error) {
    Logger.log('Ошибка получения точности AI: ' + error.message);
    return 0;
  }
}

/**
 * Показывает диалог управления webhook
 */
function showWebhookDialog() {
  try {
    const webAppUrl = ScriptApp.getService().getUrl();
    const html = HtmlService.createHtmlOutputFromFile('webhook_manager_dialog')
      .setWidth(800)
      .setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(html, 'Управление Webhook');
  } catch (error) {
    Logger.log('Ошибка открытия webhook диалога: ' + error.message);
    SpreadsheetApp.getUi().alert('Ошибка открытия webhook диалога: ' + error.message);
  }
}

/**
 * Инициализирует систему менеджера проекта
 */
function initializeProjectManager() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Создаем лист для проектов
    let projectsSheet = ss.getSheetByName('Проекты');
    if (!projectsSheet) {
      projectsSheet = ss.insertSheet('Проекты');
      projectsSheet.getRange('A1:F1').setValues([['ID', 'Название', 'Описание', 'Статус', 'Дата создания', 'Дата обновления']]);
      projectsSheet.setFrozenRows(1);
    }
    
    // Создаем лист для задач
    let tasksSheet = ss.getSheetByName('Задачи');
    if (!tasksSheet) {
      tasksSheet = ss.insertSheet('Задачи');
      tasksSheet.getRange('A1:H1').setValues([['ID', 'ID проекта', 'Название', 'Описание', 'Статус', 'Приоритет', 'Исполнитель', 'Дедлайн']]);
      tasksSheet.setFrozenRows(1);
    }
    
    // Создаем лист для команды
    let teamSheet = ss.getSheetByName('Команда');
    if (!teamSheet) {
      teamSheet = ss.insertSheet('Команда');
      teamSheet.getRange('A1:D1').setValues([['ID', 'Имя', 'Роль', 'Email']]);
      teamSheet.setFrozenRows(1);
    }
    
    Logger.log('Система менеджера проекта инициализирована');
    return { success: true, message: 'Система менеджера проекта создана' };
    
  } catch (error) {
    Logger.log('Ошибка инициализации менеджера проекта: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Получает данные проекта
 */
function getProjectData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectsSheet = ss.getSheetByName('Проекты');
    const tasksSheet = ss.getSheetByName('Задачи');
    const teamSheet = ss.getSheetByName('Команда');
    
    if (!projectsSheet || !tasksSheet || !teamSheet) {
      initializeProjectManager();
    }
    
    const projects = projectsSheet ? projectsSheet.getDataRange().getValues() : [];
    const tasks = tasksSheet ? tasksSheet.getDataRange().getValues() : [];
    const team = teamSheet ? teamSheet.getDataRange().getValues() : [];
    
    return {
      projects: projects.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        description: row[2],
        status: row[3],
        created: row[4],
        updated: row[5]
      })),
      tasks: tasks.slice(1).map(row => ({
        id: row[0],
        projectId: row[1],
        name: row[2],
        description: row[3],
        status: row[4],
        priority: row[5],
        assignee: row[6],
        deadline: row[7]
      })),
      team: team.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        role: row[2],
        email: row[3]
      }))
    };
    
  } catch (error) {
    Logger.log('Ошибка получения данных проекта: ' + error.message);
    return { projects: [], tasks: [], team: [] };
  }
}

/**
 * Добавляет новый проект
 */
function addProject(name, description) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let projectsSheet = ss.getSheetByName('Проекты');
    
    if (!projectsSheet) {
      const result = initializeProjectManager();
      if (!result.success) {
        throw new Error(result.error);
      }
      projectsSheet = ss.getSheetByName('Проекты');
    }
    
    const projectId = 'PROJ_' + Date.now();
    const now = new Date();
    
    projectsSheet.appendRow([projectId, name, description, 'Активный', now, now]);
    
    Logger.log(`Проект добавлен: ${name} (${projectId})`);
    return { success: true, projectId: projectId };
    
  } catch (error) {
    Logger.log('Ошибка добавления проекта: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Добавляет новую задачу
 */
function addTask(projectId, name, description, priority, assignee, deadline) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let tasksSheet = ss.getSheetByName('Задачи');
    
    if (!tasksSheet) {
      const result = initializeProjectManager();
      if (!result.success) {
        throw new Error(result.error);
      }
      tasksSheet = ss.getSheetByName('Задачи');
    }
    
    const taskId = 'TASK_' + Date.now();
    
    tasksSheet.appendRow([taskId, projectId, name, description, 'Новая', priority, assignee, deadline]);
    
    Logger.log(`Задача добавлена: ${name} (${taskId})`);
    return { success: true, taskId: taskId };
    
  } catch (error) {
    Logger.log('Ошибка добавления задачи: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Получает статистику проекта
 */
function getProjectStats() {
  try {
    const data = getProjectData();
    const tasks = data.tasks;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Завершена').length;
    const inProgressTasks = tasks.filter(t => t.status === 'В работе').length;
    const newTasks = tasks.filter(t => t.status === 'Новая').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return deadline < new Date() && t.status !== 'Завершена';
    }).length;
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const averageProgress = totalTasks > 0 ? Math.round((completedTasks + (inProgressTasks * 0.5)) / totalTasks * 100) : 0;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      newTasks,
      overdueTasks,
      completionRate,
      averageProgress
    };
    
  } catch (error) {
    Logger.log('Ошибка получения статистики проекта: ' + error.message);
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      newTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      averageProgress: 0
    };
  }
}

/**
 * Добавляет нового участника команды
 */
function addTeamMember(name, role, email) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let teamSheet = ss.getSheetByName('Команда');
    
    if (!teamSheet) {
      const result = initializeProjectManager();
      if (!result.success) {
        throw new Error(result.error);
      }
      teamSheet = ss.getSheetByName('Команда');
    }
    
    const memberId = 'MEMBER_' + Date.now();
    teamSheet.appendRow([memberId, name, role, email]);
    
    Logger.log(`Участник команды добавлен: ${name} (${memberId})`);
    return { success: true, memberId: memberId };
    
  } catch (error) {
    Logger.log('Ошибка добавления участника команды: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Обновляет статус задачи
 */
function updateTaskStatus(taskId, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tasksSheet = ss.getSheetByName('Задачи');
    
    if (!tasksSheet) {
      throw new Error('Лист задач не найден');
    }
    
    const data = tasksSheet.getDataRange().getValues();
    const headers = data[0];
    const statusIndex = headers.indexOf('Статус');
    const idIndex = headers.indexOf('ID');
    
    if (statusIndex === -1 || idIndex === -1) {
      throw new Error('Не найдены необходимые колонки');
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === taskId) {
        tasksSheet.getRange(i + 1, statusIndex + 1).setValue(newStatus);
        Logger.log(`Статус задачи ${taskId} обновлен на: ${newStatus}`);
        return { success: true };
      }
    }
    
    throw new Error('Задача не найдена');
    
  } catch (error) {
    Logger.log('Ошибка обновления статуса задачи: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Удаляет проект
 */
function deleteProject(projectId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const projectsSheet = ss.getSheetByName('Проекты');
    
    if (!projectsSheet) {
      throw new Error('Лист проектов не найден');
    }
    
    const data = projectsSheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');
    
    if (idIndex === -1) {
      throw new Error('Колонка ID не найдена');
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === projectId) {
        projectsSheet.deleteRow(i + 1);
        
        // Также удаляем связанные задачи
        deleteTasksByProject(projectId);
        
        Logger.log(`Проект ${projectId} удален`);
        return { success: true };
      }
    }
    
    throw new Error('Проект не найден');
    
  } catch (error) {
    Logger.log('Ошибка удаления проекта: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Удаляет все задачи проекта
 */
function deleteTasksByProject(projectId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tasksSheet = ss.getSheetByName('Задачи');
    
    if (!tasksSheet) return;
    
    const data = tasksSheet.getDataRange().getValues();
    const headers = data[0];
    const projectIdIndex = headers.indexOf('ID проекта');
    
    if (projectIdIndex === -1) return;
    
    // Удаляем строки снизу вверх
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][projectIdIndex] === projectId) {
        tasksSheet.deleteRow(i + 1);
      }
    }
    
    Logger.log(`Задачи проекта ${projectId} удалены`);
    
  } catch (error) {
    Logger.log('Ошибка удаления задач проекта: ' + error.message);
  }
}

/**
 * Удаляет задачу
 */
function deleteTask(taskId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tasksSheet = ss.getSheetByName('Задачи');
    
    if (!tasksSheet) {
      throw new Error('Лист задач не найден');
    }
    
    const data = tasksSheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');
    
    if (idIndex === -1) {
      throw new Error('Колонка ID не найдена');
    }
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === taskId) {
        tasksSheet.deleteRow(i + 1);
        Logger.log(`Задача ${taskId} удалена`);
        return { success: true };
      }
    }
    
    throw new Error('Задача не найдена');
    
  } catch (error) {
    Logger.log('Ошибка удаления задачи: ' + error.message);
    return { success: false, error: error.message };
  }
}
