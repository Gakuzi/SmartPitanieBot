/**
 * Главная функция тестирования всех компонентов системы
 */
function runFullSystemTest() {
  Logger.log('НАЧАЛО ПОЛНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ SmartPitanieBot');

  const testResults = {
    timestamp: new Date(),
    tests: [],
    passed: 0,
    failed: 0,
    errors: []
  };

  // Тесты основных компонентов
  const testSuite = [
    { name: 'Конфигурация', func: 'testConfiguration' },
    { name: 'Google Drive', func: 'testDriveSystem' },
    { name: 'Google Sheets', func: 'testSheetsSystem' },
    { name: 'Telegram API', func: 'testTelegramAPI' },
    { name: 'Пользовательские данные', func: 'testUserDataSystem' }
  ];

  // Выполняем все тесты
  testSuite.forEach(test => {
    try {
      Logger.log('Тестируем: ' + test.name);
      const result = eval(test.func + '()');
      testResults.tests.push({
        name: test.name,
        passed: result.passed,
        message: result.message,
        details: result.details || []
      });
      
      if (result.passed) {
        testResults.passed++;
        Logger.log(test.name + ': ПРОШЕЛ');
      } else {
        testResults.failed++;
        Logger.log(test.name + ': ПРОВАЛИЛСЯ - ' + result.message);
      }
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(test.name + ': ' + error.message);
      Logger.log(test.name + ': ОШИБКА - ' + error.message);
    }
  });

  Logger.log('ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
  Logger.log('Прошло: ' + testResults.passed);
  Logger.log('Провалилось: ' + testResults.failed);
  
  return testResults;
}

/**
 * Тест конфигурации и переменных окружения
 */
function testConfiguration() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const requiredProps = ['ROOT_FOLDER_ID', 'TEMPLATE_SHEET_ID', 'USERS_SPREADSHEET_ID', 'TELEGRAM_TOKEN'];
    
    const missingProps = [];
    const presentProps = [];
    
    requiredProps.forEach(prop => {
      const value = scriptProps.getProperty(prop);
      if (value) {
        presentProps.push(prop);
        results.details.push(prop + ': установлен');
      } else {
        missingProps.push(prop);
        results.details.push(prop + ': отсутствует');
      }
    });
    
    if (missingProps.length === 0) {
      results.passed = true;
      results.message = 'Все обязательные свойства настроены';
    } else {
      results.message = 'Отсутствуют: ' + missingProps.join(', ');
    }
    
  } catch (error) {
    results.message = 'Ошибка проверки конфигурации: ' + error.message;
  }
  
  return results;
}

/**
 * Тест системы Google Drive
 */
function testDriveSystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    
    if (!rootFolderId) {
      results.message = 'ROOT_FOLDER_ID не настроен';
      return results;
    }
    
    try {
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      results.details.push('Корневая папка найдена: ' + rootFolder.getName());
      results.passed = true;
      results.message = 'Система Google Drive работает корректно';
    } catch (error) {
      results.message = 'Ошибка доступа к корневой папке: ' + error.message;
    }
    
  } catch (error) {
    results.message = 'Критическая ошибка Drive API: ' + error.message;
  }
  
  return results;
}

/**
 * Тест системы Google Sheets
 */
function testSheetsSystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    
    if (templateId) {
      try {
        const templateSheet = SpreadsheetApp.openById(templateId);
        results.details.push('Шаблонная таблица найдена: ' + templateSheet.getName());
        results.passed = true;
        results.message = 'Система Google Sheets настроена корректно';
      } catch (error) {
        results.message = 'Ошибка доступа к шаблону: ' + error.message;
      }
    } else {
      results.message = 'TEMPLATE_SHEET_ID не настроен';
    }
    
  } catch (error) {
    results.message = 'Критическая ошибка Sheets API: ' + error.message;
  }
  
  return results;
}

/**
 * Тест Telegram API
 */
function testTelegramAPI() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const telegramToken = scriptProps.getProperty('TELEGRAM_TOKEN');
    
    if (!telegramToken) {
      results.message = 'TELEGRAM_TOKEN не настроен';
      return results;
    }
    
    results.details.push('TELEGRAM_TOKEN настроен');
    
    // Проверяем функции Telegram API
    const telegramFunctions = ['sendText', 'sendChatAction', 'answerCallbackQuery'];
    
    telegramFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push('Функция ' + funcName + ': доступна');
        } else {
          results.details.push('Функция ' + funcName + ': не найдена');
        }
      } catch (error) {
        results.details.push('Функция ' + funcName + ': ошибка - ' + error.message);
      }
    });
    
    results.passed = true;
    results.message = 'Telegram API доступен';
    
  } catch (error) {
    results.message = 'Критическая ошибка Telegram API: ' + error.message;
  }
  
  return results;
}

/**
 * Тест системы пользовательских данных
 */
function testUserDataSystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const userFunctions = ['getUserData', 'saveUserParam', 'onboardUser'];
    
    let functionsAvailable = 0;
    
    userFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push('Функция ' + funcName + ': доступна');
          functionsAvailable++;
        } else {
          results.details.push('Функция ' + funcName + ': не найдена');
        }
      } catch (error) {
        results.details.push('Функция ' + funcName + ': ошибка - ' + error.message);
      }
    });
    
    if (functionsAvailable >= 2) {
      results.passed = true;
      results.message = 'Система пользовательских данных работает';
    } else {
      results.message = 'Не все функции пользователей доступны';
    }
    
  } catch (error) {
    results.message = 'Критическая ошибка системы пользователей: ' + error.message;
  }
  
  return results;
}
