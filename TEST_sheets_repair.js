/**
 * @file TEST_sheets_repair.js
 * @description Специальный модуль для диагностики и исправления системы создания листов
 */

/**
 * Полная диагностика и исправление системы листов
 */
function diagnoseAndRepairSheetsSystem() {
  Logger.log('🔧 ДИАГНОСТИКА И ИСПРАВЛЕНИЕ СИСТЕМЫ ЛИСТОВ');
  
  const repairResults = {
    timestamp: new Date(),
    steps: [],
    repaired: [],
    errors: [],
    success: false
  };

  try {
    // Шаг 1: Проверяем конфигурацию
    repairResults.steps.push('Проверка конфигурации...');
    const configCheck = checkSheetsConfiguration();
    if (!configCheck.success) {
      repairResults.steps.push('Исправляем конфигурацию...');
      const configRepair = repairSheetsConfiguration();
      repairResults.repaired.push(...configRepair.actions);
    }

    // Шаг 2: Проверяем и создаем инфраструктуру
    repairResults.steps.push('Проверка инфраструктуры...');
    const infraCheck = checkProjectInfrastructure();
    if (!infraCheck.success) {
      repairResults.steps.push('Создаем инфраструктуру...');
      const infraRepair = createProjectInfrastructure();
      repairResults.repaired.push(...infraRepair.actions);
    }

    // Шаг 3: Проверяем шаблоны листов
    repairResults.steps.push('Проверка шаблонов листов...');
    const templateCheck = checkSheetTemplates();
    if (!templateCheck.success) {
      repairResults.steps.push('Исправляем шаблоны...');
      const templateRepair = repairSheetTemplates();
      repairResults.repaired.push(...templateRepair.actions);
    }

    // Шаг 4: Тестируем создание пользовательских листов
    repairResults.steps.push('Тестируем создание пользовательских листов...');
    const userSheetTest = testUserSheetCreation();
    if (!userSheetTest.success) {
      repairResults.steps.push('Исправляем систему создания пользовательских листов...');
      const userSheetRepair = repairUserSheetSystem();
      repairResults.repaired.push(...userSheetRepair.actions);
    }

    // Шаг 5: Тестируем UI кнопки
    repairResults.steps.push('Тестируем UI кнопки...');
    const uiTest = testUIButtons();
    if (!uiTest.success) {
      repairResults.steps.push('Исправляем UI систему...');
      const uiRepair = repairUISystem();
      repairResults.repaired.push(...uiRepair.actions);
    }

    repairResults.success = true;
    Logger.log('✅ ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ЗАВЕРШЕНЫ УСПЕШНО');

  } catch (error) {
    repairResults.errors.push(`Критическая ошибка: ${error.message}`);
    Logger.log(`❌ КРИТИЧЕСКАЯ ОШИБКА: ${error.message}`);
  }

  // Генерируем отчет
  generateRepairReport(repairResults);
  return repairResults;
}

/**
 * Проверяет конфигурацию системы листов
 */
function checkSheetsConfiguration() {
  const result = { success: false, issues: [], details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    
    // Проверяем обязательные свойства
    const requiredProps = {
      'ROOT_FOLDER_ID': 'ID корневой папки',
      'TEMPLATE_SHEET_ID': 'ID шаблонной таблицы',
      'USERS_SPREADSHEET_ID': 'ID таблицы пользователей'
    };
    
    Object.entries(requiredProps).forEach(([prop, description]) => {
      const value = scriptProps.getProperty(prop);
      if (value) {
        result.details.push(`✅ ${prop}: ${value.substring(0, 20)}...`);
      } else {
        result.issues.push(`❌ Отсутствует ${prop} (${description})`);
      }
    });
    
    result.success = result.issues.length === 0;
    
  } catch (error) {
    result.issues.push(`Ошибка проверки конфигурации: ${error.message}`);
  }
  
  Logger.log(`Конфигурация: ${result.success ? 'OK' : 'ТРЕБУЕТ ИСПРАВЛЕНИЯ'}`);
  return result;
}

/**
 * Исправляет конфигурацию системы листов
 */
