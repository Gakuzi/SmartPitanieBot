function getUserSheet(chatId) {
  const userData = getUserData(chatId);
  const sheetId = userData.sheetId;
  if (!sheetId) {
    sendText(chatId, "Ваша персональная таблица данных не найдена. Попробуйте выполнить команду /start для ее создания.");
    return null;
  }
  try {
    return SpreadsheetApp.openById(sheetId);
  } catch (e) {
    Logger.log(`Ошибка открытия таблицы для пользователя ${chatId} с ID ${sheetId}: ${e.message}`);
    sendText(chatId, "Не удалось открыть вашу персональную таблицу данных. Обратитесь к администратору.");
    return null;
  }
}

// --- Функции отправки данных из таблицы ---
function sendTodayMenu(chatId) {
  const sheet = getUserSheet(chatId);
  if (!sheet) return;
  const menuSheet = sheet.getSheetByName("Меню по дням");
  const today = new Date();
  const dayNum = (today.getDate() % 20) + 1;
  const data = menuSheet.getDataRange().getValues();
  const row = data.find(r => r[0] === dayNum);
  if (!row) return sendText(chatId, "Меню на сегодня не найдено.", getMenu(chatId));

  const [_, zavtrak, perk1, obed, perk2, uzhin, kcal, cost] = row;
  const text = `🍽 *Меню на день ${dayNum}*\n\n` +
    `*Завтрак:* ${zavtrak}\n` +
    `*Перекус 1:* ${perk1}\n` +
    `*Обед:* ${obed}\n` +
    `*Перекус 2:* ${perk2}\n` +
    `*Ужин:* ${uzhin}\n\n` +
    `Калорийность: *${kcal} ккал*\nСтоимость: *${cost} ₽*`;

  sendText(chatId, text, getMenu(chatId));
}

function sendShoppingList(chatId) {
  const sheet = getUserSheet(chatId);
  if (!sheet) return;
  const shopSheet = sheet.getSheetByName("Список покупок");
  const data = shopSheet.getDataRange().getValues();
  const today = new Date().toLocaleDateString("ru-RU");
  const todayItems = data.filter(r => r[0] === today);

  if (!todayItems.length) return sendText(chatId, "На сегодня список покупок пуст.", getMenu(chatId));

  const list = todayItems.map(r => `☐ ${r[1]} — ${r[3]} ${r[2]}`).join("\n");
  sendText(chatId, `🛒 *Список покупок на ${today}*\n\n${list}`, getMenu(chatId));
}

function sendCookingList(chatId) {
  const sheet = getUserSheet(chatId);
  if (!sheet) return;
  const cookSheet = sheet.getSheetByName("Готовка");
  const data = cookSheet.getDataRange().getValues();
  const today = new Date().toLocaleDateString("ru-RU");
  const todayCook = data.filter(r => r[0] === today);

  if (!todayCook.length) return sendText(chatId, "Сегодня ничего готовить не нужно.", getMenu(chatId));

  const list = todayCook.map(r => `🍲 ${r[1]} — из: ${r[2]} на ${r[3]} дней`).join("\n");
  sendText(chatId, `👨‍🍳 *Сегодня готовим:*\n\n${list}`, getMenu(chatId));
}

function sendSubstitute(chatId, msg) {
  const sheet = getUserSheet(chatId);
  if (!sheet) return;
  const subSheet = sheet.getSheetByName("Замены");
  const parts = msg.split(" ");
  if (parts.length < 3) return sendText(chatId, "Укажите продукт после слова 'замена', например:\n🔄 замена творог", getMenu(chatId));
  const target = parts.slice(2).join(" ").toLowerCase();

  const data = subSheet.getDataRange().getValues();
  const row = data.find(r => r[0].toLowerCase() === target);

  if (!row) return sendText(chatId, `Нет информации о заменах для "${target}".`, getMenu(chatId));

  const substitutes = row.slice(1).filter(v => v);
  const list = substitutes.map(s => `🔁 ${s}`).join("\n");
  const text = `♻️ Возможные замены для *${target}*:*\n\n${list}`;

  sendText(chatId, text, getMenu(chatId));
}

