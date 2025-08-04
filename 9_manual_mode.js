/**
 * @file 9_manual_mode.js
 * @description Функции для ручного режима работы бота.
 */

/**
 * Рассчитывает КБЖУ на основе данных пользователя.
 * @param {object} userData - Данные пользователя (пол, вес, рост, возраст, уровень активности).
 * @returns {object} - Рассчитанные значения КБЖУ (BMR, TDEE).
 */
function calculateBMR(userData) {
  const { gender, weight, height, age, activityLevel } = userData;

  if (!gender || !weight || !height || !age || !activityLevel) {
    throw new Error("Отсутствуют необходимые данные для расчета КБЖУ.");
  }

  let bmr;
  if (gender.toLowerCase() === 'мужской') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else if (gender.toLowerCase() === 'женский') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    throw new Error("Некорректно указан пол. Допустимые значения: 'мужской' или 'женский'.");
  }

  const activityMultipliers = {
    'сидячий': 1.2,
    'легкая': 1.375,
    'умеренная': 1.55,
    'высокая': 1.725,
    'очень высокая': 1.9
  };

  const multiplier = activityMultipliers[activityLevel.toLowerCase()];

  if (!multiplier) {
    throw new Error("Некорректно указан уровень активности.");
  }

  const tdee = bmr * multiplier;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee)
  };
}

/**
 * Генерирует меню на основе рассчитанных КБЖУ.
 * @param {object} bmrData - Данные о КБЖУ (tdee).
 * @returns {string} - Сгенерированное меню.
 */
function generateMenu(bmrData) {
  const { tdee } = bmrData;

  // Простое разделение калорий на 3 приема пищи
  const breakfastCalories = Math.round(tdee * 0.3);
  const lunchCalories = Math.round(tdee * 0.4);
  const dinnerCalories = Math.round(tdee * 0.3);

  const menu = `
*Ваше меню на день (ручной режим):*

*Общая калорийность:* ${tdee} ккал

*Завтрак (~${breakfastCalories} ккал):*
- Овсяная каша на воде (50г сухой) с ягодами (50г)
- 1 вареное яйцо

*Обед (~${lunchCalories} ккал):*
- Куриная грудка на гриле (150г)
- Гречневая каша (150г готовой)
- Салат из свежих овощей с оливковым маслом

*Ужин (~${dinnerCalories} ккал):*
- Творог 5% (200г) с медом (1 ч.л.)
- 1 яблоко

*Это примерное меню. Вы можете заменять продукты на аналогичные по калорийности.*
  `;

  return menu;
}
