/**
 * @file 4_user_data.js
 * @description Управление данными и состоянием пользователей.
 */

// --- Константы состояний пользователя ---
const STATES = {
  IDLE: 'idle', // Обычное состояние, бот ждет команд
  AWAITING_SETUP: 'awaiting_setup', // Пользователь в процессе настройки профиля
  // Можно добавлять другие состояния, например, AWAITING_MEAL_PHOTO
};

// --- Управление состоянием пользователя ---

/**
 * Устанавливает текущее состояние для пользователя.
 * @param {string|number} chatId - ID чата.
 * @param {string} state - Состояние из констант STATES.
 */
function setUserState(chatId, state) {
  const userProps = PropertiesService.getUserProperties();
  userProps.setProperty(`state_${chatId}`, state);
}

/**
 * Получает текущее состояние пользователя.
 * @param {string|number} chatId - ID чата.
 * @returns {string} - Текущее состояние (по умолчанию STATES.IDLE).
 */
function getUserState(chatId) {
  const userProps = PropertiesService.getUserProperties();
  return userProps.getProperty(`state_${chatId}`) || STATES.IDLE;
}


// --- Сохранение и получение данных пользователя ---
function saveUserParam(chatId, key, value) {
  const userProps = PropertiesService.getUserProperties();
  let userData = getUserData(chatId);
  userData[key] = value;
  userProps.setProperty('user_' + chatId, JSON.stringify(userData));
  addUser(chatId); // Убедимся, что пользователь зарегистрирован
  return userData; // Возвращаем обновленные данные
}

function getUserData(chatId) {
  const userProps = PropertiesService.getUserProperties();
  let data = userProps.getProperty('user_' + chatId);
  try {
    return data ? JSON.parse(data) : {};
  } catch (e) {
    Logger.log(`Ошибка парсинга JSON для пользователя ${chatId}: ${e.message}. Данные: ${data}`);
    return {};
  }
}

// --- Регистрация пользователя в общем списке ---
function getAllUsers() {
  const scriptProps = PropertiesService.getScriptProperties();
  const usersJson = scriptProps.getProperty('all_users') || '[]';
  try {
    return JSON.parse(usersJson);
  } catch (e) {
    Logger.log(`Ошибка парсинга JSON all_users: ${e.message}. Данные: ${usersJson}`);
    return [];
  }
}

function addUser(chatId) {
  const scriptProps = PropertiesService.getScriptProperties();
  let users = getAllUsers();
  if (!users.includes(chatId)) {
    users.push(chatId);
    scriptProps.setProperty('all_users', JSON.stringify(users));
  }
}

// --- Управление режимом работы ---

/**
 * Получает текущий режим работы из таблицы настроек.
 * @returns {string} 'AI' или 'Ручной'.
 */
function getMode() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName('Настройки');
    if (!settingsSheet) return 'AI'; // По умолчанию AI

    const modeCell = settingsSheet.getRange('B3');
    return modeCell.isChecked() ? 'AI' : 'Ручной';
  } catch (e) {
    Logger.log(`Ошибка при получении режима работы: ${e.message}. Возвращаем режим AI по умолчанию.`);
    return 'AI';
  }
}

/**
 * Проверяет, включен ли режим AI.
 * @returns {boolean} True, если режим AI активен.
 */
function isAiMode() {
  return getMode() === 'AI';
}

/**
 * Получение данных проекта для админ-панели
 */
function getProjectData() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const projectManagerId = scriptProps.getProperty('PROJECT_MANAGER_ID');
    
    if (!projectManagerId) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        tasks: [],
        projects: [],
        team: []
      };
    }

    const projectSpreadsheet = SpreadsheetApp.openById(projectManagerId);
    const tasksSheet = projectSpreadsheet.getSheetByName('Задачи');
    
    if (!tasksSheet) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        tasks: [],
        projects: [],
        team: []
      };
    }

    const data = tasksSheet.getDataRange().getValues();
    const headers = data[0];
    const tasks = [];
    let completedTasks = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // Проверяем, что ID не пустой
        const task = {
          id: row[0],
          name: row[1] || '',
          description: row[2] || '',
          priority: row[3] || 'Средний',
          status: row[4] || 'Новая',
          assignee: row[5] || '',
          created: row[6] || '',
          deadline: row[7] || '',
          progress: row[8] || 0,
          tags: row[9] || '',
          comments: row[10] || ''
        };
        
        tasks.push(task);
        
        if (task.status === 'Завершена') {
          completedTasks++;
        }
      }
    }

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks,
      tasks: tasks,
      projects: getProjectsData(projectSpreadsheet),
      team: getTeamData(projectSpreadsheet)
    };

  } catch (error) {
    Logger.log('Ошибка получения данных проекта: ' + error.message);
    return {
      totalTasks: 0,
      completedTasks: 0,
      tasks: [],
      projects: [],
      team: []
    };
  }
}