// --- Авторассылка по времени пользователя ---
function sendDailyNotifications() {
  const allUsers = getAllUsers();
  const now = new Date();
  const nowStr = Utilities.formatDate(now, "GMT+3", "HH:mm");

  allUsers.forEach(chatId => {
    const userData = getUserData(chatId);
    if (userData.notifyTime === nowStr) {
      sendTodayMenu(chatId);
      sendShoppingList(chatId);
      sendCookingList(chatId);
    }
  });
}

/**
 * Сохраняет сгенерированное AI меню в таблицу пользователя.
 * @param {string|number} chatId - ID чата.
 * @param {object} menu - Объект меню, сгенерированный AI.
 */
function saveMenuToSheet(chatId, menu) {
  const sheet = getUserSheet(chatId);
  if (!sheet) return;

  let menuSheet = sheet.getSheetByName("Меню от AI");
  if (!menuSheet) {
    menuSheet = sheet.insertSheet("Меню от AI");
    menuSheet.appendRow(["Дата", "Прием пищи", "Блюдо", "Описание", "Ккал", "Белки", "Жиры", "Углеводы", "Ингредиенты", "Инструкции"]);
  }

  const today = new Date().toLocaleDateString("ru-RU");
  menu.meals.forEach(meal => {
    menuSheet.appendRow([
      today,
      meal.name,
      meal.recipe_name,
      meal.description,
      meal.calories,
      meal.proteins,
      meal.fats,
      meal.carbs,
      meal.ingredients.map(i => `${i.name} (${i.amount})`).join(", "),
      meal.instructions.join("\n")
    ]);
  });

  sendText(chatId, "✅ Меню успешно сохранено в вашу Google Таблицу.", getMenu(chatId));
}

/**
 * УЛУЧШЕННАЯ ФУНКЦИЯ УПРАВЛЕНИЯ ЛИСТАМИ И ТАБЛИЦАМИ
 * Создает полную инфраструктуру системы и восстанавливает структуру при необходимости
 * НЕ ЗАТРАГИВАЕТ существующие данные пользователей
 */
