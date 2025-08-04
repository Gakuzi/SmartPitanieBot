/**
 * ФУНКЦИЯ onOpen()
 * 
 * Эта функция автоматически вызывается при открытии Google Таблицы.
 * Она создает пользовательское меню для удобного вызова тестовых функций и настроек API.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // Меню "Тест бота"
  ui.createMenu('Тест бота')
      .addItem('Отправить Тест 1', 'sendTestMessage1')
      .addItem('Отправить Тест 2', 'sendTestMessage2')
      .addItem('Отправить Тест 3', 'sendTestMessage3')
      .addToUi();

  // Новое меню "Настройки API"
  ui.createMenu('Настройки API')
      .addItem('Установить Gemini API Key', 'promptAndSetGeminiApiKey')
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

/**
 * Запрашивает у пользователя ключ Gemini API и сохраняет его.
 */
function promptAndSetGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
      'Установка Gemini API Key',
      'Пожалуйста, введите ваш Gemini API Key:',
      ui.ButtonSet.OK_CANCEL);

  // Проверяем ответ пользователя
  if (result.getSelectedButton() == ui.Button.OK) {
    const apiKey = result.getResponseText();
    // Вызываем функцию из 0_setup.js для сохранения ключа
    setGeminiApiKey(apiKey); 
  } else {
    ui.alert('Установка ключа отменена.');
  }
}
