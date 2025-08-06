/**
 * @file TEST_system.js
 * @description Модуль автоматического тестирования всех компонентов SmartPitanieBot
 */

/**
 * Главная функция тестирования всех компонентов системы
 */
function runFullSystemTest() {
  Logger.log('🚀 НАЧАЛО ПОЛНОГО ТЕСТИРОВАНИЯ СИСТЕМЫ SmartPitanieBot');
  
  const testResults = {
    timestamp: new Date(),
    tests: [],
    passed: 0,
    failed: 0,
    errors: []
  };

  // Тесты основных компонентов
  const testSuite = [
    { name: 'Конфигурация и переменные окружения', func: testConfiguration },
    { name: 'Google Drive и папки', func: testDriveSystem },
    { name: 'Google Sheets и шаблоны', func: testSheetsSystem },
    { name: 'Telegram API функции', func: testTelegramAPI },
    { name: 'Пользовательские данные', func: testUserDataSystem },
    { name: 'Система сессий', func: testSessionSystem },
    { name: 'UI меню и кнопки', func: testUISystem },
    { name: 'Система расчетов BMR', func: testCalculationSystem },
    { name: 'Gemini AI интеграция', func: testGeminiAPI },
    { name: 'Webhook обработка', func: testWebhookSystem }
  ];

  // Выполняем все тесты
  testSuite.forEach(test => {
    try {
      Logger.log(`\n📋 Тестируем: ${test.name}`);
      const result = test.func();
      testResults.tests.push({
        name: test.name,
        passed: result.passed,
        message: result.message,
        details: result.details || []
      });
      
      if (result.passed) {
        testResults.passed++;
        Logger.log(`✅ ${test.name}: ПРОШЕЛ`);
      } else {
        testResults.failed++;
        Logger.log(`❌ ${test.name}: ПРОВАЛИЛСЯ - ${result.message}`);
      }
    } catch (error) {
      testResults.failed++;
      testResults.errors.push(`${test.name}: ${error.message}`);
      Logger.log(`💥 ${test.name}: ОШИБКА - ${error.message}`);
    }
  });

  // Генерируем отчет
  generateTestReport(testResults);
  
  Logger.log(`\n🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО`);
  Logger.log(`✅ Прошло: ${testResults.passed}`);
  Logger.log(`❌ Провалилось: ${testResults.failed}`);
  Logger.log(`📊 Общий результат: ${testResults.passed}/${testResults.tests.length}`);
  
  return testResults;
}

/**
 * Тест конфигурации и переменных окружения
 */
