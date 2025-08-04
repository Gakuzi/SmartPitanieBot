// Этот файл оставлен пустым, так как весь код был реорганизован в модули.
// См. файлы с префиксами 1_, 2_, 3_ и т.д.

function testTelegramApiLib() {
  try {
    const botInfo = TelegramApiLib.getMe();
    Logger.log("Информация о боте: " + JSON.stringify(botInfo));
  } catch (e) {
    Logger.log("Ошибка при тестировании TelegramApiLib: " + e.message);
  }
}