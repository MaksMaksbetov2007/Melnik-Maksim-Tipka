import { demoTasks, variantTasks, variantNumber } from "./data.js";
import { findTaskById, setTaskCompleted, removeTask } from "./task-service.js";
import { getVisibleTasks, filterByPriority } from "./task-selectors.js";
import { renderTaskList, renderSummary, renderEmptyState } from "./task-view.js";

const elements = {
  list: document.querySelector("#task-list"),
  filters: document.querySelector("#task-filters"),
  priorityFilters: document.querySelector("#priority-filters"),
  summary: document.querySelector("#task-summary"),
  empty: document.querySelector("#empty-message"),
  message: document.querySelector("#operation-message"),
  datasetLabel: document.querySelector("#dataset-label"),
};

// Готовая служебная часть: ?dataset=variant включает данные своего варианта.
const isVariant = new URLSearchParams(window.location.search).get("dataset") === "variant";
const initialTasks = isVariant ? variantTasks : demoTasks;

// Состояние приложения:
// currentTasks    — ВСЕ задачи (фильтр их никогда не перезаписывает);
// currentFilter   — фильтр по статусу: "all", "pending" или "completed";
// currentPriority — фильтр по приоритету (доп. задание): "any", "low", "medium" или "high".
let currentTasks = initialTasks.map((task) => ({ ...task }));
let currentFilter = "all";
let currentPriority = "any";

elements.datasetLabel.textContent = isVariant
  ? `Индивидуальный вариант: ${variantNumber ?? "не указан"}`
  : "Общий контрольный набор";

// Перерисовка всего интерфейса по текущему состоянию.
// Функция ничего не меняет в данных и не добавляет обработчики.
function renderApp() {
  // 1. Видимая выборка: сначала фильтр по статусу, потом по приоритету.
  const byStatus = getVisibleTasks(currentTasks, currentFilter);
  const visibleTasks = filterByPriority(byStatus, currentPriority);

  // 2. Список, сводка (по ПОЛНОМУ массиву) и пустое состояние.
  renderTaskList(elements.list, visibleTasks);
  renderSummary(elements.summary, currentTasks, visibleTasks.length);
  renderEmptyState(elements.empty, currentTasks.length, visibleTasks.length);

  // 3. Отметить активную кнопку фильтра по статусу.
  const statusButtons = elements.filters.querySelectorAll("button[data-filter]");
  for (const button of statusButtons) {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  // 4. Отметить активную кнопку фильтра по приоритету.
  const priorityButtons = elements.priorityFilters.querySelectorAll("button[data-priority]");
  for (const button of priorityButtons) {
    const isActive = button.dataset.priority === currentPriority;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

// Один обработчик на весь список (делегирование). Назначается один раз.
function handleTaskListClick(event) {
  // 1. Клик мог быть по вложенному span — ищем ближайшую кнопку с data-action.
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-action]");
  if (button === null || !elements.list.contains(button)) return;

  // 2. Обрабатываем только два известных действия.
  const action = button.dataset.action;
  if (action !== "toggle" && action !== "delete") return;

  // 3. Читаем id карточки. В dataset это строка, поэтому переводим в число.
  //    Number("4abc") даёт NaN, поэтому такой id не пройдёт проверку.
  const card = button.closest("li[data-task-id]");
  if (card === null) return;
  const rawId = card.dataset.taskId;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    elements.message.textContent = `Ошибка: некорректный идентификатор задачи «${rawId}»`;
    return;
  }

  // 4. Вызываем функцию из ПР2.
  let result;
  if (action === "toggle") {
    // Текущий статус берём из массива данных, а не из кнопки.
    const task = findTaskById(currentTasks, id);
    if (task === undefined) {
      elements.message.textContent = `Ошибка: задача с id ${id} не найдена`;
      return;
    }
    result = setTaskCompleted(currentTasks, id, !task.completed);
  } else {
    result = removeTask(currentTasks, id);
  }

  // 5. При ошибке данные не меняем. При успехе сохраняем новый массив и перерисовываем.
  if (!result.ok) {
    elements.message.textContent = `Ошибка: ${result.error}`;
    return;
  }
  currentTasks = result.tasks;
  elements.message.textContent = "";
  renderApp();
  restoreTaskFocus(id, action);
}

// Обработчик кнопок фильтра по статусу.
function handleFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-filter]");
  if (button === null || !elements.filters.contains(button)) return;

  const filter = button.dataset.filter;
  // Неизвестное значение игнорируем.
  if (filter !== "all" && filter !== "pending" && filter !== "completed") return;

  // Меняется только режим отображения, данные остаются прежними.
  currentFilter = filter;
  elements.message.textContent = "";
  renderApp();
}

// Доп. задание: обработчик кнопок фильтра по приоритету.
function handlePriorityFilterClick(event) {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest("button[data-priority]");
  if (button === null || !elements.priorityFilters.contains(button)) return;

  const priority = button.dataset.priority;
  if (priority !== "any" && priority !== "low" && priority !== "medium" && priority !== "high") return;

  currentPriority = priority;
  elements.message.textContent = "";
  renderApp();
}

// Готовая вспомогательная функция из заготовки. Возвращает клавиатурный фокус
// на ту же кнопку после перерисовки; если карточки больше нет — на активный фильтр.
function restoreTaskFocus(id, action) {
  const actionButton = elements.list.querySelector(
    `[data-task-id="${id}"] button[data-action="${action}"]`,
  );
  const filterButton = elements.filters.querySelector(`[data-filter="${currentFilter}"]`);
  (actionButton ?? filterButton)?.focus();
}

// Подписки выполняются один раз. Эти контейнеры не заменяются при перерисовке.
elements.list.addEventListener("click", handleTaskListClick);
elements.filters.addEventListener("click", handleFilterClick);
elements.priorityFilters.addEventListener("click", handlePriorityFilterClick);

// try/catch здесь — готовая диагностика старта из заготовки.
try {
  renderApp();
} catch (error) {
  elements.message.textContent = `Ошибка запуска: ${error.message}`;
  console.error(error);
}
