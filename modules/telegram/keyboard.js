var Modules = typeof Modules !== 'undefined' ? Modules : {};
Modules.Telegram = Modules.Telegram || {};

Modules.Telegram.keyboard = {
  main: function() { return getMenu(0); }
};