/**
 * Получение данных проектов
 */
function getProjectsData(projectSpreadsheet) {
  try {
    const projectsSheet = projectSpreadsheet.getSheetByName('Проекты');
    if (!projectsSheet) return [];

    const data = projectsSheet.getDataRange().getValues();
    const headers = data[0];
    const projects = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        const project = {
          id: row[0],
          name: row[1] || '',
          description: row[2] || '',
          status: row[3] || 'Активный',
          created: row[4] || ''
        };
        projects.push(project);
      }
    }

    return projects;

  } catch (error) {
    Logger.log('Ошибка получения данных проектов: ' + error.message);
    return [];
  }
}

/**
 * Получение данных команды
 */
function getTeamData(projectSpreadsheet) {
  try {
    const teamSheet = projectSpreadsheet.getSheetByName('Команда');
    if (!teamSheet) return [];

    const data = teamSheet.getDataRange().getValues();
    const headers = data[0];
    const team = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        const member = {
          id: row[0],
          name: row[1] || '',
          role: row[2] || '',
          email: row[3] || ''
        };
        team.push(member);
      }
    }

    return team;

  } catch (error) {
    Logger.log('Ошибка получения данных команды: ' + error.message);
    return [];
  }
}

/**
 * Добавление новой задачи
 */
function addNewTask(taskData) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const projectManagerId = scriptProps.getProperty('PROJECT_MANAGER_ID');
    
    if (!projectManagerId) {
      throw new Error('Таблица управления проектом не найдена');
    }

    const projectSpreadsheet = SpreadsheetApp.openById(projectManagerId);
    const tasksSheet = projectSpreadsheet.getSheetByName('Задачи');
    
    if (!tasksSheet) {
      throw new Error('Лист задач не найден');
    }

    const taskId = generateTaskId();
    const currentDate = new Date().toISOString().split('T')[0];
    
    const newTask = [
      taskId,
      taskData.name || 'Новая задача',
      taskData.description || '',
      taskData.priority || 'Средний',
      'Новая',
      taskData.assignee || '',
      currentDate,
      taskData.deadline || '',
      0,
      taskData.tags || '',
      taskData.comments || ''
    ];

    tasksSheet.appendRow(newTask);
    
    Logger.log('Новая задача добавлена: ' + taskId);
    return { success: true, taskId: taskId };

  } catch (error) {
    Logger.log('Ошибка добавления задачи: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Обновление задачи
 */
function updateTask(taskId, taskData) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const projectManagerId = scriptProps.getProperty('PROJECT_MANAGER_ID');
    
    if (!projectManagerId) {
      throw new Error('Таблица управления проектом не найдена');
    }

    const projectSpreadsheet = SpreadsheetApp.openById(projectManagerId);
    const tasksSheet = projectSpreadsheet.getSheetByName('Задачи');
    
    if (!tasksSheet) {
      throw new Error('Лист задач не найден');
    }

    const data = tasksSheet.getDataRange().getValues();
    let taskRow = -1;

    // Ищем задачу по ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === taskId) {
        taskRow = i + 1; // +1 потому что индексы в Sheets начинаются с 1
        break;
      }
    }

    if (taskRow === -1) {
      throw new Error('Задача не найдена');
    }

    // Обновляем данные задачи
    const updates = [];
    if (taskData.name !== undefined) updates.push({ col: 2, value: taskData.name });
    if (taskData.description !== undefined) updates.push({ col: 3, value: taskData.description });
    if (taskData.priority !== undefined) updates.push({ col: 4, value: taskData.priority });
    if (taskData.status !== undefined) updates.push({ col: 5, value: taskData.status });
    if (taskData.assignee !== undefined) updates.push({ col: 6, value: taskData.assignee });
    if (taskData.deadline !== undefined) updates.push({ col: 8, value: taskData.deadline });
    if (taskData.progress !== undefined) updates.push({ col: 9, value: taskData.progress });
    if (taskData.tags !== undefined) updates.push({ col: 10, value: taskData.tags });
    if (taskData.comments !== undefined) updates.push({ col: 11, value: taskData.comments });

    updates.forEach(update => {
      tasksSheet.getRange(taskRow, update.col).setValue(update.value);
    });

    Logger.log('Задача обновлена: ' + taskId);
    return { success: true };

  } catch (error) {
    Logger.log('Ошибка обновления задачи: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Удаление задачи
 */
function deleteTask(taskId) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const projectManagerId = scriptProps.getProperty('PROJECT_MANAGER_ID');
    
    if (!projectManagerId) {
      throw new Error('Таблица управления проектом не найдена');
    }

    const projectSpreadsheet = SpreadsheetApp.openById(projectManagerId);
    const tasksSheet = projectSpreadsheet.getSheetByName('Задачи');
    
    if (!tasksSheet) {
      throw new Error('Лист задач не найден');
    }

    const data = tasksSheet.getDataRange().getValues();
    let taskRow = -1;

    // Ищем задачу по ID
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === taskId) {
        taskRow = i + 1; // +1 потому что индексы в Sheets начинаются с 1
        break;
      }
    }

    if (taskRow === -1) {
      throw new Error('Задача не найдена');
    }

    tasksSheet.deleteRow(taskRow);
    
    Logger.log('Задача удалена: ' + taskId);
    return { success: true };

  } catch (error) {
    Logger.log('Ошибка удаления задачи: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Генерация уникального ID задачи
 */
function generateTaskId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return 'TASK_' + timestamp + '_' + random;
}

/**
 * Получение статистики проекта
 */
function getProjectStats() {
  try {
    const projectData = getProjectData();
    
    const stats = {
      totalTasks: projectData.totalTasks,
      completedTasks: projectData.completedTasks,
      inProgressTasks: 0,
      newTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      averageProgress: 0
    };

    let totalProgress = 0;
    const today = new Date();

    projectData.tasks.forEach(task => {
      if (task.status === 'В работе') stats.inProgressTasks++;
      if (task.status === 'Новая') stats.newTasks++;
      
      if (task.deadline && new Date(task.deadline) < today && task.status !== 'Завершена') {
        stats.overdueTasks++;
      }
      
      totalProgress += task.progress || 0;
    });

    if (stats.totalTasks > 0) {
      stats.completionRate = Math.round((stats.completedTasks / stats.totalTasks) * 100);
      stats.averageProgress = Math.round(totalProgress / stats.totalTasks);
    }

    return stats;

  } catch (error) {
    Logger.log('Ошибка получения статистики проекта: ' + error.message);
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      newTasks: 0,
      overdueTasks: 0,
      completionRate: 0,
      averageProgress: 0
    };
  }
}

