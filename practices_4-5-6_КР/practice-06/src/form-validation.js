const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const errors = {};

  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  if (title.length < 1 || title.length > 100) {
    errors.title = "Название должно содержать от 1 до 100 символов без учёта пробелов по краям.";
  }

  if (!ALLOWED_PRIORITIES.has(draft?.priority)) {
    errors.priority = "Выберите приоритет из списка.";
  }

  // Значение select приходит строкой; Number("") даёт 0, а не NaN, поэтому пустая строка отсеивается отдельно.
  const raw = draft?.categoryId;
  const categoryId = typeof raw === "number" ? raw
    : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
  if (!Number.isSafeInteger(categoryId) || !categories.some((item) => item.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }

  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    value: valid ? { title, priority: draft.priority, categoryId } : null,
    errors,
  };
}