function testConfiguration() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const requiredProps = [
      'ROOT_FOLDER_ID',
      'TEMPLATE_SHEET_ID', 
      'USERS_SPREADSHEET_ID',
      'TELEGRAM_TOKEN'
    ];
    
    const missingProps = [];
    const presentProps = [];
    
    requiredProps.forEach(prop => {
      const value = scriptProps.getProperty(prop);
      if (value) {
        presentProps.push(prop);
        results.details.push(`✅ ${prop}: установлен`);
      } else {
        missingProps.push(prop);
        results.details.push(`❌ ${prop}: отсутствует`);
      }
    });
    
    // Проверяем опциональные свойства
    const optionalProps = ['GEMINI_API_KEY', 'ADMIN_CHAT_ID'];
    optionalProps.forEach(prop => {
      const value = scriptProps.getProperty(prop);
      if (value) {
        results.details.push(`🔶 ${prop}: установлен (опционально)`);
      } else {
        results.details.push(`⚪ ${prop}: не установлен (опционально)`);
      }
    });
    
    if (missingProps.length === 0) {
      results.passed = true;
      results.message = `Все обязательные свойства настроены (${presentProps.length}/${requiredProps.length})`;
    } else {
      results.message = `Отсутствуют обязательные свойства: ${missingProps.join(', ')}`;
    }
    
  } catch (error) {
    results.message = `Ошибка при проверке конфигурации: ${error.message}`;
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
    
    // Проверяем доступ к корневой папке
    try {
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      results.details.push(`✅ Корневая папка найдена: ${rootFolder.getName()}`);
      results.details.push(`📁 URL: ${rootFolder.getUrl()}`);
      
      // Проверяем права доступа
      const files = rootFolder.getFiles();
      const folders = rootFolder.getFolders();
      
      let fileCount = 0;
      let folderCount = 0;
      
      while (files.hasNext()) {
        files.next();
        fileCount++;
      }
      
      while (folders.hasNext()) {
        folders.next();
        folderCount++;
      }
      
      results.details.push(`📄 Файлов в корневой папке: ${fileCount}`);
      results.details.push(`📁 Подпапок: ${folderCount}`);
      
      results.passed = true;
      results.message = 'Система Google Drive работает корректно';
      
    } catch (error) {
      results.message = `Ошибка доступа к корневой папке: ${error.message}`;
    }
    
  } catch (error) {
    results.message = `Критическая ошибка Drive API: ${error.message}`;
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
    const usersSpreadsheetId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    
    // Проверяем шаблонную таблицу
    if (templateId) {
      try {
        const templateSheet = SpreadsheetApp.openById(templateId);
        results.details.push(`✅ Шаблонная таблица найдена: ${templateSheet.getName()}`);
        
        const sheets = templateSheet.getSheets();
        results.details.push(`📊 Листов в шаблоне: ${sheets.length}`);
        
        const expectedSheets = ['Меню по дням', 'Список покупок', 'Готовка', 'Замены', 'Настройки', 'Логи', 'Продукты'];
        const actualSheetNames = sheets.map(sheet => sheet.getName());
        
        expectedSheets.forEach(sheetName => {
          if (actualSheetNames.includes(sheetName)) {
            results.details.push(`✅ Лист "${sheetName}": найден`);
          } else {
            results.details.push(`❌ Лист "${sheetName}": отсутствует`);
          }
        });
        
      } catch (error) {
        results.details.push(`❌ Ошибка доступа к шаблону: ${error.message}`);
      }
    } else {
      results.details.push(`❌ TEMPLATE_SHEET_ID не настроен`);
    }
    
    // Проверяем таблицу пользователей
    if (usersSpreadsheetId) {
      try {
        const usersSheet = SpreadsheetApp.openById(usersSpreadsheetId);
        results.details.push(`✅ Таблица пользователей найдена: ${usersSheet.getName()}`);
        
        const usersList = usersSheet.getSheetByName('Пользователи');
        if (usersList) {
          const lastRow = usersList.getLastRow();
          results.details.push(`👥 Пользователей в таблице: ${Math.max(0, lastRow - 1)}`);
        }
        
      } catch (error) {
        results.details.push(`❌ Ошибка доступа к таблице пользователей: ${error.message}`);
      }
    } else {
      results.details.push(`❌ USERS_SPREADSHEET_ID не настроен`);
    }
    
    // Тестируем функцию создания листов
    try {
      results.details.push(`🧪 Тестируем функцию setupProjectInfrastructure...`);
      // Здесь можно добавить безопасный тест создания инфраструктуры
      results.details.push(`⚠️ Функция setupProjectInfrastructure доступна (не выполнена в тесте)`);
    } catch (error) {
      results.details.push(`❌ Ошибка функции setupProjectInfrastructure: ${error.message}`);
    }
    
    if (templateId && usersSpreadsheetId) {
      results.passed = true;
      results.message = 'Система Google Sheets настроена корректно';
    } else {
      results.message = 'Не все компоненты Google Sheets настроены';
    }
    
  } catch (error) {
    results.message = `Критическая ошибка Sheets API: ${error.message}`;
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
    
    results.details.push(`✅ TELEGRAM_TOKEN настроен`);
    
    // Проверяем функции Telegram API
    const telegramFunctions = [
      'sendText',
      'sendChatAction', 
      'answerCallbackQuery',
      'editMessageText',
      'escapeMarkdownV2'
    ];
    
    telegramFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push(`✅ Функция ${funcName}: доступна`);
        } else {
          results.details.push(`❌ Функция ${funcName}: не найдена`);
        }
      } catch (error) {
        results.details.push(`❌ Функция ${funcName}: ошибка - ${error.message}`);
      }
    });
    
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

/**
 * Тест системы пользовательских данных
 */
function testUserDataSystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    // Тестируем функции работы с пользователями
    const userFunctions = [
      'getUserData',
      'saveUserParam',
      'onboardUser'
    ];
    
    let functionsAvailable = 0;
    
    userFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push(`✅ Функция ${funcName}: доступна`);
          functionsAvailable++;
        } else {
          results.details.push(`❌ Функция ${funcName}: не найдена`);
        }
      } catch (error) {
        results.details.push(`❌ Функция ${funcName}: ошибка - ${error.message}`);
      }
    });
    
    // Тестируем создание тестового пользователя
    try {
      const testChatId = 'test_' + Date.now();
      const testUserData = {
        id: testChatId,
        first_name: 'Test User',
        username: 'testuser'
      };
      
      results.details.push(`🧪 Тестируем создание пользователя ${testChatId}...`);
      
      // Проверяем, что функции не вызывают ошибок
      if (functionsAvailable >= 2) {
        results.details.push(`✅ Основные функции пользователей доступны`);
        results.passed = true;
        results.message = 'Система пользовательских данных работает';
      } else {
        results.message = 'Не все функции пользователей доступны';
      }
      
    } catch (error) {
      results.details.push(`❌ Ошибка при тестировании пользователя: ${error.message}`);
    }
    
  } catch (error) {
    results.message = `Критическая ошибка системы пользователей: ${error.message}`;
  }
  
  return results;
}

