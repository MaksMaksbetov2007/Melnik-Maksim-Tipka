import { createApiClient } from "../practice-05/src/api-client.js";
import { createTaskApi } from "../practice-05/src/task-api.js";

// Настройка клиента: адрес API ПР5 и тайм-аут запроса.
const client = createApiClient({ baseUrl: "http://127.0.0.1:5505/api", timeoutMs: 2000 });
const api = createTaskApi(client);

// Проверочный вызов: фильтры уходят серверу в query-параметрах.
const { tasks, meta } = await api.getTasks({ completed: false, priority: "high" });
console.log("id:", tasks.map((task) => task.id));
console.log("meta.total:", meta.total);
