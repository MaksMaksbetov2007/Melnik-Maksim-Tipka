// Прикладная логика работы с задачами.
// Модуль не выводит сообщения, не обращается к DOM и не хранит глобальный список:
// каждая функция работает только с переданными аргументами и возвращает результат.

const ALLOWED_PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

// ---------- Внутренние проверки (не экспортируются) ----------

// Возвращает текст ошибки или null, если id корректен.
// Number.isSafeInteger не преобразует строки: "4" будет отклонён.
function validateId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return "Идентификатор должен быть положительным целым числом";
  }
  return null;
}

// Возвращает { ok: true, title } с очищенным названием или { ok: false, error }.
// Тип проверяется ДО вызова trim(), иначе для null/42 будет исключение.
function normalizeTitle(title) {
  if (typeof title !== "string") {
    return { ok: false, error: "Название должно быть строкой" };
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Название не должно быть пустым" };
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return { ok: false, error: `Название не должно быть длиннее ${MAX_TITLE_LENGTH} символов` };
  }
  return { ok: true, title: trimmed };
}

// ---------- Создание ----------

export function createTask(id, title, priority = "medium") {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }

  // includes сравнивает строго: "HIGH", " high " и null не входят в список.
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    return { ok: false, error: "Приоритет должен быть одним из: low, medium, high" };
  }

  return {
    ok: true,
    task: { id, title: titleResult.title, completed: false, priority },
  };
}

// ---------- Чтение ----------

export function findTaskById(tasks, id) {
  // Строгое сравнение: строка "4" не совпадёт с числом 4.
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  let completed = 0;
  for (const task of tasks) {
    if (task.completed === true) {
      completed += 1;
    }
  }
  const pending = total - completed;
  // Для пустого списка 0, чтобы не получить NaN от деления 0 / 0.
  // Округление не выполняется: это задача кода, который выводит результат.
  let progress = 0;
  if (total > 0) {
    progress = (completed / total) * 100;
  }

  return { total, completed, pending, progress };
}

// ---------- Изменение (без мутации входных данных) ----------

export function addTask(tasks, id, title, priority = "medium") {
  // Все проверки полей переиспользуются из createTask.
  const created = createTask(id, title, priority);
  if (!created.ok) {
    return created;
  }
  // Уникальность можно проверить только здесь: createTask списка не видит.
  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже существует` };
  }
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }
  if (typeof completed !== "boolean") {
    return { ok: false, error: "Статус выполнения должен быть true или false" };
  }
  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // map создаёт новый массив. Для выбранной задачи создаётся новый объект (spread),
  // остальные задачи возвращаются без изменений.
  const nextTasks = tasks.map((task) => {
    if (task.id === id) {
      // Поле completed стоит после ...task, поэтому перекрывает старое значение.
      return { ...task, completed: completed };
    }
    return task;
  });
  return { ok: true, tasks: nextTasks };
}

export function renameTask(tasks, id, title) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }
  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return titleResult;
  }
  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  const nextTasks = tasks.map((task) => {
    if (task.id === id) {
      return { ...task, title: titleResult.title };
    }
    return task;
  });
  return { ok: true, tasks: nextTasks };
}

export function removeTask(tasks, id) {
  const idError = validateId(id);
  if (idError !== null) {
    return { ok: false, error: idError };
  }
  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
