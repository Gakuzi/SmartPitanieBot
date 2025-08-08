function test() {
  return { success: true, message: 'Test function working!', timestamp: new Date() };
}

function testSystemHealth() {
  try {
    // Проверяем основные компоненты
    var telegramToken = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');
    var rootFolderId = PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER_ID');
    
    return {
      success: true,
      telegram_token: telegramToken ? 'present' : 'missing',
      root_folder_id: rootFolderId ? 'present' : 'missing',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
}

function testTelegramWebhook() {
  try {
    var url = 'https://api.telegram.org/bot' + PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN') + '/getWebhookInfo';
    var response = UrlFetchApp.fetch(url);
    var data = JSON.parse(response.getContentText());
    
    return {
      success: true,
      webhook_data: data.result,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
}

// Простая функция для тестирования doGet
function testDoGet() {
  return HtmlService.createHtmlOutput('<h1>✅ doGet работает!</h1><p>Функция doGet успешно выполняется</p>');
}