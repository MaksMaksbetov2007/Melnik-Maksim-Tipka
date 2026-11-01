const { demoTasks, setTaskCompleted } = require('./tasks.js');

console.log('=== Задание 3: setTaskCompleted ===');
const result = setTaskCompleted(demoTasks, 4, true);
const newTask = result.tasks.find((t) => t.id === 4);
const oldTask = demoTasks.find((t) => t.id === 4);
console.log('setTaskCompleted(demoTasks, 4, true) → ok:', result.ok);
console.log('  новая запись id 4, completed:', newTask.completed);
console.log('  исходная запись id 4, completed:', oldTask.completed);
console.log('  это новый объект:', newTask !== oldTask);

const failed = setTaskCompleted(demoTasks, 777, true);
console.log('setTaskCompleted(demoTasks, 777, true) →', failed);
console.log('  исходный массив не изменился:', demoTasks.map((t) => `${t.id}:${t.completed}`).join(', '));
