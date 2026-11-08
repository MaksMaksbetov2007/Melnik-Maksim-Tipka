"use strict";

// Вариант 6
const totalTasks = 18;
const completedTasks = 6;

const MAX_TASKS = 1000;

// 1. Проверка типа и целочисленности. Number.isInteger не преобразует строки,
//    поэтому "5", NaN, Infinity и 2.5 будут отклонены.
// 2. Проверка диапазонов.
// 3. Отдельная ветка для «задач нет», чтобы не делить на ноль.
// 4. Расчёт и вывод.
if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом (не строкой, не NaN и не дробью)");
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: количество задач не может быть отрицательным");
} else if (totalTasks > MAX_TASKS) {
  console.log(`Ошибка: общее количество задач не может превышать ${MAX_TASKS}`);
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: выполнено больше задач, чем существует");
} else if (totalTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remainingTasks = totalTasks - completedTasks;
  const percentage = (completedTasks / totalTasks) * 100;

  // Статус определяется по исходным количествам, а не по округлённому проценту.
  let status;
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks < totalTasks) {
    status = "В работе";
  } else {
    status = "Завершено";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${percentage.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}
