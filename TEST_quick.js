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