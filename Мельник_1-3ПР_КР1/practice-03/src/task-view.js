import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// innerHTML не используется: все значения назначаются через textContent,
// поэтому название вроде "<strong>…</strong>" выводится как обычный текст.

const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

// Вспомогательная функция: элемент с классом и текстом.
function createTextElement(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

// Кнопка действия: <button type="button" data-action="..."><span class="action-label">…</span></button>
function createActionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.append(createTextElement("span", "action-label", label));
  return button;
}

export function createTaskElement(task) {
  const card = document.createElement("li");
  card.classList.add("task-card");
  card.classList.toggle("is-completed", task.completed);
  // В dataset значение хранится строкой: "4". При чтении его нужно преобразовать в число.
  card.dataset.taskId = String(task.id);

  const title = createTextElement("h3", "task-title", task.title);

  const meta = document.createElement("p");
  meta.className = "task-meta";
  meta.append(
    createTextElement("span", "task-status", task.completed ? "Выполнена" : "В работе"),
    createTextElement("span", "task-priority", PRIORITY_LABELS[task.priority]),
  );

  const toggleButton = createActionButton("toggle", "Выполнена");
  // Подпись постоянная, а состояние передаётся через aria-pressed.
  toggleButton.setAttribute("aria-pressed", String(task.completed));

  const deleteButton = createActionButton("delete", "Удалить");

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(toggleButton, deleteButton);

  card.append(title, meta, actions);
  return card;
}

export function renderTaskList(listElement, tasks) {
  // Сам listElement не заменяется (на нём делегированный обработчик),
  // заменяются только дочерние карточки — поэтому повторный вызов не дублирует их.
  const cards = tasks.map((task) => createTaskElement(task));
  listElement.replaceChildren(...cards);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  // tasks — ВЕСЬ текущий массив; фильтр на сводку не влияет.
  const { total, completed, pending, progress } = getTaskStats(tasks);

  summaryElement.querySelector('[data-stat="total"]').textContent = total;
  summaryElement.querySelector('[data-stat="completed"]').textContent = completed;
  summaryElement.querySelector('[data-stat="pending"]').textContent = pending;
  summaryElement.querySelector('[data-stat="progress"]').textContent = `${progress.toFixed(1)}%`;
  summaryElement.querySelector('[data-stat="visible"]').textContent = visibleCount;
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
  } else if (total === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
  } else {
    messageElement.textContent = "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
  }
}
