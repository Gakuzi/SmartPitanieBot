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