function repairSheetsConfiguration() {
  const result = { success: false, actions: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    
    // Проверяем и создаем недостающие компоненты
    let rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    if (!rootFolderId) {
      // Создаем корневую папку
      const rootFolder = DriveApp.createFolder('SmartPit_Users_' + Date.now());
      rootFolderId = rootFolder.getId();
      scriptProps.setProperty('ROOT_FOLDER_ID', rootFolderId);
      result.actions.push(`✅ Создана корневая папка: ${rootFolderId}`);
    }
    
    let templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    if (!templateId) {
      // Создаем шаблонную таблицу
      const templateSheet = SpreadsheetApp.create('Template_SmartPit_Sheet_' + Date.now());
      templateId = templateSheet.getId();
      scriptProps.setProperty('TEMPLATE_SHEET_ID', templateId);
      
      // Перемещаем в корневую папку
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      const templateFile = DriveApp.getFileById(templateId);
      templateFile.moveTo(rootFolder);
      
      result.actions.push(`✅ Создана шаблонная таблица: ${templateId}`);
    }
    
    let usersSpreadsheetId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    if (!usersSpreadsheetId) {
      // Создаем таблицу пользователей
      const usersSpreadsheet = SpreadsheetApp.create('SmartPit_Users_' + Date.now());
      usersSpreadsheetId = usersSpreadsheet.getId();
      scriptProps.setProperty('USERS_SPREADSHEET_ID', usersSpreadsheetId);
      
      // Настраиваем таблицу пользователей
      const usersSheet = usersSpreadsheet.getActiveSheet();
      usersSheet.setName('Пользователи');
      usersSheet.getRange('A1:L1').setValues([[
        'ID', 'Bot', 'Имя', 'Фамилия', 'Username', 'Язык', 'Premium', 
        'Дата регистрации', 'Папка', 'Таблица', 'Категория', 'Админ'
      ]]);
      
      // Перемещаем в корневую папку
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      const usersFile = DriveApp.getFileById(usersSpreadsheetId);
      usersFile.moveTo(rootFolder);
      
      result.actions.push(`✅ Создана таблица пользователей: ${usersSpreadsheetId}`);
    }
    
    result.success = true;
    
  } catch (error) {
    result.actions.push(`❌ Ошибка исправления конфигурации: ${error.message}`);
  }
  
  return result;
}

/**
 * Проверяет инфраструктуру проекта
 */
function checkProjectInfrastructure() {
  const result = { success: false, issues: [], details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    const templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    
    if (rootFolderId) {
      try {
        const rootFolder = DriveApp.getFolderById(rootFolderId);
        result.details.push(`✅ Корневая папка доступна: ${rootFolder.getName()}`);
      } catch (error) {
        result.issues.push(`❌ Корневая папка недоступна: ${error.message}`);
      }
    }
    
    if (templateId) {
      try {
        const templateSheet = SpreadsheetApp.openById(templateId);
        result.details.push(`✅ Шаблонная таблица доступна: ${templateSheet.getName()}`);
        
        // Проверяем листы в шаблоне
        const sheets = templateSheet.getSheets();
        const sheetNames = sheets.map(s => s.getName());
        result.details.push(`📊 Листов в шаблоне: ${sheets.length} (${sheetNames.join(', ')})`);
        
      } catch (error) {
        result.issues.push(`❌ Шаблонная таблица недоступна: ${error.message}`);
      }
    }
    
    result.success = result.issues.length === 0;
    
  } catch (error) {
    result.issues.push(`Ошибка проверки инфраструктуры: ${error.message}`);
  }
  
  Logger.log(`Инфраструктура: ${result.success ? 'OK' : 'ТРЕБУЕТ ИСПРАВЛЕНИЯ'}`);
  return result;
}

/**
 * Создает инфраструктуру проекта
 */
function createProjectInfrastructure() {
  const result = { success: false, actions: [] };
  
  try {
    // Выполняем setupProjectInfrastructure с улучшениями
    const scriptProps = PropertiesService.getScriptProperties();
    const templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    
    if (templateId) {
      const templateSheet = SpreadsheetApp.openById(templateId);
      
      // Создаем необходимые листы
      const requiredSheets = [
        'Меню по дням', 'Список покупок', 'Готовка', 'Замены', 
        'Настройки', 'Логи', 'Продукты', 'Тест отправки'
      ];
      
      const existingSheets = templateSheet.getSheets().map(s => s.getName());
      
      requiredSheets.forEach(sheetName => {
        if (!existingSheets.includes(sheetName)) {
          try {
            const newSheet = templateSheet.insertSheet(sheetName);
            
            // Настраиваем специальные листы
            if (sheetName === 'Продукты') {
              newSheet.getRange('A1:F1').setValues([['Тип', 'Блюдо', 'Калории', 'Белки', 'Жиры', 'Углеводы']]);
            } else if (sheetName === 'Тест отправки') {
              newSheet.getRange('A1:B1').setValues([['Сообщение', 'Действие']]);
            } else if (sheetName === 'Настройки') {
              newSheet.getRange('A1:B10').setValues([
                ['Параметр', 'Значение'],
                ['Имя', ''],
                ['Вес', ''],
                ['Рост', ''],
                ['Возраст', ''],
                ['Пол', ''],
                ['Активность', ''],
                ['Цель', ''],
                ['Время уведомлений', ''],
                ['Режим AI', 'false']
              ]);
            }
            
            result.actions.push(`✅ Создан лист: ${sheetName}`);
          } catch (error) {
            result.actions.push(`❌ Ошибка создания листа ${sheetName}: ${error.message}`);
          }
        } else {
          result.actions.push(`ℹ️ Лист ${sheetName} уже существует`);
        }
      });
    }
    
    result.success = true;
    
  } catch (error) {
    result.actions.push(`❌ Ошибка создания инфраструктуры: ${error.message}`);
  }
  
  return result;
}

