const { demoTasks, getPendingTasks } = require('./tasks.js');

console.log('=== Задание 2: getPendingTasks ===');
console.log('getPendingTasks(demoTasks) → id:', getPendingTasks(demoTasks).map((t) => t.id));
console.log('getPendingTasks([]) →', getPendingTasks([]));

