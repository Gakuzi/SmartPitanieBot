function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) return;
    var data = JSON.parse(e.postData.contents);
    // Новый роутер (обертка) безопасно делегирует в старую логику при необходимости
    Core.Router.route(data);
  } catch (err) {
    Logger.log('main.doPost error: ' + err.message + '\n' + (err.stack || ''));
  }
}

function doGet(e) {
  try {
    var page = e && e.parameter && e.parameter.page;
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
    // По умолчанию — проектный менеджер
    return HtmlService.createHtmlOutputFromFile('project-manager').setTitle('Менеджер проекта SmartPit');
  } catch (err) {
    return HtmlService.createHtmlOutput('Ошибка загрузки страницы: ' + err.message);
  }
}

