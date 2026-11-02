import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";
import { getPrioritySummary } from "./task-extra.js";

// Выводит id задач и сводку. Сама сводка считается в task-service.js.
function printStats(label, tasks) {
  // Деструктуризация: из объекта сводки берём четыре поля.
  const { total, completed, pending, progress } = getTaskStats(tasks);
  const ids = tasks.map((task) => task.id);

  console.log(`\n[${label}]`);
  console.log("  id:", ids);
  console.log(`  Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`);
  if (total === 0) {
    console.log("  Задач пока нет");
  } else {
    // toFixed применяется только при выводе, сам progress остаётся числом.
    console.log(`  Прогресс: ${progress.toFixed(1)}%`);
  }
}

// ==================== ОБЩИЙ СЦЕНАРИЙ ====================

console.log("========== ОБЩИЙ СЦЕНАРИЙ (demoTasks) ==========");

// Запоминаем исходные данные строкой, чтобы в конце сравнить.
const demoBefore = JSON.stringify(demoTasks);

let currentTasks = demoTasks;
let result;

console.table(currentTasks);
console.log("Названия:", getTaskTitles(currentTasks));
console.log("Невыполненные id:", getPendingTasks(currentTasks).map((task) => task.id));
printStats("Исходный набор", currentTasks);

// Шаг 1. Добавить задачу id 20.
result = addTask(currentTasks, 20, "Добавить проверку", "high");
if (result.ok) {
  currentTasks = result.tasks;
  printStats("После добавления id 20", currentTasks);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 2. Отметить выполненной задачу id 4.
result = setTaskCompleted(currentTasks, 4, true);
if (result.ok) {
  currentTasks = result.tasks;
  printStats("После выполнения id 4", currentTasks);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 3. Переименовать задачу id 10.
result = renameTask(currentTasks, 10, "Подготовить инструкцию запуска");
if (result.ok) {
  currentTasks = result.tasks;
  printStats("После переименования id 10", currentTasks);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 4. Удалить задачу id 7.
result = removeTask(currentTasks, 7);
if (result.ok) {
  currentTasks = result.tasks;
  printStats("После удаления id 7", currentTasks);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 5. Ошибки: при result.ok === false состояние НЕ заменяется.
console.log("\n--- Проверка ошибок ---");

result = addTask(currentTasks, 4, "Дубликат");
console.log("Повторный id 4:", result.ok ? "успех" : `Ошибка: ${result.error}`);

result = setTaskCompleted(currentTasks, 20, "true");
console.log('Статус строкой "true":', result.ok ? "успех" : `Ошибка: ${result.error}`);

result = removeTask(currentTasks, 777);
console.log("Удаление id 777:", result.ok ? "успех" : `Ошибка: ${result.error}`);

console.log("Состояние после ошибок, id:", currentTasks.map((task) => task.id));

// Итог.
console.log("\nИтоговые задачи:");
console.table(currentTasks);
console.log("Невыполненные id:", getPendingTasks(currentTasks).map((task) => task.id));
console.log("Задача id 10:", findTaskById(currentTasks, 10).title);
console.log("demoTasks не изменён:", JSON.stringify(demoTasks) === demoBefore);

// ==================== ИНДИВИДУАЛЬНЫЙ ВАРИАНТ ====================

console.log(`\n========== ВАРИАНТ ${variantNumber} (variantTasks) ==========`);

const variantBefore = JSON.stringify(variantTasks);
let variantState = variantTasks;

console.table(variantState);
printStats("Исходный набор варианта", variantState);

// Шаг 1. Добавить задачу id 80 (приоритет low по таблице варианта 6).
result = addTask(variantState, 80, "Проверить контрастность текста", "low");
if (result.ok) {
  variantState = result.tasks;
  printStats("После добавления id 80", variantState);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 2. Отметить выполненной id 11 (она уже выполнена — операция всё равно успешна).
result = setTaskCompleted(variantState, 11, true);
if (result.ok) {
  variantState = result.tasks;
  printStats("После выполнения id 11", variantState);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 3. Переименовать id 23.
result = renameTask(variantState, 23, "Проверить работу всех кнопок и ссылок");
if (result.ok) {
  variantState = result.tasks;
  printStats("После переименования id 23", variantState);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 4. Удалить id 37.
result = removeTask(variantState, 37);
if (result.ok) {
  variantState = result.tasks;
  printStats("После удаления id 37", variantState);
} else {
  console.log(`Ошибка: ${result.error}`);
}

// Шаг 5. Повторно добавить id 80 — ожидается ошибка, список не меняется.
result = addTask(variantState, 80, "Повтор");
console.log("\nПовторное добавление id 80:", result.ok ? "успех" : `Ошибка: ${result.error}`);
console.log("Состояние после ошибки, id:", variantState.map((task) => task.id));

console.log("\nИтоговые задачи варианта:");
console.table(variantState);
console.log("Задача id 23 после переименования:", findTaskById(variantState, 23));
console.log("variantTasks не изменён:", JSON.stringify(variantTasks) === variantBefore);

// ==================== РАСШИРЕНИЕ: сводка по приоритетам ====================

console.log("\n========== РАСШИРЕНИЕ: сводка по приоритетам ==========");
console.log("demoTasks:", getPrioritySummary(demoTasks));
console.log("Итог общего сценария:", getPrioritySummary(currentTasks));
console.log("Итог варианта:", getPrioritySummary(variantState));
console.log("Пустой список:", getPrioritySummary([]));