function setupCompleteInfrastructure() {
  Logger.log('🚀 ЗАПУСК ПОЛНОЙ НАСТРОЙКИ ИНФРАСТРУКТУРЫ SmartPitanieBot');
  
  const results = {
    timestamp: new Date(),
    steps: [],
    created: [],
    restored: [],
    errors: [],
    success: false
  };

  try {
    const scriptProps = PropertiesService.getScriptProperties();
    
    // Шаг 1: Создание корневой папки проекта
    results.steps.push('Создание корневой папки проекта...');
    let rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    if (!rootFolderId) {
      const rootFolder = DriveApp.createFolder('SmartPitanieBot_Project');
      rootFolderId = rootFolder.getId();
      scriptProps.setProperty('ROOT_FOLDER_ID', rootFolderId);
      results.created.push('Корневая папка проекта: ' + rootFolderId);
    } else {
      results.restored.push('Корневая папка уже существует: ' + rootFolderId);
    }

    // Шаг 2: Создание папки для пользователей
    results.steps.push('Создание папки пользователей...');
    let usersFolderId = scriptProps.getProperty('USERS_FOLDER_ID');
    if (!usersFolderId) {
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      const usersFolder = rootFolder.createFolder('Users');
      usersFolderId = usersFolder.getId();
      scriptProps.setProperty('USERS_FOLDER_ID', usersFolderId);
      results.created.push('Папка пользователей: ' + usersFolderId);
    } else {
      results.restored.push('Папка пользователей уже существует: ' + usersFolderId);
    }

    // Шаг 3: Создание папки для данных проекта
    results.steps.push('Создание папки данных проекта...');
    let dataFolderId = scriptProps.getProperty('DATA_FOLDER_ID');
    if (!dataFolderId) {
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      const dataFolder = rootFolder.createFolder('ProjectData');
      dataFolderId = dataFolder.getId();
      scriptProps.setProperty('DATA_FOLDER_ID', dataFolderId);
      results.created.push('Папка данных проекта: ' + dataFolderId);
    } else {
      results.restored.push('Папка данных проекта уже существует: ' + dataFolderId);
    }

    // Шаг 4: Создание шаблонной таблицы
    results.steps.push('Создание шаблонной таблицы...');
    let templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    if (!templateId) {
      const templateSheet = SpreadsheetApp.create('Template_SmartPit_Sheet');
      templateId = templateSheet.getId();
      scriptProps.setProperty('TEMPLATE_SHEET_ID', templateId);
      
      // Перемещаем в папку данных проекта
      const dataFolder = DriveApp.getFolderById(dataFolderId);
      const templateFile = DriveApp.getFileById(templateId);
      templateFile.moveTo(dataFolder);
      
      results.created.push('Шаблонная таблица: ' + templateId);
    } else {
      results.restored.push('Шаблонная таблица уже существует: ' + templateId);
    }

    // Шаг 5: Создание таблицы пользователей
    results.steps.push('Создание таблицы пользователей...');
    let usersSpreadsheetId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    if (!usersSpreadsheetId) {
      const usersSpreadsheet = SpreadsheetApp.create('SmartPit_Users_Database');
      usersSpreadsheetId = usersSpreadsheet.getId();
      scriptProps.setProperty('USERS_SPREADSHEET_ID', usersSpreadsheetId);
      
      // Перемещаем в папку данных проекта
      const dataFolder = DriveApp.getFolderById(dataFolderId);
      const usersFile = DriveApp.getFileById(usersSpreadsheetId);
      usersFile.moveTo(dataFolder);
      
      results.created.push('Таблица пользователей: ' + usersSpreadsheetId);
    } else {
      results.restored.push('Таблица пользователей уже существует: ' + usersSpreadsheetId);
    }

    // Шаг 6: Создание таблицы управления проектом
    results.steps.push('Создание таблицы управления проектом...');
    let projectManagerId = scriptProps.getProperty('PROJECT_MANAGER_ID');
    if (!projectManagerId) {
      const projectSpreadsheet = SpreadsheetApp.create('SmartPit_Project_Manager');
      projectManagerId = projectSpreadsheet.getId();
      scriptProps.setProperty('PROJECT_MANAGER_ID', projectManagerId);
      
      // Перемещаем в папку данных проекта
      const dataFolder = DriveApp.getFolderById(dataFolderId);
      const projectFile = DriveApp.getFileById(projectManagerId);
      projectFile.moveTo(dataFolder);
      
      results.created.push('Таблица управления проектом: ' + projectManagerId);
    } else {
      results.restored.push('Таблица управления проектом уже существует: ' + projectManagerId);
    }

    // Шаг 7: Настройка структуры шаблонной таблицы
    results.steps.push('Настройка структуры шаблонной таблицы...');
    const templateSheet = SpreadsheetApp.openById(templateId);
    setupTemplateStructure(templateSheet);
    results.created.push('Структура шаблонной таблицы настроена');

    // Шаг 8: Настройка структуры таблицы пользователей
    results.steps.push('Настройка структуры таблицы пользователей...');
    const usersSpreadsheet = SpreadsheetApp.openById(usersSpreadsheetId);
    setupUsersStructure(usersSpreadsheet);
    results.created.push('Структура таблицы пользователей настроена');

    // Шаг 9: Настройка структуры таблицы управления проектом
    results.steps.push('Настройка структуры таблицы управления проектом...');
    const projectSpreadsheet = SpreadsheetApp.openById(projectManagerId);
    setupProjectManagerStructure(projectSpreadsheet);
    results.created.push('Структура таблицы управления проектом настроена');

    results.success = results.errors.length === 0;
    Logger.log('✅ ПОЛНАЯ НАСТРОЙКА ИНФРАСТРУКТУРЫ ЗАВЕРШЕНА');

  } catch (error) {
    results.errors.push('Критическая ошибка: ' + error.message);
    Logger.log('❌ КРИТИЧЕСКАЯ ОШИБКА: ' + error.message);
  }

  return results;
}

