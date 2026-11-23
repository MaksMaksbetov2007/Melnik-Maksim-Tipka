const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Строка из поля формы -> положительное безопасное целое либо null.
// Number("4abc") даёт NaN, поэтому частичного разбора, как у parseInt, нет.
function parseId(raw) {
  if (typeof raw === "number") return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id = null;

  if (editingId !== null) {
    id = editingId;
    if (!tasks.some((task) => task.id === id)) {
      errors.id = `Редактируемая задача с id ${id} не найдена.`;
    }
  } else {
    id = parseId(draft.id);
    if (id === null) {
      errors.id = "Введите положительное целое число.";
    } else if (tasks.some((task) => task.id === id)) {
      errors.id = `Задача с id ${id} уже существует.`;
    }
  }

  // Название: строка длиной от 1 до 100 символов после trim().
  const title = typeof draft.title === "string" ? draft.title.trim() : "";
  if (typeof draft.title !== "string" || title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов без учёта пробелов по краям.";
  }

  if (!ALLOWED_PRIORITIES.has(draft.priority)) {
    errors.priority = "Выберите приоритет: low, medium или high.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { id, title, priority: draft.priority } };
}