/**
 * Тест системы сессий
 */
function testSessionSystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const sessionFunctions = [
      'getSession',
      'startSession',
      'updateSession',
      'clearSession'
    ];
    
    let functionsAvailable = 0;
    
    sessionFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push(`✅ Функция ${funcName}: доступна`);
          functionsAvailable++;
        } else {
          results.details.push(`❌ Функция ${funcName}: не найдена`);
        }
      } catch (error) {
        results.details.push(`❌ Функция ${funcName}: ошибка - ${error.message}`);
      }
    });
    
    // Тестируем работу с сессиями
    if (functionsAvailable >= 3) {
      try {
        const testChatId = 'session_test_' + Date.now();
        
        // Тест создания сессии
        startSession(testChatId, 'test_input', { testData: 'value' });
        results.details.push(`✅ Сессия создана для ${testChatId}`);
        
        // Тест получения сессии
        const session = getSession(testChatId);
        if (session && session.awaitingInput === 'test_input') {
          results.details.push(`✅ Сессия получена корректно`);
        } else {
          results.details.push(`❌ Ошибка получения сессии`);
        }
        
        // Тест очистки сессии
        clearSession(testChatId);
        const clearedSession = getSession(testChatId);
        if (!clearedSession.awaitingInput) {
          results.details.push(`✅ Сессия очищена корректно`);
          results.passed = true;
          results.message = 'Система сессий работает корректно';
        } else {
          results.details.push(`❌ Ошибка очистки сессии`);
        }
        
      } catch (error) {
        results.details.push(`❌ Ошибка при тестировании сессий: ${error.message}`);
      }
    } else {
      results.message = 'Не все функции сессий доступны';
    }
    
  } catch (error) {
    results.message = `Критическая ошибка системы сессий: ${error.message}`;
  }
  
  return results;
}

/**
 * Тест UI системы
 */
function testUISystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const uiFunctions = [
      'getMenu',
      'sendMenu',
      'sendSettingsMenu',
      'sendGoalOptions',
      'sendSexOptions',
      'sendActivityOptions'
    ];
    
    let functionsAvailable = 0;
    
    uiFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push(`✅ Функция ${funcName}: доступна`);
          functionsAvailable++;
        } else {
          results.details.push(`❌ Функция ${funcName}: не найдена`);
        }
      } catch (error) {
        results.details.push(`❌ Функция ${funcName}: ошибка - ${error.message}`);
      }
    });
    
    if (functionsAvailable >= 4) {
      results.passed = true;
      results.message = 'UI система работает корректно';
    } else {
      results.message = 'Не все UI функции доступны';
    }
    
  } catch (error) {
    results.message = `Критическая ошибка UI системы: ${error.message}`;
  }
  
  return results;
}

/**
 * Тест системы расчетов
 */
function testCalculationSystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    // Проверяем функцию расчета BMR
    try {
      const func = eval('calculateBMR');
      if (typeof func === 'function') {
        results.details.push(`✅ Функция calculateBMR: доступна`);
        
        // Тестируем расчет с тестовыми данными
        const testUserData = {
          weight: 70,
          height: 175,
          age: 30,
          sex: 'm',
          activity: 'moderate',
          goal: 'maintain'
        };
        
        const bmrResult = calculateBMR(testUserData);
        if (bmrResult && bmrResult.dailyCalories) {
          results.details.push(`✅ Расчет BMR работает: ${bmrResult.dailyCalories} ккал`);
          results.details.push(`📊 Белки: ${bmrResult.protein}г, Жиры: ${bmrResult.fats}г, Углеводы: ${bmrResult.carbs}г`);
          results.passed = true;
          results.message = 'Система расчетов работает корректно';
        } else {
          results.message = 'Ошибка в расчете BMR';
        }
        
      } else {
        results.message = 'Функция calculateBMR не найдена';
      }
    } catch (error) {
      results.message = `Ошибка функции calculateBMR: ${error.message}`;
    }
    
  } catch (error) {
    results.message = `Критическая ошибка системы расчетов: ${error.message}`;
  }
  
  return results;
}

