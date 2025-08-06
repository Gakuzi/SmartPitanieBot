# Быстрый старт SmartPit

## 🚀 Быстрая настройка синхронизации

### 1. GitHub (5 минут)
```bash
# Создайте репозиторий на GitHub: https://github.com/new
# Название: smartpit
# Описание: Умный ассистент для питания и финансов

# Подключите локальный репозиторий (замените YOUR_USERNAME)
git remote set-url origin https://github.com/YOUR_USERNAME/smartpit.git
git push -u origin master
```

### 2. Google Apps Script (5 минут)
```bash
# Установите Clasp (если еще не установлен)
npm install -g @google/clasp

# Авторизуйтесь
clasp login

# Создайте проект в Google Apps Script
# Скопируйте Script ID из URL
# Обновите .clasp.json с вашим Script ID
```

### 3. Настройка конфигурации (5 минут)
```javascript
// В config.js замените на ваши данные:
const CONFIG = {
  TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN',      // От @BotFather
  SPREADSHEET_ID: 'YOUR_SHEET_ID',          // Из URL таблицы
  GEMINI_API_KEY: 'YOUR_GEMINI_KEY',        // Из Google AI Studio
  WEBHOOK_URL: 'YOUR_WEBHOOK_URL'           // После деплоя
};
```

### 4. Синхронизация (1 минута)
```bash
# Отправьте код в Google Apps Script
npm run push

# Проверьте статус
npm run status
```

## 📋 Полезные команды

```bash
# Проверка статуса
npm run status

# Отправка изменений в Google
npm run push

# Загрузка изменений из Google
npm run pull

# Открытие проекта в браузере
npm run open

# Просмотр логов
npm run logs
```

## 🔧 Устранение проблем

### Clasp не установлен
```bash
npm install -g @google/clasp
```

### Clasp не авторизован
```bash
clasp login
```

### Ошибка доступа к Google Sheets
1. Проверьте права доступа к таблице
2. Убедитесь, что ID таблицы правильный

## 📖 Подробная инструкция

Для полной настройки смотрите `SYNC_SETUP.md`

## 🎯 Следующие шаги

1. Настройте GitHub репозиторий
2. Создайте Google Apps Script проект
3. Получите все необходимые токены
4. Настройте webhook для Telegram бота
5. Протестируйте работу бота

## 📞 Поддержка

При проблемах:
1. Проверьте `npm run status`
2. Посмотрите логи: `npm run logs`
3. Обратитесь к `SYNC_SETUP.md`
4. Создайте Issue в GitHub 