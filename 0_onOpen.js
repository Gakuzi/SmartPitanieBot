/**
 * @file 0_onOpen.js
 * @description Функции, которые выполняются при открытии Google Sheets.
 */

/**
 * Функция, которая выполняется при открытии таблицы.
 * Добавляет пользовательское меню в интерфейс Google Sheets.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SmartPitanie Bot')
    .addItem('Панель администратора', 'showAdminPanel')
    .addItem('Настройки Webhook', 'showWebhookDialog')
    .addToUi();
}