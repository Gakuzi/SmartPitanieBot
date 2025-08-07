// doPost пока не используем - есть в doPost.js

function doGet(e) {
  try {
    var page = e && e.parameter && e.parameter.page;
    
    if (page === 'test') {
      return HtmlService.createHtmlOutput('<h1>✅ TEST SUCCESS!</h1><p>doGet работает правильно</p><p>Время: ' + new Date() + '</p>').setTitle('Тест');
    }
    
    if (page === 'simple') {
      return testDoGet();
    }
    
    if (page === 'project-manager') {
      return HtmlService.createHtmlOutputFromFile('project-manager').setTitle('Менеджер проекта SmartPit');
    }
    if (page === 'idea') {
      return HtmlService.createHtmlOutputFromFile('idea').setTitle('Техническое задание SmartPit');
    }
    if (page === 'admin') {
      return HtmlService.createHtmlOutputFromFile('AdminPanel').setTitle('Центр администрирования SmartPit');
    }
    if (page === 'webhook') {
      return HtmlService.createHtmlOutputFromFile('webhook_manager_dialog').setTitle('Управление вебхуком');
    }
    // По умолчанию — простая тестовая страница
    return HtmlService.createHtmlOutput('<h1>SmartPit v2</h1><p>Добро пожаловать!</p><p>Время: ' + new Date() + '</p><ul><li><a href="?page=project-manager">Менеджер проекта</a></li><li><a href="?page=idea">ТЗ</a></li><li><a href="?page=admin">Админка</a></li><li><a href="?page=test">Тест</a></li></ul>').setTitle('SmartPit');
  } catch (err) {
    return HtmlService.createHtmlOutput('Ошибка загрузки страницы: ' + err.message + '\n\nStack: ' + (err.stack || 'не доступен'));
  }
}

