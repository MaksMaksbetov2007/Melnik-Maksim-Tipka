// Состояние приложения: копия demoTasks и текущий фильтр
const state = { tasks: demoTasks, filter: 'all' };

const listEl = document.getElementById('task-list');
const summaryEl = document.getElementById('summary');
const filterButtons = document.querySelectorAll('.filters button');

function getVisibleTasks() {
  if (state.filter === 'pending') return getPendingTasks(state.tasks);
  if (state.filter === 'done') return state.tasks.filter((t) => t.completed === true);
  return state.tasks;
}

function renderSummary() {
  const total = state.tasks.length;
  const done = state.tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? '0.0' : ((done / total) * 100).toFixed(1);
  summaryEl.textContent =
    `Всего: ${total} · Выполнено: ${done} · Осталось: ${total - done} · Прогресс: ${percent}%`;
}

function render() {
  listEl.innerHTML = '';
  for (const task of getVisibleTasks()) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.className = task.completed ? 'done' : '';
    li.innerHTML =
      `<label><input type="checkbox" ${task.completed ? 'checked' : ''}> ` +
      `<span>#${task.id} ${task.title}</span></label>`;
    listEl.appendChild(li);
  }
  filterButtons.forEach((btn) =>
    btn.classList.toggle('active', btn.dataset.filter === state.filter)
  );
  renderSummary();
}

// Переключение статуса задачи (задание 4)
function handleToggle(event) {
  if (!event.target.matches('input[type="checkbox"]')) return;
  const id = Number(event.target.closest('li').dataset.id); // id из data-id строки
  const result = setTaskCompleted(state.tasks, id, event.target.checked);
  if (result.ok) {
    state.tasks = result.tasks; // новый массив вместо старого
  }
  render();                     // перерисовка списка и сводки
}

listEl.addEventListener('change', handleToggle);

filterButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    render();
  })
);

render();
