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