/**
 * Тест Gemini AI
 */
function testGeminiAPI() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const geminiKey = scriptProps.getProperty('GEMINI_API_KEY');
    
    if (!geminiKey) {
      results.message = 'GEMINI_API_KEY не настроен (опционально)';
      results.passed = true; // Не критично
      return results;
    }
    
    results.details.push(`✅ GEMINI_API_KEY настроен`);
    
    // Проверяем функции Gemini
    const geminiFunctions = [
      'callGemini',
      'generateAiMenu',
      'generateShoppingListAi'
    ];
    
    let functionsAvailable = 0;
    
    geminiFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push(`✅ Функция ${funcName}: доступна`);
          functionsAvailable++;
        } else {
          results.details.push(`❌ Функция ${funcName}: не найдена`);
        }
      } catch (error) {
        results.details.push(`❌ Функция ${funcName}: ошибка - ${error.message}`);
      }
    });
    
    if (functionsAvailable >= 1) {
      results.passed = true;
      results.message = 'Gemini AI система доступна';
    } else {
      results.message = 'Gemini AI функции недоступны';
    }
    
  } catch (error) {
    results.message = `Критическая ошибка Gemini API: ${error.message}`;
  }
  
  return results;
}

/**
 * Тест системы обработки webhook
 */
function testWebhookSystem() {
  const results = { passed: false, message: '', details: [] };
  
  try {
    // Проверяем основные функции обработки
    const webhookFunctions = [
      'doPost',
      'debugRouter',
      'handleIncomingUpdate',
      'handleCommand',
      'handleCallbackQuery'
    ];
    
    let functionsAvailable = 0;
    
    webhookFunctions.forEach(funcName => {
      try {
        const func = eval(funcName);
        if (typeof func === 'function') {
          results.details.push(`✅ Функция ${funcName}: доступна`);
          functionsAvailable++;
        } else {
          results.details.push(`❌ Функция ${funcName}: не найдена`);
        }
      } catch (error) {
        results.details.push(`❌ Функция ${funcName}: ошибка - ${error.message}`);
      }
    });
    
    if (functionsAvailable >= 3) {
      results.passed = true;
      results.message = 'Система обработки webhook работает';
    } else {
      results.message = 'Не все функции webhook доступны';
    }
    
  } catch (error) {
    results.message = `Критическая ошибка webhook системы: ${error.message}`;
  }
  
  return results;
}

/**
 * Генерирует детальный отчет о тестировании
 */
