var Modules = typeof Modules !== 'undefined' ? Modules : {};
Modules.Telegram = Modules.Telegram || {};

Modules.Telegram.api = {
  send: sendText,
  action: sendChatAction,
  edit: editMessageText
};