// --- Управление профилями пользователей ---

/**
 * Получает полный профиль пользователя из его Google Sheets
 * @param {string|number} chatId - ID чата пользователя
 * @returns {Object} Профиль пользователя
 */
function getUserProfile(chatId) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const userFolderId = scriptProps.getProperty(String(chatId));
    
    if (!userFolderId) {
      return createEmptyProfile();
    }

    // Получаем таблицу пользователя
    const userFolder = DriveApp.getFolderById(userFolderId);
    const files = userFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
    
    if (!files.hasNext()) {
      return createEmptyProfile();
    }

    const userSpreadsheet = SpreadsheetApp.openById(files.next().getId());
    
    // Проверяем наличие листа "Профиль"
    let profileSheet = userSpreadsheet.getSheetByName('Профиль');
    if (!profileSheet) {
      profileSheet = createUserProfileSheet(userSpreadsheet);
    }

    // Читаем данные профиля
    const data = profileSheet.getRange('A1:B50').getValues();
    const profile = createEmptyProfile();
    
    for (let i = 0; i < data.length; i++) {
      const [key, value] = data[i];
      if (key && value !== '') {
        profile[key] = value;
      }
    }

    return profile;

  } catch (error) {
    Logger.log(`Ошибка получения профиля пользователя ${chatId}: ${error.message}`);
    return createEmptyProfile();
  }
}

/**
 * Сохраняет профиль пользователя в его Google Sheets
 * @param {string|number} chatId - ID чата пользователя
 * @param {Object} profile - Данные профиля
 * @returns {boolean} Успешность операции
 */
function saveUserProfile(chatId, profile) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const userFolderId = scriptProps.getProperty(String(chatId));
    
    if (!userFolderId) {
      Logger.log(`Папка пользователя ${chatId} не найдена`);
      return false;
    }

    const userFolder = DriveApp.getFolderById(userFolderId);
    const files = userFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
    
    if (!files.hasNext()) {
      Logger.log(`Таблица пользователя ${chatId} не найдена`);
      return false;
    }

    const userSpreadsheet = SpreadsheetApp.openById(files.next().getId());
    
    let profileSheet = userSpreadsheet.getSheetByName('Профиль');
    if (!profileSheet) {
      profileSheet = createUserProfileSheet(userSpreadsheet);
    }

    // Очищаем лист и записываем новые данные
    profileSheet.clear();
    
    const dataToWrite = [];
    for (const [key, value] of Object.entries(profile)) {
      if (value !== null && value !== undefined && value !== '') {
        dataToWrite.push([key, value]);
      }
    }

    if (dataToWrite.length > 0) {
      profileSheet.getRange(1, 1, dataToWrite.length, 2).setValues(dataToWrite);
    }

    // Обновляем время последнего изменения
    profile.lastUpdated = new Date().toISOString();
    
    return true;

  } catch (error) {
    Logger.log(`Ошибка сохранения профиля пользователя ${chatId}: ${error.message}`);
    return false;
  }
}

