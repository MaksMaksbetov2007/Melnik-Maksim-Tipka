// Задание 1. Сводка выполнения задач
const MAX_TASKS = 1000;

function getProgressSummary(totalTasks, completedTasks) {
  // Строки не преобразуем: принимаем только настоящие целые числа
  if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
    return 'Ошибка: значения должны быть целыми числами';
  }
  if (totalTasks < 0 || totalTasks > MAX_TASKS) {
    return `Ошибка: totalTasks должно быть от 0 до ${MAX_TASKS}`;
  }
  if (completedTasks < 0 || completedTasks > totalTasks) {
    return 'Ошибка: completedTasks должно быть от 0 до totalTasks';
  }
  if (totalTasks === 0) {
    return 'Задач пока нет';
  }

  const remaining = totalTasks - completedTasks;
  const percent = ((completedTasks / totalTasks) * 100).toFixed(1);

  let status = 'В работе';
  if (completedTasks === 0) status = 'Не начато';
  else if (completedTasks === totalTasks) status = 'Завершено';

  return `Осталось: ${remaining}, прогресс: ${percent}%, статус: «${status}»`;
}

// Проверочные запуски (выполняются только при запуске через node)
if (typeof require !== 'undefined' && require.main === module) {
  const checks = [[12, 5], [0, 0], [5, 6]];
  for (const [total, completed] of checks) {
    console.log(`(${total}, ${completed}) → ${getProgressSummary(total, completed)}`);
  }
}

if (typeof module !== 'undefined') module.exports = { getProgressSummary };