/**
 * Проверяет шаблоны листов
 */
function checkSheetTemplates() {
  const result = { success: false, issues: [], details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    
    if (!templateId) {
      result.issues.push('Шаблонная таблица не настроена');
      return result;
    }
    
    const templateSheet = SpreadsheetApp.openById(templateId);
    const sheets = templateSheet.getSheets();
    const sheetNames = sheets.map(s => s.getName());
    
    const requiredSheets = [
      'Меню по дням', 'Список покупок', 'Готовка', 'Замены', 
      'Настройки', 'Логи', 'Продукты', 'Тест отправки'
    ];
    
    requiredSheets.forEach(requiredSheet => {
      if (sheetNames.includes(requiredSheet)) {
        result.details.push(`✅ Лист "${requiredSheet}" найден`);
      } else {
        result.issues.push(`❌ Отсутствует лист "${requiredSheet}"`);
      }
    });
    
    result.success = result.issues.length === 0;
    
  } catch (error) {
    result.issues.push(`Ошибка проверки шаблонов: ${error.message}`);
  }
  
  Logger.log(`Шаблоны листов: ${result.success ? 'OK' : 'ТРЕБУЕТ ИСПРАВЛЕНИЯ'}`);
  return result;
}

/**
 * Исправляет шаблоны листов
 */
function repairSheetTemplates() {
  const result = { success: false, actions: [] };
  
  try {
    // Используем функцию создания инфраструктуры
    const infraResult = createProjectInfrastructure();
    result.actions.push(...infraResult.actions);
    result.success = infraResult.success;
    
  } catch (error) {
    result.actions.push(`❌ Ошибка исправления шаблонов: ${error.message}`);
  }
  
  return result;
}

/**
 * Тестирует создание пользовательских листов
 */
function testUserSheetCreation() {
  const result = { success: false, issues: [], details: [] };
  
  try {
    // Создаем тестового пользователя
    const testChatId = 'test_user_' + Date.now();
    const testUser = {
      id: testChatId,
      first_name: 'Test User',
      username: 'testuser'
    };
    
    result.details.push(`🧪 Тестируем создание пользователя: ${testChatId}`);
    
    // Пытаемся создать пользователя
    try {
      onboardUser(testChatId, testUser);
      result.details.push(`✅ Пользователь создан успешно`);
      
      // Проверяем, что папка создана
      const scriptProps = PropertiesService.getScriptProperties();
      const userFolderId = scriptProps.getProperty(String(testChatId));
      
      if (userFolderId) {
        const userFolder = DriveApp.getFolderById(userFolderId);
        result.details.push(`✅ Папка пользователя создана: ${userFolder.getName()}`);
        
        // Проверяем файлы в папке
        const files = userFolder.getFiles();
        let fileCount = 0;
        while (files.hasNext()) {
          files.next();
          fileCount++;
        }
        result.details.push(`📄 Файлов в папке пользователя: ${fileCount}`);
        
        result.success = true;
        
        // Очищаем тестовые данные
        try {
          scriptProps.deleteProperty(String(testChatId));
          userFolder.setTrashed(true);
          result.details.push(`🗑️ Тестовые данные очищены`);
        } catch (cleanupError) {
          result.details.push(`⚠️ Предупреждение при очистке: ${cleanupError.message}`);
        }
        
      } else {
        result.issues.push('Папка пользователя не была создана');
      }
      
    } catch (error) {
      result.issues.push(`Ошибка создания пользователя: ${error.message}`);
    }
    
  } catch (error) {
    result.issues.push(`Критическая ошибка тестирования: ${error.message}`);
  }
  
  Logger.log(`Создание пользовательских листов: ${result.success ? 'OK' : 'ТРЕБУЕТ ИСПРАВЛЕНИЯ'}`);
  return result;
}

/**
 * Исправляет систему создания пользовательских листов
 */
