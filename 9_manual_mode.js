/**
 * @file 9_manual_mode.js
 * @description Модуль для ручного режима работы без AI.
 */

/**
 * Генерирует базовое меню питания без использования AI.
 * @param {Object} bmrData - Данные BMR.
 * @returns {string} Сгенерированное меню.
 */
function generateMenu(bmrData) {
  try {
    Logger.log(' Генерируем базовое меню без AI');

    const { dailyCalories, protein, fats, carbs } = bmrData;
    
    // Распределяем калории по приемам пищи
    const breakfast = Math.round(dailyCalories * 0.25);
    const lunch = Math.round(dailyCalories * 0.35);
    const dinner = Math.round(dailyCalories * 0.25);
    const snacks = Math.round(dailyCalories * 0.15);

    const menu = ' *Ваше меню на день*\n\n' +
      ' *Целевые показатели:*\n' +
      ' Калории: ' + dailyCalories + ' ккал\n' +
      ' Белки: ' + protein + ' г\n' +
      ' Жиры: ' + fats + ' г\n' +
      ' Углеводы: ' + carbs + ' г\n\n' +
      ' *ЗАВТРАК* (~' + breakfast + ' ккал):\n' +
      ' Овсяная каша с фруктами\n' +
      ' Творог с орехами\n' +
      ' Чай или кофе\n\n' +
      ' *ОБЕД* (~' + lunch + ' ккал):\n' +
      ' Куриная грудка с рисом\n' +
      ' Овощной салат\n' +
      ' Компот\n\n' +
      ' *УЖИН* (~' + dinner + ' ккал):\n' +
      ' Рыба на пару\n' +
      ' Овощи гриль\n' +
      ' Кефир\n\n' +
      ' *ПЕРЕКУСЫ* (~' + snacks + ' ккал):\n' +
      ' Фрукты или орехи\n' +
      ' Йогурт\n\n' +
      ' *Рекомендация:* Пейте больше воды и следите за размером порций!';

    return menu;

  } catch (error) {
    Logger.log(' ОШИБКА при генерации базового меню: ' + error.message);
    throw new Error('Не удалось сгенерировать меню');
  }
}
