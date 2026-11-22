import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
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

export function isCategory(value) {
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

function requireId(id) {
  if (!isPositiveSafeInteger(id)) throw new TypeError("id должен быть положительным целым числом.");
}

// Опции вызова добавляются в запрос только когда они заданы.
function withSignal(options, signal) {
  return signal ? { ...options, signal } : options;
}

function readTask(payload) {
  if (!payload || !isTask(payload.data)) throw invalidResponse("Некорректная задача в ответе.");
  return payload.data;
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("client должен содержать метод requestJson.");
  }

  async function getTasks(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", withSignal({ query }, signal));
    const { data, meta } = readCollection(payload, isTask, "tasks");
    return { tasks: data, meta };
  }

  async function getTaskById(id, { signal } = {}) {
    requireId(id);
    const options = withSignal({}, signal);
    const payload = await (Object.keys(options).length
      ? client.requestJson(`/tasks/${id}`, options)
      : client.requestJson(`/tasks/${id}`));
    return readTask(payload);
  }

  async function getCategories({ signal } = {}) {
    const options = withSignal({}, signal);
    const payload = await (Object.keys(options).length
      ? client.requestJson("/categories", options)
      : client.requestJson("/categories"));
    return readCollection(payload, isCategory, "categories").data;
  }

  async function loadInitialData(filters = {}, { signal } = {}) {
    // Запросы независимы, поэтому стартуют одновременно.
    const [{ tasks, meta }, categories] = await Promise.all([
      getTasks(filters, { signal }),
      getCategories({ signal }),
    ]);
    return { tasks, categories, meta };
  }

  async function createTask(draft, { signal } = {}) {
    const payload = await client.requestJson("/tasks", withSignal({ method: "POST", body: draft }, signal));
    return readTask(payload);
  }

  async function updateTask(id, changes, { signal } = {}) {
    requireId(id);
    const payload = await client.requestJson(
      `/tasks/${id}`,
      withSignal({ method: "PATCH", body: changes }, signal),
    );
    return readTask(payload);
  }

  // Смена статуса — PATCH с единственным полем completed.
  function setTaskCompleted(id, completed, { signal } = {}) {
    if (typeof completed !== "boolean") throw new TypeError("completed должен быть boolean.");
    return updateTask(id, { completed }, { signal });
  }

  async function deleteTask(id, { signal } = {}) {
    requireId(id);
    const result = await client.requestJson(`/tasks/${id}`, withSignal({ method: "DELETE" }, signal));
    if (result !== null) throw invalidResponse("Ожидался ответ 204 без тела.");
    return null;
  }

  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", withSignal({ method: "POST" }, signal));
    const data = payload?.data;
    if (!data || data.reset !== true || !Number.isSafeInteger(data.total)) {
      throw invalidResponse("Некорректное подтверждение сброса.");
    }
    return data;
  }

  return {
    getTasks, getTaskById, getCategories, loadInitialData,
    createTask, updateTask, setTaskCompleted, deleteTask, resetDemoData,
  };
}