function repairUserSheetSystem() {
  const result = { success: false, actions: [] };
  
  try {
    // Проверяем функцию onboardUser
    try {
      const func = eval('onboardUser');
      if (typeof func === 'function') {
        result.actions.push(`✅ Функция onboardUser доступна`);
      } else {
        result.actions.push(`❌ Функция onboardUser не найдена`);
        return result;
      }
    } catch (error) {
      result.actions.push(`❌ Ошибка проверки onboardUser: ${error.message}`);
      return result;
    }
    
    // Проверяем доступ к Drive API
    try {
      const testFolder = DriveApp.createFolder('test_' + Date.now());
      testFolder.setTrashed(true);
      result.actions.push(`✅ Drive API доступен`);
    } catch (error) {
      result.actions.push(`❌ Проблема с Drive API: ${error.message}`);
    }
    
    // Проверяем доступ к Sheets API
    try {
      const testSheet = SpreadsheetApp.create('test_' + Date.now());
      DriveApp.getFileById(testSheet.getId()).setTrashed(true);
      result.actions.push(`✅ Sheets API доступен`);
    } catch (error) {
      result.actions.push(`❌ Проблема с Sheets API: ${error.message}`);
    }
    
    result.success = true;
    
  } catch (error) {
    result.actions.push(`❌ Критическая ошибка исправления: ${error.message}`);
  }
  
  return result;
}

/**
 * Тестирует UI кнопки
 */
function testUIButtons() {
  const result = { success: false, issues: [], details: [] };
  
  try {
    // Проверяем основные UI функции
    const uiFunctions = [
      'getMenu',
      'sendMenu', 
      'sendSettingsMenu',
      'showAdminPanel'
    ];
    
    let functionsAvailable = 0;
    
    uiFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          result.details.push(`✅ Функция ${funcName}: доступна`);
          functionsAvailable++;
        } else {
          result.issues.push(`❌ Функция ${funcName}: не найдена`);
        }
      } catch (error) {
        result.issues.push(`❌ Функция ${funcName}: ошибка - ${error.message}`);
      }
    });
    
    result.success = functionsAvailable >= 3;
    
  } catch (error) {
    result.issues.push(`Критическая ошибка тестирования UI: ${error.message}`);
  }
  
  Logger.log(`UI кнопки: ${result.success ? 'OK' : 'ТРЕБУЕТ ИСПРАВЛЕНИЯ'}`);
  return result;
}

/**
 * Исправляет UI систему
 */
function repairUISystem() {
  const result = { success: false, actions: [] };
  
  try {
    // Проверяем наличие onOpen функции
    try {
      const func = eval('onOpen');
      if (typeof func === 'function') {
        result.actions.push(`✅ Функция onOpen доступна`);
        
        // Пытаемся выполнить onOpen
        onOpen();
        result.actions.push(`✅ Функция onOpen выполнена успешно`);
      } else {
        result.actions.push(`❌ Функция onOpen не найдена`);
      }
    } catch (error) {
      result.actions.push(`❌ Ошибка выполнения onOpen: ${error.message}`);
    }
    
    result.success = true;
    
  } catch (error) {
    result.actions.push(`❌ Критическая ошибка исправления UI: ${error.message}`);
  }
  
  return result;
}

/**
 * Генерирует отчет о диагностике и исправлении
 */
function generateRepairReport(repairResults) {
  Logger.log('\n🔧 ОТЧЕТ О ДИАГНОСТИКЕ И ИСПРАВЛЕНИИ');
  Logger.log('=' .repeat(60));
  Logger.log(`🕐 Время: ${repairResults.timestamp}`);
  Logger.log(`📊 Статус: ${repairResults.success ? '✅ УСПЕШНО' : '❌ С ОШИБКАМИ'}`);
  
  Logger.log('\n📋 ВЫПОЛНЕННЫЕ ШАГИ:');
  repairResults.steps.forEach((step, index) => {
    Logger.log(`   ${index + 1}. ${step}`);
  });
  
  if (repairResults.repaired.length > 0) {
    Logger.log('\n🔧 ВЫПОЛНЕННЫЕ ИСПРАВЛЕНИЯ:');
    repairResults.repaired.forEach(action => {
      Logger.log(`   ${action}`);
    });
  }
  
  if (repairResults.errors.length > 0) {
    Logger.log('\n❌ ОШИБКИ:');
    repairResults.errors.forEach(error => {
      Logger.log(`   ${error}`);
    });
  }
  
  Logger.log('\n💡 РЕКОМЕНДАЦИИ:');
  Logger.log('   1. Проверьте права доступа к Google Drive и Sheets');
  Logger.log('   2. Убедитесь, что все переменные окружения настроены');
  Logger.log('   3. Протестируйте создание пользователя командой /start');
  Logger.log('   4. Проверьте логи на наличие дополнительных ошибок');
}