/**
 * Настройка структуры шаблонной таблицы
 */
function setupTemplateStructure(templateSheet) {
  try {
    // Создаем необходимые листы
    const requiredSheets = [
      'Меню по дням', 'Список покупок', 'Готовка', 'Замены', 
      'Настройки', 'Логи', 'Продукты', 'Тест отправки', 'Экспорт данных'
    ];
    
    const existingSheets = templateSheet.getSheets().map(sheet => sheet.getName());
    
    // Переименовываем первый лист
    const defaultSheet = templateSheet.getSheets()[0];
    if (defaultSheet.getName() !== requiredSheets[0]) {
      templateSheet.renameActiveSheet(requiredSheets[0]);
    }

    // Создаем недостающие листы
    for (let i = 1; i < requiredSheets.length; i++) {
      if (!existingSheets.includes(requiredSheets[i])) {
        templateSheet.insertSheet(requiredSheets[i]);
      }
    }

    // Настраиваем лист Продукты
    const productsSheet = templateSheet.getSheetByName('Продукты');
    if (productsSheet) {
      productsSheet.getRange('A1:F1').setValues([['Тип', 'Блюдо', 'Калории', 'Белки', 'Жиры', 'Углеводы']]);
      productsSheet.getRange('A1:F1').setFontWeight('bold');
    }

    // Настраиваем лист Тест отправки
    const testSheet = templateSheet.getSheetByName('Тест отправки');
    if (testSheet) {
      testSheet.getRange('A1:B1').setValues([['Сообщение', 'Действие']]);
      testSheet.getRange('A1:B1').setFontWeight('bold');
    }

    // Настраиваем лист Экспорт данных
    const exportSheet = templateSheet.getSheetByName('Экспорт данных');
    if (exportSheet) {
      exportSheet.getRange('A1:D1').setValues([['Дата', 'Тип данных', 'Содержимое', 'Статус']]);
      exportSheet.getRange('A1:D1').setFontWeight('bold');
    }

  } catch (error) {
    Logger.log('Ошибка настройки структуры шаблона: ' + error.message);
    throw error;
  }
}

/**
 * Настройка структуры таблицы пользователей
 */
function setupUsersStructure(usersSpreadsheet) {
  try {
    const usersSheet = usersSpreadsheet.getActiveSheet();
    usersSheet.setName('Пользователи');
    
    // Заголовки таблицы пользователей
    const headers = [
      'ID', 'Bot', 'Имя', 'Фамилия', 'Username', 'Язык', 'Premium', 
      'Дата регистрации', 'Папка', 'Таблица', 'Категория', 'Админ', 'Статус'
    ];
    
    usersSheet.getRange('A1:M1').setValues([headers]);
    usersSheet.getRange('A1:M1').setFontWeight('bold');
    
    // Создаем дополнительные листы
    const additionalSheets = ['Статистика', 'Логи активности', 'Настройки системы'];
    
    additionalSheets.forEach(sheetName => {
      if (!usersSpreadsheet.getSheetByName(sheetName)) {
        usersSpreadsheet.insertSheet(sheetName);
      }
    });

  } catch (error) {
    Logger.log('Ошибка настройки структуры пользователей: ' + error.message);
    throw error;
  }
}

/**
 * Настройка структуры таблицы управления проектом
 */
