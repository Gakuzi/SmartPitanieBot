/**
 * ФУНКЦИЯ onOpen()
 * 
 * Эта функция автоматически вызывается при открытии Google Таблицы.
 * Она создает пользовательское меню для удобного вызова тестовых функций.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Тест бота')
      .addItem('Отправить Тест 1', 'sendTestMessage1')
      .addItem('Отправить Тест 2', 'sendTestMessage2')
      .addItem('Отправить Тест 3', 'sendTestMessage3')
      .addToUi();
}

// Функции-обертки для вызова sendTestMessage с предопределенным текстом
function sendTestMessage1() {
  sendTestMessage('Тестовое сообщение 1');
}

function sendTestMessage2() {
  sendTestMessage('Тестовое сообщение 2');
}

function sendTestMessage3() {
  sendTestMessage('Тестовое сообщение 3');
}
