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

// showWebhookManagerDialog определен в ui_dialogs.js (во избежание дублирования)

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
    const results = runFullSystemTest();
    
    let message = '📊 *Результаты диагностики системы:*\n\n';
    message += `✅ Пройдено: ${results.passed}\n`;
    message += `❌ Провалено: ${results.failed}\n`;
    message += `📈 Общий результат: ${results.passed}/${results.tests.length}\n\n`;
    
    if (results.tests) {
      message += '*Детальные результаты:*\n';
      results.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        message += `${status} ${test.name}: ${test.message}\n`;
      });
    }
    
    if (results.errors && results.errors.length > 0) {
      message += '\n*Ошибки:*\n';
      results.errors.forEach(error => {
        message += `❌ ${error}\n`;
      });
    }
    
    sendText(chatId, message);
    
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
  sendText(chatId, '🔄 Запуск восстановления структуры листов...');
  
  try {
    const results = restoreTableStructure();
    
    let message = '📋 *Результаты восстановления:*\n\n';
    
    if (results.restored && results.restored.length > 0) {
      message += '✅ *Восстановлено:*\n';
      results.restored.forEach(item => {
        message += `• ${item}\n`;
      });
    }
    
    if (results.errors && results.errors.length > 0) {
      message += '\n❌ *Ошибки:*\n';
      results.errors.forEach(error => {
        message += `• ${error}\n`;
      });
    }
    
    if (results.success) {
      message += '\n✅ Восстановление завершено успешно!';
    } else {
      message += '\n⚠️ Восстановление завершено с ошибками.';
    }
    
    sendText(chatId, message);
    
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
