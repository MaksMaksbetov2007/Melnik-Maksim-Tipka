// Дополнительное задание, вариант Б: сводка по приоритетам.
// Контракт: tasks — корректный массив модели ПР2.
// Результат: новый объект, в котором ВСЕГДА есть все три приоритета,
// даже если задач с каким-то приоритетом нет. Входные данные не изменяются.

export function getPrioritySummary(tasks) {
  const summary = {
    low: { total: 0, pending: 0 },
    medium: { total: 0, pending: 0 },
    high: { total: 0, pending: 0 },
  };

  for (const task of tasks) {
    // Меняется только локальный объект summary, созданный внутри функции.
    const group = summary[task.priority];
    group.total += 1;
    if (task.completed === false) {
      group.pending += 1;
    }
  }

  return summary;
}
