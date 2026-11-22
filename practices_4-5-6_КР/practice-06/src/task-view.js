const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function makeButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.append(makeSpan("action-label", label));
  return button;
}

function makeSpan(className, text) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

export function createTaskElement(task, category) {
  const item = document.createElement("li");
  item.className = "task-card";
  item.dataset.taskId = String(task.id);
  item.classList.toggle("is-completed", task.completed);

  // Пользовательские данные добавляются только через textContent.
  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("p");
  meta.className = "task-meta";
  meta.append(
    makeSpan("task-status", task.completed ? "Выполнена" : "В работе"),
    makeSpan("task-priority", PRIORITY_LABELS[task.priority] ?? task.priority),
    makeSpan("task-category", category?.name ?? "Категория не найдена"),
  );

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const toggle = makeButton("toggle", task.completed ? "Вернуть в работу" : "Выполнена");
  toggle.setAttribute("aria-pressed", String(task.completed));
  actions.append(toggle, makeButton("edit", "Изменить"), makeButton("delete", "Удалить"));

  item.append(title, meta, actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
