export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const base = String(baseUrl).replace(/\/+$/, "");
  const url = new URL(`${base}/${String(path).replace(/^\/+/, "")}`);
  for (const [name, value] of Object.entries(query ?? {})) {
    // false и 0 — значимые значения; пропускаются только undefined, null и "".
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(name, String(value));
  }
  return url.toString();
}

function isJsonContentType(response) {
  const type = response.headers.get("content-type") ?? "";
  return /^application\/(?:[\w.+-]*\+)?json\b/i.test(type);
}

// Читает тело ошибочного ответа; сообщение API используется, если оно есть.
async function readErrorBody(response) {
  if (!isJsonContentType(response)) return null;
  try {
    const body = await response.json();
    return body && typeof body === "object" && body.error && typeof body.error === "object"
      ? body.error
      : null;
  } catch {
    return null;
  }
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (error) {
    throw new TypeError("baseUrl должен быть абсолютным URL.", { cause: error });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new TypeError("baseUrl должен использовать http или https.");
  }
  if (parsed.search !== "" || parsed.hash !== "") {
    throw new TypeError("baseUrl не должен содержать query или hash.");
  }
  if (typeof fetchFn !== "function") throw new TypeError("fetchFn должен быть функцией.");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("timeoutMs должен быть положительным целым числом.");
  }
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  async function requestJson(path, { query, signal, timeoutMs: ownTimeout } = {}) {
    const url = buildUrl(normalizedBase, path, query);
    const limit = ownTimeout ?? timeoutMs;
    const timeoutSignal = AbortSignal.timeout(limit);
    const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    try {
      let response;
      try {
        response = await fetchFn(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: combined,
        });
      } catch (error) {
        // Различаем причину отмены: внешний signal, тайм-аут или сеть.
        if (signal?.aborted) {
          throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause: error });
        }
        if (timeoutSignal.aborted) {
          throw new ApiError(`Превышено время ожидания ответа (${limit} мс).`, {
            kind: "timeout", url, cause: error,
          });
        }
        throw new ApiError("Не удалось выполнить сетевой запрос.", {
          kind: "network", url, cause: error,
        });
      }

      if (!response || typeof response.ok !== "boolean" || !response.headers) {
        throw new ApiError("fetch вернул не Response.", { kind: "invalid-response", url });
      }

      // Явная проверка HTTP-статуса: fetch не отклоняет промис для 4xx и 5xx.
      if (!response.ok) {
        const apiError = await readErrorBody(response);
        throw new ApiError(
          apiError?.message ?? `Сервер вернул HTTP ${response.status}.`,
          {
            kind: "http",
            status: response.status,
            code: apiError?.code ?? null,
            details: apiError?.details ?? null,
            url,
          },
        );
      }

      if (response.status === 204) return null;
      if (!isJsonContentType(response)) {
        throw new ApiError("Ответ не является JSON (Content-Type).", { kind: "invalid-response", url });
      }
      try {
        return await response.json();
      } catch (error) {
        if (signal?.aborted || timeoutSignal.aborted) throw error;
        throw new ApiError("Ответ содержит некорректный JSON.", {
          kind: "invalid-response", url, cause: error,
        });
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (signal?.aborted) throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause: error });
      if (timeoutSignal.aborted) {
        throw new ApiError(`Превышено время ожидания ответа (${limit} мс).`, {
          kind: "timeout", url, cause: error,
        });
      }
      throw new ApiError("Не удалось получить ответ.", { kind: "network", url, cause: error });
    }
  }

  return { requestJson };
}
