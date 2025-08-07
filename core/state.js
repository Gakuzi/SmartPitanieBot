var Core = typeof Core !== 'undefined' ? Core : {};

Core.State = (function() {
  function setState(chatId, state) {
    PropertiesService.getUserProperties().setProperty('state_v2_' + chatId, JSON.stringify(state || {}));
  }

  function getState(chatId) {
    var raw = PropertiesService.getUserProperties().getProperty('state_v2_' + chatId);
    try {
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      Logger.log('Core.State get parse error: ' + e.message + ' raw=' + raw);
      return {};
    }
  }

  function clearState(chatId) {
    PropertiesService.getUserProperties().deleteProperty('state_v2_' + chatId);
  }

  return {
    set: setState,
    get: getState,
    clear: clearState
  };
})();

