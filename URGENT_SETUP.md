# СРОЧНАЯ НАСТРОЙКА ПУБЛИЧНОГО ДЕПЛОЯ

## Проблема
URL https://script.google.com/macros/s/AKfycby-lKYHoMOFvakftHd3kyi1atmbF_s8lfMPXdbbvI87zlndYYx7TOrxoZs__7k8MXVW1Q/exec требует авторизации Google.

## Решение

### 1. Откройте проект в браузере:
```
https://script.google.com/d/13jwxQFwGaK_nS23fWMtP8XH6oxfZHqE4VbTx6O8gulZKo4ojC_J8y6A6/edit
```

### 2. Настройте публичный деплой:
1. В Apps Script консоли нажмите **Deploy**
2. Выберите **New deployment**
3. Настройте:
   - **Type**: Web app
   - **Execute as**: Me (ваш аккаунт)
   - **Who has access**: Anyone
   - **Description**: SmartPit v2 Public
4. Нажмите **Deploy**

### 3. Проверьте Script Properties:
1. File → Project settings → Script properties
2. Убедитесь что есть:
   - `TELEGRAM_TOKEN`
   - `ROOT_FOLDER_ID`
   - `GEMINI_API_KEY` (опционально)

### 4. Обновите Google Sheets:
1. Откройте таблицу
2. Обновите страницу (F5)
3. Проверьте меню "SmartPit Console"

### 5. Если меню не появилось:
1. В Apps Script консоли нажмите **Run**
2. Выберите функцию **onOpen**
3. Нажмите **Run**

## Что должно работать после настройки:

### Меню в Google Sheets:
- SmartPit Console
  - Открыть консоль управления
  - Открыть менеджер проекта
  - Открыть ТЗ (idea)
  - Настройки Webhook
  - Диагностика системы
  - Восстановить структуру

### Web App URL:
После настройки получите новый URL вида:
```
https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec?page=test
```

### Тестирование:
- `?page=test` - тестовая страница
- `?page=project-manager` - менеджер проекта
- `?page=idea` - техническое задание
- `?page=admin` - админ панель

## Статус файлов:
✅ Все 40 файлов загружены в Google Apps Script
✅ Меню обновлено в 0_onOpen.js
✅ Функции AdminPanel добавлены в 3_ui_menus.js
✅ doGet маршрутизация настроена в main.js

**Осталось только настроить публичный деплой в браузере!** 