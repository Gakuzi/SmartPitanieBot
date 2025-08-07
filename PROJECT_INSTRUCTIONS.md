# Руководство по работе с проектом

## Конфигурация CLASP
- Название проекта: `Klimov Evgeny`
- Номер проекта: `914830127018`
- Project ID: `klimov-evgeny`

## Рабочий процесс:
1. Все изменения вносятся через команды clasp
2. Для деплоя используйте:
```bash
clasp push
```
3. Для просмотра логов выполните:
```bash
clasp logs --watch
```

## Оптимизация структуры:
1. Объединить <mcfile name="0_onOpen.js" path="/Users/evgeniy/Разработка Web приложений/smartPit/0_onOpen.js"></mcfile> и <mcfile name="0_setup.js" path="/Users/evgeniy/Разработка Web приложений/smartPit/0_setup.js"></mcfile>
2. Удалить дублирующиеся утилиты в <mcfile name="7_utils.js" path="/Users/evgeniy/Разработка Web приложений/smartPit/7_utils.js"></mcfile>

**Следующий шаг:**
Выполните эту команду для просмотра содержимого 0_onOpen.js и подтвердите готовность продолжить:
```bash
cat /Users/evgeniy/Разработка\ Web\ приложений/smartPit/0_onOpen.js
```

Ожидаю вашего подтверждения перед анализом логов.