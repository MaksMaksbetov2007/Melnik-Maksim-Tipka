"use strict";

// Вариант 6
const totalTasks = 18;
const completedTasks = 6;
const dailyLimit = 5;

const MAX_TASKS = 1000;
const MAX_LIMIT = 1000;

// Все проверки выполняются ДО цикла, поэтому при неверных данных
// цикл не запускается и не может стать бесконечным (например, при dailyLimit = 0).
if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
  console.log("Ошибка: количество задач должно быть целым числом");
} else if (totalTasks < 0 || completedTasks < 0) {
  console.log("Ошибка: количество задач не может быть отрицательным");
} else if (totalTasks > MAX_TASKS) {
  console.log(`Ошибка: общее количество задач не может превышать ${MAX_TASKS}`);
} else if (completedTasks > totalTasks) {
  console.log("Ошибка: некорректное число выполненных задач (больше общего количества)");
} else if (!Number.isInteger(dailyLimit)) {
  console.log("Ошибка: дневная норма должна быть целым числом (не строкой и не дробью)");
} else if (dailyLimit < 1 || dailyLimit > MAX_LIMIT) {
  console.log(`Ошибка: дневная норма должна быть от 1 до ${MAX_LIMIT}`);
} else {
  let remainingTasks = totalTasks - completedTasks;
  let day = 0;

  console.log(`Осталось задач: ${remainingTasks}`);

  if (remainingTasks === 0) {
    console.log("Все задачи уже выполнены");
  }

  // На каждой итерации остаток строго уменьшается минимум на 1,
  // так как dailyLimit >= 1 и remainingTasks > 0 — цикл обязательно завершится.
  while (remainingTasks > 0) {
    day += 1;
    // В последний день нельзя выполнить больше, чем осталось.
    const doneToday = Math.min(dailyLimit, remainingTasks);
    remainingTasks -= doneToday;
    console.log(`День ${day}: выполнено ${doneToday}, осталось ${remainingTasks}`);
  }

  console.log(`Потребуется дней: ${day}`);
}
