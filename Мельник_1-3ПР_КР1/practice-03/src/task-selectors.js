// Новый модуль ПР3. Вход: корректный массив задач и фильтр all/pending/completed.
// Результат: новый массив, исходный порядок и объекты сохраняются.
// Модуль не изменяет входные данные и не работает с DOM.

export function getVisibleTasks(tasks, filter = "all") {
  if (filter === "pending") {
    return tasks.filter((task) => task.completed === false);
  }
  if (filter === "completed") {
    return tasks.filter((task) => task.completed === true);
  }
  // "all": новый массив с теми же объектами.
  return [...tasks];
}

// Дополнительное задание (вариант А): отбор по приоритету.
// "any" — любой приоритет, иначе только задачи с указанным приоритетом.
export function filterByPriority(tasks, priority = "any") {
  if (priority === "any") {
    return [...tasks];
  }
  return tasks.filter((task) => task.priority === priority);
}