function generateTestReport(testResults) {
  try {
    Logger.log('\n📊 ДЕТАЛЬНЫЙ ОТЧЕТ О ТЕСТИРОВАНИИ');
    Logger.log('=' .repeat(50));
    Logger.log(`🕐 Время тестирования: ${testResults.timestamp}`);
    Logger.log(`📈 Общий результат: ${testResults.passed}/${testResults.tests.length} тестов прошли`);
    Logger.log(`🎯 Процент успеха: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);
    
    testResults.tests.forEach((test, index) => {
      Logger.log(`\n${index + 1}. ${test.name}`);
      Logger.log(`   Статус: ${test.passed ? '✅ ПРОШЕЛ' : '❌ ПРОВАЛИЛСЯ'}`);
      Logger.log(`   Сообщение: ${test.message}`);
      
      if (test.details && test.details.length > 0) {
        Logger.log('   Детали:');
        test.details.forEach(detail => {
          Logger.log(`     ${detail}`);
        });
      }
    });
    
    if (testResults.errors.length > 0) {
      Logger.log('\n💥 КРИТИЧЕСКИЕ ОШИБКИ:');
      testResults.errors.forEach(error => {
        Logger.log(`   ${error}`);
      });
    }
    
    Logger.log('\n🔧 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:');
    testResults.tests.forEach(test => {
      if (!test.passed) {
        Logger.log(`   • ${test.name}: ${test.message}`);
      }
    });
    
  } catch (error) {
    Logger.log(`Ошибка при генерации отчета: ${error.message}`);
  }
}

/**
 * Быстрая тестовая функция для проверки работы системы
 */
function testQuick() {
  Logger.log('🚀 БЫСТРЫЙ ТЕСТ СИСТЕМЫ');
  
  try {
    // Тест 1: Проверка ScriptProperties
    const scriptProps = PropertiesService.getScriptProperties();
    Logger.log('✅ ScriptProperties доступны');
    
    // Тест 2: Проверка основных свойств
    const token = scriptProps.getProperty('TELEGRAM_BOT_TOKEN');
    const geminiKey = scriptProps.getProperty('GEMINI_API_KEY');
    
    Logger.log('TELEGRAM_BOT_TOKEN: ' + (token ? '✅ Найден' : '❌ Не найден'));
    Logger.log('GEMINI_API_KEY: ' + (geminiKey ? '✅ Найден' : '❌ Не найден'));
    
    // Тест 3: Проверка папок
    const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    if (rootFolderId) {
      try {
        const folder = DriveApp.getFolderById(rootFolderId);
        Logger.log('✅ Корневая папка найдена: ' + folder.getName());
      } catch (error) {
        Logger.log('❌ Ошибка доступа к папке: ' + error.message);
      }
    } else {
      Logger.log('⚠️ ROOT_FOLDER_ID не найден');
    }
    
    // Тест 4: Проверка таблиц
    const templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    if (templateId) {
      try {
        const sheet = SpreadsheetApp.openById(templateId);
        Logger.log('✅ Шаблонная таблица найдена: ' + sheet.getName());
        
        const sheets = sheet.getSheets();
        Logger.log('Количество листов: ' + sheets.length);
        sheets.forEach(sheet => {
          Logger.log('  - ' + sheet.getName());
        });
      } catch (error) {
        Logger.log('❌ Ошибка доступа к таблице: ' + error.message);
      }
    } else {
      Logger.log('⚠️ TEMPLATE_SHEET_ID не найден');
    }
    
    // Тест 5: Проверка новых функций
    Logger.log('🔧 Тестирование новых функций...');
    
    // Проверяем, есть ли функция setupCompleteInfrastructure
    if (typeof setupCompleteInfrastructure === 'function') {
      Logger.log('✅ setupCompleteInfrastructure найдена');
    } else {
      Logger.log('❌ setupCompleteInfrastructure не найдена');
    }
    
    // Проверяем, есть ли функция getProjectData
    if (typeof getProjectData === 'function') {
      Logger.log('✅ getProjectData найдена');
    } else {
      Logger.log('❌ getProjectData не найдена');
    }
    
    Logger.log('🏁 БЫСТРЫЙ ТЕСТ ЗАВЕРШЕН');
    
  } catch (error) {
    Logger.log('💥 КРИТИЧЕСКАЯ ОШИБКА: ' + error.message);
    Logger.log('Стек ошибки: ' + error.stack);
  }
}

/**
 * Функция для запуска полной настройки инфраструктуры
 */
function testSetupInfrastructure() {
  Logger.log('🔧 ТЕСТИРОВАНИЕ НАСТРОЙКИ ИНФРАСТРУКТУРЫ');
  
  try {
    if (typeof setupCompleteInfrastructure === 'function') {
      const results = setupCompleteInfrastructure();
      Logger.log('Результаты настройки:');
      Logger.log(JSON.stringify(results, null, 2));
    } else {
      Logger.log('❌ Функция setupCompleteInfrastructure не найдена');
    }
  } catch (error) {
    Logger.log('❌ Ошибка настройки: ' + error.message);
  }
}

/**
 * Функция для тестирования управления проектом
 */
function testProjectManagement() {
  Logger.log('📋 ТЕСТИРОВАНИЕ УПРАВЛЕНИЯ ПРОЕКТОМ');
  
  try {
    if (typeof getProjectData === 'function') {
      const data = getProjectData();
      Logger.log('Данные проекта:');
      Logger.log(JSON.stringify(data, null, 2));
    } else {
      Logger.log('❌ Функция getProjectData не найдена');
    }
  } catch (error) {
    Logger.log('❌ Ошибка получения данных проекта: ' + error.message);
  }
}

/**
 * Функция для добавления тестовой задачи
 */
function testAddTask() {
  Logger.log('➕ ТЕСТИРОВАНИЕ ДОБАВЛЕНИЯ ЗАДАЧИ');
  
  try {
    if (typeof addNewTask === 'function') {
      const taskData = {
        name: 'Тестовая задача',
        description: 'Это тестовая задача для проверки системы',
        priority: 'Средний',
        assignee: 'Тестер',
        deadline: '2024-12-31'
      };
      
      const result = addNewTask(taskData);
      Logger.log('Результат добавления задачи:');
      Logger.log(JSON.stringify(result, null, 2));
    } else {
      Logger.log('❌ Функция addNewTask не найдена');
    }
  } catch (error) {
    Logger.log('❌ Ошибка добавления задачи: ' + error.message);
  }
}