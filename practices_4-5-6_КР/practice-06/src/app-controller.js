import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

const API_METHODS = [
  "loadInitialData", "getTasks", "createTask", "updateTask",
  "setTaskCompleted", "deleteTask", "resetDemoData",
];
const VIEW_METHODS = [
  "setListState", "setTasks", "setCategories", "setTotal",
  "setFormTask", "showFormErrors", "setMutationPending", "notify",
];

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  for (const name of API_METHODS) {
    if (typeof api?.[name] !== "function") throw new TypeError(`api.${name} должен быть функцией.`);
  }
  for (const name of VIEW_METHODS) {
    if (typeof view?.[name] !== "function") throw new TypeError(`view.${name} должен быть функцией.`);
  }
  if (typeof validateDraft !== "function") throw new TypeError("validateDraft должен быть функцией.");

  let tasks = [];
  let categories = null; // null — категории ещё ни разу не были получены
  let filters = {};
  let editingId = null;
  let loadController = null;
  let loadSeq = 0;
  let mutating = false;

  // Загрузка списка. Новая загрузка отменяет предыдущую, а ответ,
  // пришедший от устаревшего запроса, интерфейс не меняет.
  async function load(nextFilters = filters, { quiet = false } = {}) {
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    const seq = ++loadSeq;
    filters = { ...nextFilters };
    if (!quiet) view.setListState("loading");

    try {
      const options = { signal: controller.signal };
      const firstLoad = categories === null;
      // Пока категорий нет, повтор снова выполняет начальную загрузку.
      const result = firstLoad
        ? await api.loadInitialData({ ...filters }, options)
        : { ...(await api.getTasks({ ...filters }, options)), categories };
      if (seq !== loadSeq) return false;

      if (firstLoad) {
        categories = result.categories;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length > 0 ? "ready" : "empty");
      return true;
    } catch (error) {
      if (seq !== loadSeq) return false;
      if (error instanceof ApiError && error.kind === "aborted") return false;
      view.setListState("error", messageForError(error));
      return false;
    }
  }

  function clearForm() {
    editingId = null;
    view.setFormTask(null);
    view.showFormErrors({});
  }

  // Общая оболочка мутации: блокировка действий, запрос, повторная загрузка списка
  // с текущими фильтрами, сообщение пользователю и снятие блокировки.
  async function mutate(action, successMessage) {
    if (mutating) return false;
    mutating = true;
    view.setMutationPending(true);
    view.notify("");
    let ok = false;
    try {
      await action();
      const reloaded = await load(filters, { quiet: true });
      ok = true;
      if (reloaded) view.notify(successMessage, "success");
      else view.notify(`${successMessage} Обновить список не удалось, нажмите «Обновить».`, "error");
    } catch (error) {
      if (!(error instanceof ApiError && error.kind === "aborted")) {
        view.notify(messageForError(error), "error");
        // Запись уже отсутствует на сервере: список устарел, обновляем его.
        if (error instanceof ApiError && error.kind === "http" && error.status === 404) {
          await load(filters, { quiet: true });
        }
      }
    } finally {
      mutating = false;
      view.setMutationPending(false);
    }
    return ok;
  }

  const findTask = (id) => tasks.find((task) => task.id === id);

  return {
    start(initialFilters = {}) {
      return load(initialFilters);
    },

    applyFilters(nextFilters = {}) {
      return load(nextFilters);
    },

    refresh() {
      return load(filters);
    },

    async submit(draft) {
      const checked = validateDraft(draft, categories ?? []);
      view.showFormErrors(checked.valid ? {} : checked.errors);
      if (!checked.valid) return false;

      const isEdit = editingId !== null;
      const id = editingId;
      const ok = await mutate(
        () => (isEdit ? api.updateTask(id, checked.value) : api.createTask(checked.value)),
        isEdit ? `Задача № ${id} сохранена на сервере.` : "Задача добавлена на сервере.",
      );
      if (ok) clearForm();
      return ok;
    },

    beginEdit(id) {
      const task = findTask(id);
      if (!task) {
        view.notify("Задача не найдена в текущем списке. Обновите список.", "error");
        return;
      }
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },

    cancelEdit() {
      clearForm();
    },

    async toggleTask(id) {
      const task = findTask(id);
      if (!task) {
        view.notify("Задача не найдена в текущем списке. Обновите список.", "error");
        return false;
      }
      return mutate(
        () => api.setTaskCompleted(id, !task.completed),
        `Статус задачи № ${id} изменён.`,
      );
    },

    async deleteTask(id) {
      const ok = await mutate(() => api.deleteTask(id), `Задача № ${id} удалена.`);
      if (ok && editingId === id) clearForm();
      return ok;
    },

    async resetData() {
      const ok = await mutate(() => api.resetDemoData(), "Учебные данные восстановлены.");
      if (ok) clearForm();
      return ok;
    },

    destroy() {
      loadSeq += 1;
      loadController?.abort();
      loadController = null;
    },
  };
}