/**
 * Создает пустой профиль пользователя
 * @returns {Object} Пустой профиль
 */
function createEmptyProfile() {
  return {
    // Основная информация
    name: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    
    // Цели и активность
    goal: '', // похудение, набор массы, поддержание веса
    activityLevel: '', // малоподвижный, умеренная активность, высокая активность
    
    // Предпочтения в питании
    dietType: '', // обычное, вегетарианское, веганское, кето и т.д.
    preferredCuisines: [], // массив предпочитаемых кухонь
    favoriteProducts: [], // любимые продукты
    dislikedProducts: [], // нелюбимые продукты
    
    // Ограничения и аллергии
    allergies: [], // аллергии
    intolerances: [], // непереносимости
    medicalRestrictions: [], // медицинские ограничения
    
    // Бюджет и время
    monthlyBudget: '',
    cookingTime: '', // сколько времени готов тратить на готовку
    mealsPerDay: 3, // количество приемов пищи
    
    // История общения с ИИ
    conversationHistory: [],
    onboardingCompleted: false,
    
    // Системная информация
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    
    // Предпочтения уведомлений
    notificationTime: '09:00',
    notificationsEnabled: true
  };
}

/**
 * Создает лист "Профиль" в таблице пользователя
 * @param {Spreadsheet} spreadsheet - Таблица пользователя
 * @returns {Sheet} Созданный лист
 */
function createUserProfileSheet(spreadsheet) {
  const profileSheet = spreadsheet.insertSheet('Профиль');
  
  // Добавляем заголовки
  profileSheet.getRange('A1:B1').setValues([['Параметр', 'Значение']]);
  profileSheet.getRange('A1:B1').setFontWeight('bold');
  profileSheet.getRange('A1:B1').setBackground('#e8f0fe');
  
  // Настраиваем ширину колонок
  profileSheet.setColumnWidth(1, 200);
  profileSheet.setColumnWidth(2, 300);
  
  return profileSheet;
}

/**
 * Обновляет конкретное поле в профиле пользователя
 * @param {string|number} chatId - ID чата пользователя
 * @param {string} field - Название поля
 * @param {any} value - Новое значение
 * @returns {boolean} Успешность операции
 */
function updateUserProfileField(chatId, field, value) {
  try {
    const profile = getUserProfile(chatId);
    profile[field] = value;
    profile.lastUpdated = new Date().toISOString();
    return saveUserProfile(chatId, profile);
  } catch (error) {
    Logger.log(`Ошибка обновления поля ${field} для пользователя ${chatId}: ${error.message}`);
    return false;
  }
}

/**
 * Добавляет сообщение в историю общения с ИИ
 * @param {string|number} chatId - ID чата пользователя
 * @param {string} role - Роль (user/assistant)
 * @param {string} message - Текст сообщения
 * @returns {boolean} Успешность операции
 */
function addToConversationHistory(chatId, role, message) {
  try {
    const profile = getUserProfile(chatId);
    
    if (!profile.conversationHistory) {
      profile.conversationHistory = [];
    }
    
    profile.conversationHistory.push({
      timestamp: new Date().toISOString(),
      role: role,
      message: message
    });
    
    // Ограничиваем историю последними 50 сообщениями
    if (profile.conversationHistory.length > 50) {
      profile.conversationHistory = profile.conversationHistory.slice(-50);
    }
    
    return saveUserProfile(chatId, profile);
  } catch (error) {
    Logger.log(`Ошибка добавления в историю для пользователя ${chatId}: ${error.message}`);
    return false;
  }
}

/**
 * Получает историю общения для использования в промптах ИИ
 * @param {string|number} chatId - ID чата пользователя
 * @param {number} lastN - Количество последних сообщений (по умолчанию 10)
 * @returns {Array} Массив сообщений
 */
function getConversationHistory(chatId, lastN = 10) {
  try {
    const profile = getUserProfile(chatId);
    
    if (!profile.conversationHistory || profile.conversationHistory.length === 0) {
      return [];
    }
    
    return profile.conversationHistory.slice(-lastN);
  } catch (error) {
    Logger.log(`Ошибка получения истории для пользователя ${chatId}: ${error.message}`);
    return [];
  }
}

