/**
 * ОДНОРАЗОВАЯ ФУНКЦИЯ НАСТРОЙКИ ПРОЕКТА
 * 
 * Что делает:
 * 1. Создает корневую папку "SmartPit_Users" в Google Drive для хранения данных всех пользователей.
 * 2. Создает эталонную Google-таблицу "Template_SmartPit_Sheet" со всеми необходимыми листами.
 * 3. Сохраняет ID созданной папки и таблицы в свойства проекта (ScriptProperties) для дальнейшего использования.
 * 
 * Как запустить:
 * 1. Откройте редактор Google Apps Script.
 * 2. Вверху выберите эту функцию (setupProjectInfrastructure) в выпадающем списке.
 * 3. Нажмите кнопку "▶️ Запустить".
 * 4. Предоставьте необходимые разрешения для доступа к Google Drive и Таблицам, если потребуется.
 * 5. Проверьте логи (Ctrl+Enter или Cmd+Enter), чтобы убедиться, что все создано успешно.
 */
function setupProjectInfrastructure() {
  const scriptProps = PropertiesService.getScriptProperties();
  const rootFolderId = scriptProps.getProperty('ROOT_FOLDER_ID');

  if (rootFolderId && DriveApp.getFolderById(rootFolderId)) {
    Logger.log(`Инфраструктура уже настроена. ID корневой папки: ${rootFolderId}`);
    Logger.log(`ID шаблонной таблицы: ${scriptProps.getProperty('TEMPLATE_SHEET_ID')}`);
    return;
  }

  try {
    // 1. Создаем корневую папку
    const rootFolder = DriveApp.createFolder('SmartPit_Users');
    const folderId = rootFolder.getId();
    scriptProps.setProperty('ROOT_FOLDER_ID', folderId);
    Logger.log(`✅ Корневая папка "SmartPit_Users" успешно создана. ID: ${folderId}`);

    // 2. Создаем шаблонную таблицу
    const templateSheet = SpreadsheetApp.create('Template_SmartPit_Sheet');
    const sheetId = templateSheet.getId();
    scriptProps.setProperty('TEMPLATE_SHEET_ID', sheetId);
    
    // Перемещаем шаблон в корневую папку, чтобы все было в одном месте
    const templateFile = DriveApp.getFileById(sheetId);
    templateFile.moveTo(rootFolder);
    Logger.log(`✅ Шаблонная таблица "Template_SmartPit_Sheet" успешно создана. ID: ${sheetId}`);

    // 3. Создаем необходимые листы в шаблоне
    const sheetNames = ['Меню по дням', 'Список покупок', 'Готовка', 'Замены', 'Настройки', 'Логи', 'Продукты', 'Тест отправки'];
    const defaultSheet = templateSheet.getSheets()[0];
    templateSheet.renameActiveSheet(sheetNames[0]);

    for (let i = 1; i < sheetNames.length; i++) {
      templateSheet.insertSheet(sheetNames[i]);
    }
    Logger.log(`✅ В шаблон добавлены листы: ${sheetNames.join(', ')}`);

    // 4. Добавляем заголовки в лист Продукты
    const productsSheet = templateSheet.getSheetByName('Продукты');
    productsSheet.getRange('A1:F1').setValues([['Тип', 'Блюдо', 'Калории', 'Белки', 'Жиры', 'Углеводы']]);
    Logger.log(`✅ В лист "Продукты" добавлены заголовки.`);

    // 5. Добавляем заголовки и кнопки в лист Тест отправки
    const testSheet = templateSheet.getSheetByName('Тест отправки');
    testSheet.getRange('A1:B1').setValues([['Сообщение', 'Действие']]);
    testSheet.getRange('A2').setValue('Тестовое сообщение 1');
    testSheet.getRange('A3').setValue('Тестовое сообщение 2');
    testSheet.getRange('A4').setValue('Тестовое сообщение 3');

    // Добавляем кнопки
    const range1 = testSheet.getRange('B2');
    testSheet.insertImage('https://i.imgur.com/f2g3L0L.png', 2, 2); // Пример кнопки
    testSheet.getRange('B2').setFormula('=HYPERLINK("javascript:sendTestMessage(\"Тестовое сообщение 1\")", "Отправить")');

    const range2 = testSheet.getRange('B3');
    testSheet.insertImage('https://i.imgur.com/f2g3L0L.png', 2, 3); // Пример кнопки
    testSheet.getRange('B3').setFormula('=HYPERLINK("javascript:sendTestMessage(\"Тестовое сообщение 2\")", "Отправить")');

    const range3 = testSheet.getRange('B4');
    testSheet.insertImage('https://i.imgur.com/f2g3L0L.png', 2, 4); // Пример кнопки
    testSheet.getRange('B4').setFormula('=HYPERLINK("javascript:sendTestMessage(\"Тестовое сообщение 3\")", "Отправить")');

    Logger.log(`✅ В лист "Тест отправки" добавлены заголовки и кнопки.`);

    Logger.log("🎉 --- НАСТРОЙКА УСПЕШНО ЗАВЕРШЕНА ---");

  } catch (e) {
    Logger.log(`❌ ПРОИЗОШЛА ОШИБКА: ${e.message}`);
    Logger.log(`Стек ошибки: ${e.stack}`);
    Logger.log("Возможно, вам нужно вручную удалить созданные ранее папку 'SmartPit_Users' или файл 'Template_SmartPit_Sheet' из вашего Google Drive и запустить функцию снова.");
  }
}
