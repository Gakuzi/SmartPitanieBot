/**
 * Простой тестовый файл для проверки синхронизации
 */
function testSimple() {
  Logger.log('✅ Простой тест работает!');
  return 'Тест успешен';
}

function testSetup() {
  Logger.log('🔧 Тест настройки инфраструктуры');
  
  try {
    // Проверяем, есть ли функция setupCompleteInfrastructure
    if (typeof setupCompleteInfrastructure === 'function') {
      Logger.log('✅ Функция setupCompleteInfrastructure найдена');
      
      // Запускаем настройку
      const results = setupCompleteInfrastructure();
      Logger.log('Результаты настройки:');
      Logger.log(JSON.stringify(results, null, 2));
      
      return results;
    } else {
      Logger.log('❌ Функция setupCompleteInfrastructure НЕ найдена');
      return { error: 'Функция не найдена' };
    }
  } catch (error) {
    Logger.log('❌ Ошибка: ' + error.message);
    return { error: error.message };
  }
} 