/**
 * @file 0_onOpen.js
 * @description Функции, которые выполняются при открытии Google Sheets.
 * UPDATED: 2024-01-08T02:30:00.000Z - MENU CLEANUP
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
    .addItem('Открыть ТЗ', 'openIdeaDoc')
    .addSeparator()
    .addItem('🤖 Настройки AI', 'showAiSettingsDialog')
    .addItem('Настройки Webhook', 'showWebhookDialog')
    .addSeparator()
    .addItem('Диагностика системы', 'runQuickDiagnostics')
    .addItem('Восстановить структуру', 'restoreTableStructure')
    .addToUi();
}