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
  ui.createMenu('SmartPit Console')
    .addItem('Открыть консоль управления', 'showAdminPanel')
    .addItem('Открыть менеджер проекта', 'openProjectManagerWeb')
    .addItem('Открыть ТЗ (idea)', 'openIdeaDoc')
    .addItem('Настройки Webhook', 'showWebhookDialog')
    .addSeparator()
    .addItem('Диагностика системы', 'runQuickDiagnostics')
    .addItem('Восстановить структуру', 'restoreTableStructure')
    .addToUi();
}