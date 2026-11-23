// Модель задач: чистые функции без DOM, localStorage и внешнего состояния.
// Для предусмотренных ошибок возвращается { ok: false, error: "..." }.

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

function isValidId(id) {
  return Number.isSafeInteger(id) && id > 0;
}

function normalizeTitle(title) {
  if (typeof title !== "string") return null;
  const trimmed = title.trim();
  return trimmed.length >= 1 && trimmed.length <= 100 ? trimmed : null;
}

function fail(error) {
  return { ok: false, error };
}

export function createTask(id, title, priority = "medium") {
  if (!isValidId(id)) return fail("Идентификатор должен быть положительным целым числом.");
  const normalized = normalizeTitle(title);
  if (normalized === null) return fail("Название должно содержать от 1 до 100 символов.");
  if (!ALLOWED_PRIORITIES.has(priority)) return fail("Недопустимый приоритет.");
  return { ok: true, task: { id, title: normalized, completed: false, priority } };
}

export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => !task.completed);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  return {
    total,
    completed,
    pending: total - completed,
    progress: total === 0 ? 0 : (completed / total) * 100,
  };
}

export function addTask(tasks, id, title, priority = "medium") {
  const created = createTask(id, title, priority);
  if (!created.ok) return created;
  if (findTaskById(tasks, id)) return fail(`Задача с id ${id} уже существует.`);
  return { ok: true, tasks: [...tasks, created.task] };
}

// Общая замена полей одной задачи: возвращает новый массив и новый объект.
function patchTask(tasks, id, patch) {
  if (!isValidId(id)) return fail("Идентификатор должен быть положительным целым числом.");
  if (!findTaskById(tasks, id)) return fail(`Задача с id ${id} не найдена.`);
  return {
    ok: true,
    tasks: tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
  };
}

export function setTaskCompleted(tasks, id, completed) {
  if (typeof completed !== "boolean") return fail("Статус должен быть логическим значением.");
  return patchTask(tasks, id, { completed });
}

export function renameTask(tasks, id, title) {
  const normalized = normalizeTitle(title);
  if (normalized === null) return fail("Название должно содержать от 1 до 100 символов.");
  return patchTask(tasks, id, { title: normalized });
}

export function removeTask(tasks, id) {
  if (!isValidId(id)) return fail("Идентификатор должен быть положительным целым числом.");
  if (!findTaskById(tasks, id)) return fail(`Задача с id ${id} не найдена.`);
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}

export function updateTask(tasks, id, title, priority) {
  const normalized = normalizeTitle(title);
  if (normalized === null) return fail("Название должно содержать от 1 до 100 символов.");
  if (!ALLOWED_PRIORITIES.has(priority)) return fail("Недопустимый приоритет.");
  return patchTask(tasks, id, { title: normalized, priority });
}
