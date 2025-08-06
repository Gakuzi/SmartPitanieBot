#!/usr/bin/env node

/**
 * Скрипт для синхронизации проекта SmartPit с Google Apps Script
 * Использование: node sync_with_google.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Конфигурация
const CONFIG = {
  projectName: 'SmartPit',
  claspConfigFile: '.clasp.json',
  filesToSync: [
    '0_onOpen.js',
    '0_setup.js', 
    '1_main.js',
    '2_telegram_api.js',
    '3_ui_menus.js',
    '4_user_data.js',
    '5_nutrition_ai.js',
    '6_sheets_api.js',
    '7_utils.js',
    '8_gemini_api.js',
    '9_manual_mode.js',
    'doPost.js',
    'config.js',
    'appsscript.json'
  ]
};

// Функции
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

function checkClaspInstalled() {
  try {
    execSync('clasp --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function checkClaspLogin() {
  try {
    execSync('clasp list', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function createClaspConfig() {
  if (!fs.existsSync(CONFIG.claspConfigFile)) {
    log('Создание .clasp.json...');
    const claspConfig = {
      "scriptId": "YOUR_SCRIPT_ID_HERE",
      "rootDir": "."
    };
    fs.writeFileSync(CONFIG.claspConfigFile, JSON.stringify(claspConfig, null, 2));
    log('Файл .clasp.json создан. Не забудьте заменить YOUR_SCRIPT_ID_HERE на реальный ID скрипта!');
  }
}

function syncWithGoogle() {
  try {
    log('Начинаем синхронизацию с Google Apps Script...');
    
    // Проверяем статус Git
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      log('Обнаружены несохраненные изменения в Git. Сначала сделайте коммит!', 'WARNING');
      return false;
    }
    
    // Отправляем изменения в Google
    execSync('clasp push', { stdio: 'inherit' });
    log('Синхронизация завершена успешно!');
    return true;
    
  } catch (error) {
    log(`Ошибка синхронизации: ${error.message}`, 'ERROR');
    return false;
  }
}

function pullFromGoogle() {
  try {
    log('Загружаем изменения из Google Apps Script...');
    execSync('clasp pull', { stdio: 'inherit' });
    log('Загрузка завершена успешно!');
    return true;
  } catch (error) {
    log(`Ошибка загрузки: ${error.message}`, 'ERROR');
    return false;
  }
}

function showHelp() {
  console.log(`
SmartPit - Синхронизация с Google Apps Script

Использование:
  node sync_with_google.js [команда]

Команды:
  push     - Отправить изменения в Google Apps Script
  pull     - Загрузить изменения из Google Apps Script
  setup    - Настройка окружения
  status   - Показать статус синхронизации

Примеры:
  node sync_with_google.js push
  node sync_with_google.js pull
  node sync_with_google.js setup
`);
}

function showStatus() {
  try {
    log('Проверка статуса...');
    
    // Git статус
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      log('Git: Есть несохраненные изменения', 'WARNING');
    } else {
      log('Git: Все изменения сохранены', 'SUCCESS');
    }
    
    // Clasp статус
    if (checkClaspInstalled()) {
      log('Clasp: Установлен', 'SUCCESS');
    } else {
      log('Clasp: Не установлен', 'ERROR');
    }
    
    if (checkClaspLogin()) {
      log('Clasp: Авторизован', 'SUCCESS');
    } else {
      log('Clasp: Не авторизован', 'ERROR');
    }
    
    // Проверка файлов
    const missingFiles = CONFIG.filesToSync.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
      log(`Отсутствуют файлы: ${missingFiles.join(', ')}`, 'WARNING');
    } else {
      log('Все файлы проекта на месте', 'SUCCESS');
    }
    
  } catch (error) {
    log(`Ошибка проверки статуса: ${error.message}`, 'ERROR');
  }
}

// Основная логика
function main() {
  const command = process.argv[2];
  
  log('SmartPit - Синхронизация с Google Apps Script');
  
  switch (command) {
    case 'push':
      if (!checkClaspInstalled()) {
        log('Clasp не установлен. Выполните: npm install -g @google/clasp', 'ERROR');
        process.exit(1);
      }
      if (!checkClaspLogin()) {
        log('Clasp не авторизован. Выполните: clasp login', 'ERROR');
        process.exit(1);
      }
      syncWithGoogle();
      break;
      
    case 'pull':
      if (!checkClaspInstalled()) {
        log('Clasp не установлен. Выполните: npm install -g @google/clasp', 'ERROR');
        process.exit(1);
      }
      if (!checkClaspLogin()) {
        log('Clasp не авторизован. Выполните: clasp login', 'ERROR');
        process.exit(1);
      }
      pullFromGoogle();
      break;
      
    case 'setup':
      log('Настройка окружения...');
      if (!checkClaspInstalled()) {
        log('Установите Clasp: npm install -g @google/clasp', 'INFO');
      }
      createClaspConfig();
      log('Настройка завершена!');
      break;
      
    case 'status':
      showStatus();
      break;
      
    default:
      showHelp();
      break;
  }
}

// Запуск
if (require.main === module) {
  main();
}

module.exports = {
  syncWithGoogle,
  pullFromGoogle,
  showStatus
}; 