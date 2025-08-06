/**
 * Диагностика и исправление системы создания листов
 */
function diagnoseAndRepairSheetsSystem() {
  Logger.log('ДИАГНОСТИКА И ИСПРАВЛЕНИЕ СИСТЕМЫ ЛИСТОВ');
  
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
    const scriptProps = PropertiesService.getScriptProperties();
    
    let rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    if (!rootFolderId) {
      const rootFolder = DriveApp.createFolder('SmartPit_Users_' + Date.now());
      rootFolderId = rootFolder.getId();
      scriptProps.setProperty('ROOT_FOLDER_ID', rootFolderId);
      repairResults.repaired.push('Создана корневая папка: ' + rootFolderId);
    }
    
    let templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    if (!templateId) {
      const templateSheet = SpreadsheetApp.create('Template_SmartPit_Sheet_' + Date.now());
      templateId = templateSheet.getId();
      scriptProps.setProperty('TEMPLATE_SHEET_ID', templateId);
      
      // Создаем необходимые листы
      const requiredSheets = ['Меню по дням', 'Список покупок', 'Готовка', 'Замены', 'Настройки', 'Логи', 'Продукты'];
      const defaultSheet = templateSheet.getSheets()[0];
      templateSheet.renameActiveSheet(requiredSheets[0]);

      for (let i = 1; i < requiredSheets.length; i++) {
        templateSheet.insertSheet(requiredSheets[i]);
      }
      
      // Настраиваем лист Продукты
      const productsSheet = templateSheet.getSheetByName('Продукты');
      productsSheet.getRange('A1:F1').setValues([['Тип', 'Блюдо', 'Калории', 'Белки', 'Жиры', 'Углеводы']]);
      
      repairResults.repaired.push('Создана шаблонная таблица: ' + templateId);
    }
    
    let usersSpreadsheetId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    if (!usersSpreadsheetId) {
      const usersSpreadsheet = SpreadsheetApp.create('SmartPit_Users_' + Date.now());
      usersSpreadsheetId = usersSpreadsheet.getId();
      scriptProps.setProperty('USERS_SPREADSHEET_ID', usersSpreadsheetId);
      
      const usersSheet = usersSpreadsheet.getActiveSheet();
      usersSheet.setName('Пользователи');
      usersSheet.getRange('A1:L1').setValues([[
        'ID', 'Bot', 'Имя', 'Фамилия', 'Username', 'Язык', 'Premium', 
        'Дата регистрации', 'Папка', 'Таблица', 'Категория', 'Админ'
      ]]);
      
      repairResults.repaired.push('Создана таблица пользователей: ' + usersSpreadsheetId);
    }

    // Шаг 2: Тестируем создание пользователя
    repairResults.steps.push('Тестирование создания пользователя...');
    const testChatId = 'test_' + Date.now();
    const testUser = { id: testChatId, first_name: 'Test User' };
    
    try {
      onboardUser(testChatId, testUser);
      repairResults.repaired.push('Тест создания пользователя прошел успешно');
      
      // Очищаем тестовые данные
      const testFolderId = scriptProps.getProperty(String(testChatId));
      if (testFolderId) {
        DriveApp.getFolderById(testFolderId).setTrashed(true);
        scriptProps.deleteProperty(String(testChatId));
      }
    } catch (error) {
      repairResults.errors.push('Ошибка создания пользователя: ' + error.message);
    }

    repairResults.success = repairResults.errors.length === 0;
    Logger.log('ДИАГНОСТИКА ЗАВЕРШЕНА');

  } catch (error) {
    repairResults.errors.push('Критическая ошибка: ' + error.message);
    Logger.log('КРИТИЧЕСКАЯ ОШИБКА: ' + error.message);
  }

  return repairResults;
}

/**
 * Функция для создания инфраструктуры проекта (улучшенная версия)
 */
function setupProjectInfrastructureImproved() {
  Logger.log('СОЗДАНИЕ УЛУЧШЕННОЙ ИНФРАСТРУКТУРЫ ПРОЕКТА');
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    
    // Создаем корневую папку если её нет
    let rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');
    if (!rootFolderId) {
      const rootFolder = DriveApp.createFolder('SmartPit_Users');
      rootFolderId = rootFolder.getId();
      scriptProps.setProperty('ROOT_FOLDER_ID', rootFolderId);
      Logger.log('Корневая папка создана: ' + rootFolderId);
    }

    // Создаем шаблонную таблицу если её нет
    let templateId = scriptProps.getProperty('TEMPLATE_SHEET_ID');
    if (!templateId) {
      const templateSheet = SpreadsheetApp.create('Template_SmartPit_Sheet');
      templateId = templateSheet.getId();
      scriptProps.setProperty('TEMPLATE_SHEET_ID', templateId);
      
      // Перемещаем в корневую папку
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      const templateFile = DriveApp.getFileById(templateId);
      templateFile.moveTo(rootFolder);
      
      // Создаем необходимые листы
      const sheetNames = ['Меню по дням', 'Список покупок', 'Готовка', 'Замены', 'Настройки', 'Логи', 'Продукты', 'Тест отправки'];
      const defaultSheet = templateSheet.getSheets()[0];
      templateSheet.renameActiveSheet(sheetNames[0]);

      for (let i = 1; i < sheetNames.length; i++) {
        templateSheet.insertSheet(sheetNames[i]);
      }
      
      // Настраиваем листы
      const productsSheet = templateSheet.getSheetByName('Продукты');
      productsSheet.getRange('A1:F1').setValues([['Тип', 'Блюдо', 'Калории', 'Белки', 'Жиры', 'Углеводы']]);
      
      const testSheet = templateSheet.getSheetByName('Тест отправки');
      testSheet.getRange('A1:B1').setValues([['Сообщение', 'Действие']]);
      
      Logger.log('Шаблонная таблица создана: ' + templateId);
    }

    // Создаем таблицу пользователей если её нет
    let usersSpreadsheetId = scriptProps.getProperty('USERS_SPREADSHEET_ID');
    if (!usersSpreadsheetId) {
      const usersSpreadsheet = SpreadsheetApp.create('SmartPit_Users');
      usersSpreadsheetId = usersSpreadsheet.getId();
      scriptProps.setProperty('USERS_SPREADSHEET_ID', usersSpreadsheetId);
      
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
      
      Logger.log('Таблица пользователей создана: ' + usersSpreadsheetId);
    }

    Logger.log('ИНФРАСТРУКТУРА СОЗДАНА УСПЕШНО');
    return 'Инфраструктура создана успешно!';

  } catch (error) {
    Logger.log('ОШИБКА: ' + error.message);
    throw error;
  }
}