function setupProjectManagerStructure(projectSpreadsheet) {
  try {
    const mainSheet = projectSpreadsheet.getActiveSheet();
    mainSheet.setName('Задачи');
    
    // Заголовки таблицы задач
    const taskHeaders = [
      'ID', 'Название', 'Описание', 'Приоритет', 'Статус', 'Исполнитель', 
      'Дата создания', 'Дедлайн', 'Прогресс', 'Теги', 'Комментарии'
    ];
    
    mainSheet.getRange('A1:K1').setValues([taskHeaders]);
    mainSheet.getRange('A1:K1').setFontWeight('bold');
    
    // Создаем дополнительные листы для управления проектом
    const projectSheets = [
      'Проекты', 'Команда', 'Ресурсы', 'Временные рамки', 'Риски', 
      'Документация', 'Метрики', 'Отчеты'
    ];
    
    projectSheets.forEach(sheetName => {
      if (!projectSpreadsheet.getSheetByName(sheetName)) {
        const newSheet = projectSpreadsheet.insertSheet(sheetName);
        
        // Настраиваем заголовки для каждого листа
        switch (sheetName) {
          case 'Проекты':
            newSheet.getRange('A1:E1').setValues([['ID', 'Название', 'Описание', 'Статус', 'Дата создания']]);
            break;
          case 'Команда':
            newSheet.getRange('A1:D1').setValues([['ID', 'Имя', 'Роль', 'Email']]);
            break;
          case 'Метрики':
            newSheet.getRange('A1:F1').setValues([['Дата', 'Метрика', 'Значение', 'Цель', 'Тренд', 'Комментарий']]);
            break;
          case 'Отчеты':
            newSheet.getRange('A1:E1').setValues([['Дата', 'Тип отчета', 'Содержание', 'Автор', 'Статус']]);
            break;
        }
        
        if (newSheet.getRange('A1').getValue()) {
          newSheet.getRange('A1:Z1').setFontWeight('bold');
        }
      }
    });

  } catch (error) {
    Logger.log('Ошибка настройки структуры управления проектом: ' + error.message);
    throw error;
  }
}

/**
 * Восстановление структуры таблиц без потери данных
 */
function restoreTableStructure() {
  Logger.log('🔄 ЗАПУСК ВОССТАНОВЛЕНИЯ СТРУКТУРЫ ТАБЛИЦ');
  
  const results = {
    timestamp: new Date(),
    restored: [],
    errors: [],
    success: false
  };

  try {
    const scriptProps = PropertiesService.getScriptProperties();
    
    // Восстанавливаем шаблонную таблицу
    const templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    if (templateId) {
      try {
        const templateSheet = SpreadsheetApp.openById(templateId);
        setupTemplateStructure(templateSheet);
        results.restored.push('Структура шаблонной таблицы восстановлена');
      } catch (error) {
        results.errors.push('Ошибка восстановления шаблона: ' + error.message);
      }
    }

    // Восстанавливаем таблицу пользователей
    const usersId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    if (usersId) {
      try {
        const usersSpreadsheet = SpreadsheetApp.openById(usersId);
        setupUsersStructure(usersSpreadsheet);
        results.restored.push('Структура таблицы пользователей восстановлена');
      } catch (error) {
        results.errors.push('Ошибка восстановления пользователей: ' + error.message);
      }
    }

    // Восстанавливаем таблицу управления проектом
    const projectId = scriptProps.getProperty('PROJECT_MANAGER_ID');
    if (projectId) {
      try {
        const projectSpreadsheet = SpreadsheetApp.openById(projectId);
        setupProjectManagerStructure(projectSpreadsheet);
        results.restored.push('Структура таблицы управления проектом восстановлена');
      } catch (error) {
        results.errors.push('Ошибка восстановления управления проектом: ' + error.message);
      }
    }

    results.success = results.errors.length === 0;
    Logger.log('✅ ВОССТАНОВЛЕНИЕ СТРУКТУРЫ ЗАВЕРШЕНО');

  } catch (error) {
    results.errors.push('Критическая ошибка восстановления: ' + error.message);
    Logger.log('❌ КРИТИЧЕСКАЯ ОШИБКА ВОССТАНОВЛЕНИЯ: ' + error.message);
  }

  return results;
}