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
  const apiMenu = ui.createMenu('Настройки API')
      .addItem('Установить Gemini API Key', 'promptAndSetGeminiApiKey');
  
  // Добавляем подменю "Управление вебхуком"
  apiMenu.addSeparator()
         .addItem('Управление вебхуком', 'manageWebhook')
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
 * Если ключ уже установлен, предлагает его изменить.
 */
function promptAndSetGeminiApiKey() {
  const ui = SpreadsheetApp.getUi();
  const scriptProps = PropertiesService.getScriptProperties();
  const currentApiKey = scriptProps.getProperty('GEMINI_API_KEY');

  let promptTitle;
  let promptMessage;

  if (currentApiKey) {
    promptTitle = 'Изменить Gemini API Key';
    promptMessage = 'Ключ Gemini API уже установлен. Введите новый ключ или оставьте пустым для отмены:';
  } else {
    promptTitle = 'Добавить Gemini API Key';
    promptMessage = 'Пожалуйста, введите ваш Gemini API Key:';
  }

  const result = ui.prompt(
      promptTitle,
      promptMessage,
      ui.ButtonSet.OK_CANCEL);

  // Проверяем ответ пользователя
  if (result.getSelectedButton() == ui.Button.OK) {
    const apiKey = result.getResponseText();
    if (apiKey.trim() !== '') {
      // Вызываем функцию из 0_setup.js для сохранения ключа
      setGeminiApiKey(apiKey);
    } else {
      ui.alert('Ключ не был изменен, так как поле было пустым.');
    }
  } else {
    ui.alert('Установка/изменение ключа отменено.');
  }
}

/**
 * Пошаговый мастер для управления вебхуком Telegram.
 */
function manageWebhook() {
  showWebhookManagerDialog();
}
