"use strict";

// Входные данные приходят строками.
const totalText = "18";
const completedText = "6";

const MAX_TASKS = 1000;

// Шаг 1. Убедиться, что переданы именно строки (null и undefined отсеиваются здесь,
// поэтому вызов trim() ниже не приведёт к исключению).
if (typeof totalText !== "string" || typeof completedText !== "string") {
  console.log("Ошибка: входные данные должны быть строками");
} else {
  // Шаг 2. Удалить пробелы по краям.
  const totalTrimmed = totalText.trim();
  const completedTrimmed = completedText.trim();

  // Шаг 3. Пустую строку и строку из пробелов отклоняем ДО Number(),
  // потому что Number("") и Number("   ") дают 0, а не ошибку.
  if (totalTrimmed === "" || completedTrimmed === "") {
    console.log("Ошибка: пустой ввод");
  } else {
    // Шаг 4. Преобразование и правила задания 3.
    const totalTasks = Number(totalTrimmed);
    const completedTasks = Number(completedTrimmed);

    if (!Number.isInteger(totalTasks) || !Number.isInteger(completedTasks)) {
      console.log("Ошибка: значение не является целым числом (например, \"abc\", \"2.5\" или \"Infinity\")");
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
  }
}
