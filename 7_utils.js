// --- Проверка формата времени ---
function validateTimeFormat(timeStr) {
  return /^\d{2}:\d{2}$/.test(timeStr) &&
    Number(timeStr.substr(0, 2)) >= 0 && Number(timeStr.substr(0, 2)) < 24 &&
    Number(timeStr.substr(3, 2)) >= 0 && Number(timeStr.substr(3, 2)) < 60;
}
