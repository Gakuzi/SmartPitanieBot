# SmartPit v2

Умный ассистент питания и личных финансов на базе Telegram + Google Sheets с минималистичной, модульной архитектурой.

## Основные возможности
- Меню питания (AI/ручной режим), список покупок, готовка
- Хранение данных пользователя в его Google Таблице
- Самодиагностика и авто‑восстановление инфраструктуры
- Вебхуки Telegram, интеграция Gemini

## Архитектура
См. `SMARTPIT_ARCHITECTURE.md` — подробная схема модулей и взаимодействий.

Ключевые директории:
- `core/` — роутер, состояние, диагностика
- `modules/` — telegram, offline/online, sheets, ai
- `utils/` — утилиты (markdown и др.)

## Быстрый старт (локально + GAS)
1) Установить clasp и авторизоваться
```
npm i -g @google/clasp
clasp login
```
2) Указать `scriptId` в `.clasp.json` (уже настроен)
3) Задать Script Properties в Apps Script: `TELEGRAM_TOKEN`, `ROOT_FOLDER_ID`, опц.: `GEMINI_API_KEY`, `USERS_SPREADSHEET_ID`
4) Залить код в GAS
```
clasp push
```
5) Развернуть Web App (в `appsscript.json` уже задано executeAs/access)
```
clasp deploy -d "SmartPit v2"
```
6) Настроить вебхук Telegram на URL выданного деплоя

## Самодиагностика и восстановление
- В Telegram: раздел «Диагностика и восстановление» в SmartPit Console
- Прямые функции: `runFullSystemTest`, `restoreTableStructure`, `setupCompleteInfrastructure`

## Как внести вклад
- Форк/PR приветствуются. Следуйте стилю кода и структуре модулей v2
- Issues: баги, предложения, UX улучшения
- Добавляйте модульные юниты в `/modules` без нарушения зависимостей

## Связь
Автор: Климов Евгений — [Написать в Telegram](https://t.me/eklimov)