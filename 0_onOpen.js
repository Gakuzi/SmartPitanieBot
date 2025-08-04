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
  const ui = SpreadsheetApp.getUi();
  const webAppUrl = ScriptApp.getService().getUrl(); // Получаем URL текущего веб-приложения

  let response;
  let webhookInfo;

  // Шаг 1: Получаем текущий статус вебхука
  try {
    webhookInfo = getTelegramWebhookInfo();
    if (!webhookInfo.ok) {
      ui.alert('Ошибка', `Не удалось получить информацию о вебхуке: ${webhookInfo.description || 'Неизвестная ошибка'}`, ui.ButtonSet.OK);
      return;
    }
  } catch (e) {
    ui.alert('Ошибка', `Произошла ошибка при запросе информации о вебхуке: ${e.message}`, ui.ButtonSet.OK);
    return;
  }

  let statusMessage = `Текущий статус вебхука:\n`;
  if (webhookInfo.result.url) {
    statusMessage += `URL: ${webhookInfo.result.url}\n`;
    statusMessage += `Последняя ошибка: ${webhookInfo.result.last_error_message || 'Нет'}\n`;
    statusMessage += `Ожидающие обновления: ${webhookInfo.result.pending_update_count}\n`;
    statusMessage += `Сертификат: ${webhookInfo.result.has_custom_certificate ? 'Есть' : 'Нет'}\n`;
    statusMessage += `Макс. соединения: ${webhookInfo.result.max_connections || 'Не указано'}\n`;
    statusMessage += `Разрешенные обновления: ${webhookInfo.result.allowed_updates ? webhookInfo.result.allowed_updates.join(', ') : 'Все'}\n`;
  } else {
    statusMessage += `Вебхук не установлен.\n`;
  }

  let actionPrompt;
  let buttonSet;
  let setWebhookAction = false; // Флаг, указывающий, является ли основное действие установкой вебхука

  if (webhookInfo.result.url) {
    actionPrompt = `${statusMessage}\n\nВебхук установлен. Что вы хотите сделать?`;
    buttonSet = ui.ButtonSet.YES_NO_CANCEL; // YES: Обновить, NO: Удалить
  } else {
    actionPrompt = `${statusMessage}\n\nВебхук не установлен. Хотите установить его?`;
    buttonSet = ui.ButtonSet.OK_CANCEL; // OK: Установить
    setWebhookAction = true;
  }

  response = ui.alert(
    'Управление вебхуком Telegram',
    actionPrompt,
    buttonSet
  );

  if (setWebhookAction) {
    if (response == ui.Button.OK) { // Пользователь хочет УСТАНОВИТЬ вебхук
      try {
        const result = setTelegramWebhook(webAppUrl);
        if (result.ok) {
          ui.alert('Успех', `Вебхук успешно установлен на ${webAppUrl}`, ui.ButtonSet.OK);
        } else {
          ui.alert('Ошибка', `Не удалось установить вебхук: ${result.description || 'Неизвестная ошибка'}`, ui.ButtonSet.OK);
        }
      } catch (e) {
        ui.alert('Ошибка', `Произошла ошибка при установке вебхука: ${e.message}`, ui.ButtonSet.OK);
      }
    } else { // Пользователь отменил
      ui.alert('Отмена', 'Установка вебхука отменена.', ui.ButtonSet.OK);
    }
  } else { // Вебхук уже установлен, пользователь выбрал Обновить или Удалить
    if (response == ui.Button.YES) { // Пользователь хочет ОБНОВИТЬ вебхук
      const setResponse = ui.alert(
        'Обновление вебхука',
        `Текущий URL веб-приложения: ${webAppUrl}\n\nВы уверены, что хотите обновить вебхук на этот URL?`,
        ui.ButtonSet.OK_CANCEL
      );
      if (setResponse == ui.Button.OK) {
        try {
          const result = setTelegramWebhook(webAppUrl);
          if (result.ok) {
            ui.alert('Успех', `Вебхук успешно обновлен на ${webAppUrl}`, ui.ButtonSet.OK);
          } else {
            ui.alert('Ошибка', `Не удалось обновить вебхук: ${result.description || 'Неизвестная ошибка'}`, ui.ButtonSet.OK);
          }
        } catch (e) {
          ui.alert('Ошибка', `Произошла ошибка при обновлении вебхука: ${e.message}`, ui.ButtonSet.OK);
        }
      } else {
        ui.alert('Отмена', 'Обновление вебхука отменено.', ui.ButtonSet.OK);
      }
    } else if (response == ui.Button.NO) { // Пользователь хочет УДАЛИТЬ вебхук
      const deleteResponse = ui.alert(
        'Удаление вебхука',
        'Вы уверены, что хотите удалить текущий вебхук?',
        ui.ButtonSet.OK_CANCEL
      );
      if (deleteResponse == ui.Button.OK) {
        try {
          const result = deleteTelegramWebhook();
          if (result.ok) {
            ui.alert('Успех', 'Вебхук успешно удален.', ui.ButtonSet.OK);
          } else {
            ui.alert('Ошибка', `Не удалось удалить вебхук: ${result.description || 'Неизвестная ошибка'}`, ui.ButtonSet.OK);
          }
        } catch (e) {
          ui.alert('Ошибка', `Произошла ошибка при удалении вебхука: ${e.message}`, ui.ButtonSet.OK);
        }
      } else {
        ui.alert('Отмена', 'Удаление вебхука отменено.', ui.ButtonSet.OK);
      }
    } else { // Отмена
      ui.alert('Отмена', 'Операция управления вебхуком отменена.', ui.ButtonSet.OK);
    }
  }
}
