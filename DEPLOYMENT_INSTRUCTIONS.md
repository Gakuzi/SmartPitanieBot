# Инструкции по настройке деплоя SmartPit v2

## Проблема
Все деплои возвращают редирект на авторизацию Google. Нужно настроить публичный доступ вручную.

## Решение

### 1. Откройте проект в Google Apps Script
```
https://script.google.com/d/13jwxQFwGaK_nS23fWMtP8XH6oxfZHqE4VbTx6O8gulZKo4ojC_J8y6A6/edit
```

### 2. Настройте Web App деплой
1. В Apps Script консоли: **Deploy → New deployment**
2. **Type**: Web app
3. **Execute as**: Me (ваш аккаунт)
4. **Who has access**: Anyone
5. **Description**: SmartPit v2 Web App
6. Нажмите **Deploy**

### 3. Настройте API Executable деплой
1. **Deploy → New deployment**
2. **Type**: API Executable  
3. **Execute as**: Me
4. **Who has access**: Anyone
5. **Description**: SmartPit v2 API
6. Нажмите **Deploy**

### 4. Проверьте Script Properties
Убедитесь что настроены:
- `TELEGRAM_TOKEN` - токен вашего бота
- `ROOT_FOLDER_ID` - ID папки Google Drive
- `GEMINI_API_KEY` - ключ Gemini (опционально)

### 5. Тестирование
После настройки протестируйте:

**Web App URL** (замените на ваш):
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=test
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=project-manager
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?page=idea
```

**API Executable** (для clasp run):
```bash
npx @google/clasp run test
npx @google/clasp run testSystemHealth
```

### 6. Настройка Telegram Webhook
После получения Web App URL:
```bash
curl "https://api.telegram.org/botYOUR_TOKEN/setWebhook?url=YOUR_WEBAPP_URL"
```

## Текущий статус
✅ Код загружен в Google Apps Script  
✅ Меню в таблице обновлено  
✅ Функции AdminPanel добавлены  
✅ Размеры окон исправлены  
❌ Публичный деплой не настроен (требует ручной настройки)

## Что работает после настройки деплоя
- Менеджер проекта: `?page=project-manager`
- Техническое задание: `?page=idea`  
- Админ панель: `?page=admin`
- Диагностика: `?page=test`
- Меню в Google Sheets: SmartPit Console
- Функции AdminPanel: testTelegramAPI, testGeminiAPI, setTelegramWebhook 