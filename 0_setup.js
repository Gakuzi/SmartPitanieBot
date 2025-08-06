/**
 * ОДНОРАЗОВАЯ ФУНКЦИЯ НАСТРОЙКИ ПРОЕКТА
 */
function setupProjectInfrastructure() {
  const scriptProps = PropertiesService.getScriptProperties();
  const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');

  if (rootFolderId && DriveApp.getFolderById(rootFolderId)) {
    Logger.log('Инфраструктура уже настроена. ID корневой папки: ' + rootFolderId);
    Logger.log('ID шаблонной таблицы: ' + scriptProps.getProperty('TEMPLATE_SHEET_ID'));
    return;
  }

  try {
    // 1. Создаем корневую папку
    const rootFolder = DriveApp.createFolder('SmartPit_Users');
    const folderId = rootFolder.getId();
    scriptProps.setProperty('ROOT_FOLDER_ID', folderId);
    Logger.log('Корневая папка SmartPit_Users успешно создана. ID: ' + folderId);

    // 2. Создаем шаблонную таблицу
    const templateSheet = SpreadsheetApp.create('Template_SmartPit_Sheet');
    const sheetId = templateSheet.getId();
    scriptProps.setProperty('TEMPLATE_SHEET_ID', sheetId);
    
    // Перемещаем шаблон в корневую папку
    const templateFile = DriveApp.getFileById(sheetId);
    templateFile.moveTo(rootFolder);
    Logger.log('Шаблонная таблица Template_SmartPit_Sheet успешно создана. ID: ' + sheetId);

    // 3. Создаем необходимые листы в шаблоне
    const sheetNames = ['Меню по дням', 'Список покупок', 'Готовка', 'Замены', 'Настройки', 'Логи', 'Продукты', 'Тест отправки'];
    const defaultSheet = templateSheet.getSheets()[0];
    templateSheet.renameActiveSheet(sheetNames[0]);

    for (let i = 1; i < sheetNames.length; i++) {
      templateSheet.insertSheet(sheetNames[i]);
    }
    Logger.log('В шаблон добавлены листы: ' + sheetNames.join(', '));

    // 4. Добавляем заголовки в лист Продукты
    const productsSheet = templateSheet.getSheetByName('Продукты');
    productsSheet.getRange('A1:F1').setValues([['Тип', 'Блюдо', 'Калории', 'Белки', 'Жиры', 'Углеводы']]);
    Logger.log('В лист Продукты добавлены заголовки.');

    // 5. Добавляем заголовки в лист Тест отправки
    const testSheet = templateSheet.getSheetByName('Тест отправки');
    testSheet.getRange('A1:B1').setValues([['Сообщение', 'Действие']]);
    Logger.log('В лист Тест отправки добавлены заголовки.');

    Logger.log('НАСТРОЙКА УСПЕШНО ЗАВЕРШЕНА');

  } catch (e) {
    Logger.log('ПРОИЗОШЛА ОШИБКА: ' + e.message);
    Logger.log('Стек ошибки: ' + e.stack);
  }
}

function setGeminiApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    Logger.log('Ошибка: Ключ Gemini API не может быть пустым.');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
  Logger.log('Ключ Gemini API успешно сохранен в ScriptProperties.');
}
