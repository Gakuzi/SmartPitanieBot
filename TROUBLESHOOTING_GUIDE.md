# Руководство по устранению проблем с SmartPit Bot

## Проблема: "Произошла ошибка сервера" при настройке таблицы

### 🔍 Диагностика проблемы

Ошибка "Произошла ошибка сервера" обычно возникает из-за проблем с разрешениями Google Apps Script. Вот пошаговый план решения:

### Шаг 1: Проверка разрешений

1. **Откройте Google Apps Script** и найдите проект "smartPit"
2. **Запустите функцию `diagnosePermissions()`** из файла `0_setup.js`
3. **Проверьте логи** - они покажут, какие именно разрешения не работают

### Шаг 2: Проверка и настройка API в Google Cloud Console

1. **Откройте Google Cloud Console:**
   - Перейдите: https://console.cloud.google.com/
   - Выберите проект: "klimov-evgeny" (Project ID: 914830127018)

2. **Проверьте включенные API:**
   - Перейдите в: APIs & Services → Enabled APIs
   - Убедитесь, что включены:
     - Google Apps Script API
     - Google Drive API
     - Google Sheets API
     - Google Cloud Logging API

3. **Если API не включены:**
   - Перейдите в: APIs & Services → Library
   - Найдите нужные API и нажмите "Enable"

4. **Проверьте квоты и лимиты:**
   - Перейдите в: APIs & Services → Quotas
   - Убедитесь, что не превышены лимиты для Drive и Sheets API

### Шаг 3: Проверка oauthScopes

Убедитесь, что в `appsscript.json` есть все необходимые разрешения:

```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.scriptapp",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

### Шаг 4: Проверка в Google Cloud Console

1. **Откройте Google Cloud Console:** https://console.cloud.google.com/
2. **Выберите проект:** "klimov-evgeny" (Project ID: 914830127018)
3. **Перейдите в:** APIs & Services → Enabled APIs
4. **Убедитесь, что включены:**
   - Google Apps Script API
   - Google Drive API
   - Google Sheets API

### Шаг 5: Проверка логов в Google Cloud Console

1. **В Google Cloud Console перейдите в:** Logging → Logs Explorer
2. **Настройте фильтр:**
   ```
   resource.type="cloud_run_revision"
   resource.labels.service_name="smartPit"
   ```
3. **Проверьте логи за последние 24 часа**
4. **Ищите ошибки с временными метками, соответствующими времени запуска функции**

### Шаг 6: Альтернативное решение - ручная настройка

Если автоматическая настройка не работает, создайте инфраструктуру вручную:

1. **Создайте папку в Google Drive:**
   - Название: "SmartPit_Users"
   - Скопируйте ID папки из URL

2. **Создайте Google Таблицу:**
   - Название: "Template_SmartPit_Sheet"
   - Скопируйте ID таблицы из URL

3. **Запустите функцию `setManualInfrastructure()`** (если есть) или вручную сохраните ID в ScriptProperties

### 🔧 Полезные функции для диагностики

#### `diagnosePermissions()`
Проверяет доступ к всем необходимым сервисам Google.

#### `resetPermissions()`
Принудительно сбрасывает и запрашивает разрешения заново.

#### `setupProjectInfrastructure()`
Основная функция настройки инфраструктуры (улучшена с лучшей обработкой ошибок).

#### `checkBotStatus()`
Проверяет статус бота и вебхука.

### 📊 Мониторинг в Google Cloud Console

#### Просмотр логов в реальном времени:
```bash
# В терминале Google Cloud Console
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=smartPit"
```

#### Фильтры для поиска ошибок:
```
severity>=ERROR
resource.type="cloud_run_revision"
resource.labels.service_name="smartPit"
```

### 🚨 Частые причины ошибок

1. **Недостаточные разрешения** - добавьте `drive.file` в oauthScopes
2. **Устаревшие разрешения** - сбросьте и запросите заново
3. **Проблемы с API** - проверьте включенные API в Cloud Console
4. **Квоты превышены** - проверьте лимиты в Cloud Console
5. **Проблемы с аутентификацией** - переавторизуйте проект

### 📞 Поддержка

Если проблема не решается:

1. **Проверьте логи в Google Cloud Console** за последние 24 часа
2. **Запустите `diagnosePermissions()`** и поделитесь результатами
3. **Проверьте, что все API включены** в Cloud Console
4. **Убедитесь, что проект активен** и не превышены квоты

### 🔄 Автоматическое решение

Попробуйте выполнить эти функции по порядку:

1. `diagnosePermissions()` - диагностика
2. `resetPermissions()` - сброс разрешений
3. `setupProjectInfrastructure()` - настройка инфраструктуры
4. `deployAndUpdateWebhook()` - развертывание бота
5. `checkBotStatus()` - проверка статуса

### 📝 Примечания

- **Время выполнения:** Функции могут выполняться до 30 секунд
- **Логи:** Всегда проверяйте логи в Google Apps Script после выполнения функций
- **Квоты:** Google Apps Script имеет лимиты на количество операций
- **Кэширование:** Иногда нужно подождать несколько минут после изменений разрешений 