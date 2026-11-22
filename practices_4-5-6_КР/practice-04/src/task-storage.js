export const STORAGE_VERSION = 1;

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Все функции принимают объект storage явно, чтобы их можно было проверить
// без обращения к глобальному window.localStorage.

function copyTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

function isValidTask(task) {
  return Boolean(
    task
    && typeof task === "object"
    && Number.isSafeInteger(task.id)
    && task.id > 0
    && typeof task.title === "string"
    && task.title.trim().length >= 1
    && task.title.trim().length <= 100
    && typeof task.completed === "boolean"
    && ALLOWED_PRIORITIES.has(task.priority),
  );
}

export function isValidTaskList(value) {
  if (!Array.isArray(value) || !value.every(isValidTask)) return false;
  return new Set(value.map((task) => task.id)).size === value.length;
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = (error) => ({
    ok: false,
    source: "fallback",
    tasks: copyTasks(fallbackTasks),
    error,
  });

  let raw;
  try {
    raw = storage.getItem(key);
  } catch (error) {
    return fallback(`Не удалось прочитать localStorage: ${error.message}`);
  }
  if (raw === null) return { ok: true, source: "initial", tasks: copyTasks(fallbackTasks) };

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return fallback("Сохранённые данные повреждены (некорректный JSON). Загружен исходный набор.");
  }
  if (!data || typeof data !== "object" || data.version !== STORAGE_VERSION) {
    return fallback("Неизвестная версия сохранённых данных. Загружен исходный набор.");
  }
  if (!isValidTaskList(data.tasks)) {
    return fallback("Сохранённые задачи не соответствуют схеме. Загружен исходный набор.");
  }
  return { ok: true, source: "storage", tasks: copyTasks(data.tasks) };
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Список задач некорректен и не был сохранён." };
  }
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить в localStorage: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные: ${error.message}` };
  }
}
