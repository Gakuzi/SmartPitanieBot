function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Empty or invalid request from Telegram.');
      return;
    }
    const data = JSON.parse(e.postData.contents);
    
    debugRouter(data);

  } catch (err) {
    Logger.log('CRITICAL ERROR in doPost: ' + err.message);
  }
}
