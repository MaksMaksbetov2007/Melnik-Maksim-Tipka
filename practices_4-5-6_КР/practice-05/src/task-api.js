import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

function normalizeFilters(filters = {}) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("filters должен быть объектом.");
  }
  const query = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) throw new TypeError(`Неизвестный фильтр: ${name}.`);
    if (value === undefined) continue;
    if (name === "completed") {
      if (typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
      query.completed = value;
    } else if (name === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) throw new TypeError("Недопустимый priority.");
      query.priority = value;
    } else if (name === "categoryId") {
      if (!isPositiveSafeInteger(value)) throw new TypeError("categoryId должен быть положительным целым.");
      query.categoryId = value;
    } else if (name === "q") {
      if (typeof value !== "string") throw new TypeError("q должен быть строкой.");
      const text = value.trim();
      if (text.length > 100) throw new TypeError("q не должен быть длиннее 100 символов.");
      if (text !== "") query.q = text;
    }
  }
  return query;
}

function readCollection(payload, isItem, label) {
  const ok = payload && typeof payload === "object"
    && Array.isArray(payload.data)
    && payload.meta && typeof payload.meta === "object"
    && Number.isSafeInteger(payload.meta.total)
    && payload.meta.total === payload.data.length;
  if (!ok) throw invalidResponse(`Некорректная коллекция: ${label}.`);
  if (!payload.data.every(isItem)) throw invalidResponse(`Некорректный элемент коллекции: ${label}.`);
  if (new Set(payload.data.map((item) => item.id)).size !== payload.data.length) {
    throw invalidResponse(`В коллекции ${label} повторяются id.`);
  }
  return payload;
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client должен содержать метод requestJson.");
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    // Фильтры уходят серверу в query-параметрах, а не применяются к локальному массиву.
    const payload = await client.requestJson("/tasks", { query });
    const { data, meta } = readCollection(payload, isTask, "tasks");
    return { tasks: data, meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("id должен быть положительным целым числом.");
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!payload || !isTask(payload.data)) throw invalidResponse("Некорректная задача в ответе.");
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    return readCollection(payload, isCategory, "categories").data;
  }

  async function loadInitialData(filters = {}) {
    // Запросы независимы, поэтому стартуют одновременно.
    const [{ tasks, meta }, categories] = await Promise.all([getTasks(filters), getCategories()]);
    return { tasks, categories, meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
