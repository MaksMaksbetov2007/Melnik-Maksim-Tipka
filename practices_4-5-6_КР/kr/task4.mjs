import { createApiClient } from "../practice-05/src/api-client.js";
import { createTaskApi } from "../practice-05/src/task-api.js";

const api = createTaskApi(createApiClient({ baseUrl: "http://127.0.0.1:5505/api", timeoutMs: 2000 }));

try {
  await api.getTaskById(999);
} catch (error) {
  console.log("kind:", error.kind);
  console.log("status:", error.status);
}
