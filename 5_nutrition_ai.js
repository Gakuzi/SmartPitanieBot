// --- AI-модуль: Расчет КБЖУ ---
function calculateNutrition(userData) {
  const { weight, height, age, sex, activity, goal } = userData;

  // 1. Расчет базового метаболизма (BMR) по формуле Миффлина-Сан Жеора
  let bmr;
  if (sex === 'm') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // 2. Коррекция на активность
  const activityMultipliers = { 'низкий': 1.2, 'средний': 1.55, 'высокий': 1.9 };
  const tdee = bmr * (activityMultipliers[activity] || 1.2);

  // 3. Коррекция на цель
  const goalMultipliers = { 'похудение': 0.85, 'набор': 1.15, 'удержание': 1.0 };
  const finalCalories = Math.round(tdee * (goalMultipliers[goal] || 1.0));

  // 4. Расчет БЖУ (в граммах)
  const bjuRatios = {
    'похудение': { p: 0.35, f: 0.30, c: 0.35 },
    'набор':     { p: 0.30, f: 0.25, c: 0.45 },
    'удержание': { p: 0.30, f: 0.30, c: 0.40 }
  };
  const ratio = bjuRatios[goal] || bjuRatios['удержание'];
  const proteins = Math.round((finalCalories * ratio.p) / 4);
  const fats = Math.round((finalCalories * ratio.f) / 9);
  const carbs = Math.round((finalCalories * ratio.c) / 4);

  return { calories: finalCalories, proteins, fats, carbs };
}

function triggerNutritionCalculation(chatId, userData) {
    const nutrition = calculateNutrition(userData);
    // Сохраняем рассчитанные данные
    let finalUserData = saveUserParam(chatId, 'calories', nutrition.calories);
    finalUserData = saveUserParam(chatId, 'proteins', nutrition.proteins);
    finalUserData = saveUserParam(chatId, 'fats', nutrition.fats);
    finalUserData = saveUserParam(chatId, 'carbs', nutrition.carbs);

    // Отправляем результат пользователю
    const message = `🤖 *Ваша персональная норма КБЖУ:*\n\n` +
                    `*Калории:* ${nutrition.calories} ккал/день\n` +
                    `*Белки:* ${nutrition.proteins} г/день\n` +
                    `*Жиры:* ${nutrition.fats} г/день\n` +
                    `*Углеводы:* ${nutrition.carbs} г/день\n\n` +
                    `Я буду использовать эти данные для составления вашего меню.`;
    sendText(chatId, message);
}