# Настройка синхронизации SmartPit

## Шаг 1: Настройка GitHub

### 1.1 Создание репозитория на GitHub
1. Перейдите на [GitHub](https://github.com)
2. Нажмите "New repository"
3. Название: `smartpit`
4. Описание: `Умный ассистент для питания и финансов`
5. Выберите "Public" или "Private"
6. **НЕ** ставьте галочки на "Add a README file" и "Add .gitignore"
7. Нажмите "Create repository"

### 1.2 Подключение локального репозитория к GitHub
```bash
# Замените YOUR_USERNAME на ваше имя пользователя GitHub
git remote set-url origin https://github.com/YOUR_USERNAME/smartpit.git

# Проверьте подключение
git remote -v

# Отправьте код в GitHub
git add .
git commit -m "Initial commit: SmartPit v2 project setup"
git push -u origin master
```

## Шаг 2: Настройка Google Apps Script

### 2.1 Установка Clasp
```bash
# Установка Google Apps Script CLI
npm install -g @google/clasp

# Авторизация в Google
clasp login
```

### 2.2 Создание проекта в Google Apps Script
1. Перейдите на [Google Apps Script](https://script.google.com/)
2. Нажмите "New project"
3. Название: `SmartPit`
4. Скопируйте ID проекта из URL (после `/d/` и до `/edit`)

### 2.3 Настройка .clasp.json
```bash
# Создайте файл .clasp.json с вашим Script ID
echo '{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "."
}' > .clasp.json
```

**Замените `YOUR_SCRIPT_ID_HERE` на реальный ID вашего скрипта**

### 2.4 Первоначальная синхронизация
```bash
# Отправьте файлы в Google Apps Script
clasp push

# Проверьте, что файлы загрузились
clasp open
```

## Шаг 3: Настройка автоматической синхронизации

### 3.1 Использование скрипта синхронизации
```bash
# Проверка статуса
npm run status

# Отправка изменений в Google
npm run push

# Загрузка изменений из Google
npm run pull

# Настройка окружения
npm run setup
```

### 3.2 Настройка Git hooks (опционально)
Создайте файл `.git/hooks/pre-commit`:
```bash
#!/bin/sh
# Автоматическая синхронизация с Google при коммите
npm run push
```

Сделайте его исполняемым:
```bash
chmod +x .git/hooks/pre-commit
```

## Шаг 4: Настройка конфигурации

### 4.1 Обновление config.js
Откройте `config.js` и настройте:
```javascript
const CONFIG = {
  // Telegram Bot Token (получите у @BotFather)
  TELEGRAM_BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',
  
  // Google Sheets ID (из URL таблицы)
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID_HERE',
  
  // Gemini API Key
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  
  // Webhook URL (после деплоя)
  WEBHOOK_URL: 'YOUR_WEBHOOK_URL_HERE'
};
```

### 4.2 Получение токенов и ключей

#### Telegram Bot Token:
1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям
4. Скопируйте полученный токен

#### Google Sheets ID:
1. Создайте Google таблицу
2. Скопируйте ID из URL: `https://docs.google.com/spreadsheets/d/YOUR_ID_HERE/edit`

#### Gemini API Key:
1. Перейдите на [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Создайте новый API ключ
3. Скопируйте ключ

## Шаг 5: Деплой и тестирование

### 5.1 Деплой webhook
```bash
# Создание новой версии
clasp deploy

# Получение URL webhook
clasp deployments
```

### 5.2 Настройка webhook в Telegram
```bash
# Установите webhook URL
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "YOUR_WEBHOOK_URL"}'
```

### 5.3 Тестирование
1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Проверьте работу основных команд

## Шаг 6: Автоматизация разработки

### 6.1 Рабочий процесс
```bash
# 1. Внесите изменения в код
# 2. Протестируйте локально
# 3. Сохраните в Git
git add .
git commit -m "Описание изменений"

# 4. Отправьте в GitHub
git push

# 5. Синхронизируйте с Google
npm run push
```

### 6.2 Мониторинг
```bash
# Просмотр логов
npm run logs

# Открытие проекта в браузере
npm run open
```

## Устранение проблем

### Проблема: "Clasp не установлен"
```bash
npm install -g @google/clasp
```

### Проблема: "Clasp не авторизован"
```bash
clasp login
```

### Проблема: "Ошибка доступа к Google Sheets"
1. Проверьте права доступа к таблице
2. Убедитесь, что таблица доступна для редактирования
3. Проверьте ID таблицы в config.js

### Проблема: "Webhook не работает"
1. Проверьте URL webhook
2. Убедитесь, что деплой прошел успешно
3. Проверьте логи в Google Apps Script

## Полезные команды

```bash
# Быстрая проверка статуса
npm run status

# Отправка изменений
npm run push

# Загрузка изменений
npm run pull

# Открытие проекта
npm run open

# Просмотр логов
npm run logs

# Создание новой версии
npm run deploy
```

## Структура файлов после настройки

```
SmartPit/
├── .git/                    # Git репозиторий
├── .clasp.json             # Конфигурация Clasp
├── .gitignore              # Исключения Git
├── package.json            # Конфигурация npm
├── README.md               # Описание проекта
├── SYNC_SETUP.md          # Эта инструкция
├── sync_with_google.js    # Скрипт синхронизации
├── config.js              # Конфигурация проекта
├── appsscript.json        # Настройки Apps Script
└── [все остальные файлы проекта]
```

## Поддержка

При возникновении проблем:
1. Проверьте логи: `npm run logs`
2. Проверьте статус: `npm run status`
3. Создайте Issue в GitHub репозитории
4. Обратитесь к документации Google Apps Script 