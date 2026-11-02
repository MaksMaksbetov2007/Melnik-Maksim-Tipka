// Общий контрольный набор. Для своего варианта ниже предусмотрен отдельный массив.
// Идентификатор задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Вариант 6: «Проверка пользовательского интерфейса».
// K = 5: выполнены первые пять задач, шестая — нет. Начальный прогресс 5/6 = 83.3%.
export const variantNumber = 6;
export const variantTasks = [
  { id: 11, title: "Проверить отображение главной страницы", completed: true, priority: "high" },
  { id: 23, title: "Проверить работу кнопок", completed: true, priority: "medium" },
  { id: 37, title: "Проверить адаптивность на телефоне", completed: true, priority: "low" },
  { id: 41, title: "Проверить управление с клавиатуры", completed: true, priority: "high" },
  { id: 58, title: "Проверить сообщения об ошибках", completed: true, priority: "medium" },
  { id: 64, title: "Составить список найденных дефектов", completed: false, priority: "low" },
];
