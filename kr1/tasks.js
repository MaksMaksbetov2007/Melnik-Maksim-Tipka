// Задания 2–3. Общие данные и функции работы с задачами

const demoTasks = [
  { id: 1, title: 'Установить окружение', completed: true },
  { id: 4, title: 'Написать функцию фильтрации', completed: false },
  { id: 7, title: 'Сверстать список задач', completed: false },
  { id: 10, title: 'Создать репозиторий', completed: true },
];

// Задание 2: новый массив только с невыполненными задачами
function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

// Вспомогательные функции для задания 3
function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function isValidStatus(completed) {
  return completed === true || completed === false;
}

// Задание 3: изменение статуса без изменения исходных данных
function setTaskCompleted(tasks, id, completed) {
  if (!Array.isArray(tasks)) {
    return { ok: false, error: 'tasks должен быть массивом' };
  }
  if (!isValidId(id)) {
    return { ok: false, error: 'id должен быть положительным целым числом' };
  }
  if (!isValidStatus(completed)) {
    return { ok: false, error: 'статус должен быть true или false' };
  }
  if (!tasks.some((task) => task.id === id)) {
    return { ok: false, error: `задача с id = ${id} не найдена` };
  }

  const newTasks = tasks.map((task) =>
    task.id === id ? { ...task, completed } : task
  );
  return { ok: true, tasks: newTasks };
}

if (typeof module !== 'undefined') {
  module.exports = { demoTasks, getPendingTasks, setTaskCompleted };
}
