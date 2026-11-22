export function getVisibleTasks(tasks, filter = "all") {
  if (filter === "pending") return tasks.filter((task) => !task.completed);
  if (filter === "completed") return tasks.filter((task) => task.completed);
  return [...tasks];
}
