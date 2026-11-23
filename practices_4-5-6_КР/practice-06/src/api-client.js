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

// Соединяет абсолютный baseUrl, путь и непустые query-параметры.
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

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

function isJsonContentType(response) {
  const type = response.headers.get("content-type") ?? "";
  return /^application\/(?:[\w.+-]*\+)?json\b/i.test(type);
}

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

// requestJson(path, { method, query, body, signal, timeoutMs } = {})
// поддерживает GET, POST, PATCH и DELETE; ответ 204 преобразуется в null.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
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

  async function requestJson(path, {
    method = "GET", query, body, signal, timeoutMs: ownTimeout,
  } = {}) {
    const verb = String(method).toUpperCase();
    if (!ALLOWED_METHODS.has(verb)) throw new TypeError(`Метод ${method} не поддерживается.`);
    if (verb === "GET" && body !== undefined) throw new TypeError("У GET-запроса не может быть body.");

    const url = buildUrl(normalizedBase, path, query);
    const limit = ownTimeout ?? timeoutMs;
    const timeoutSignal = AbortSignal.timeout(limit);
    const combined = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    const headers = { Accept: "application/json" };
    const init = { method: verb, headers, signal: combined };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const fail = (error, fallbackKind = "network", fallbackMessage = "Не удалось выполнить сетевой запрос.") => {
      if (error instanceof ApiError) return error;
      if (signal?.aborted) return new ApiError("Запрос отменён.", { kind: "aborted", url, cause: error });
      if (timeoutSignal.aborted) {
        return new ApiError(`Превышено время ожидания ответа (${limit} мс).`, {
          kind: "timeout", url, cause: error,
        });
      }
      return new ApiError(fallbackMessage, { kind: fallbackKind, url, cause: error });
    };

    let response;
    try {
      response = await fetchFn(url, init);
    } catch (error) {
      throw fail(error);
    }

    if (!response || typeof response.ok !== "boolean" || !response.headers) {
      throw new ApiError("fetch вернул не Response.", { kind: "invalid-response", url });
    }

    // HTTP-ошибка проверяется раньше Content-Type успешного ответа.
    if (!response.ok) {
      const apiError = await readErrorBody(response);
      throw new ApiError(apiError?.message ?? `Сервер вернул HTTP ${response.status}.`, {
        kind: "http",
        status: response.status,
        code: apiError?.code ?? null,
        details: apiError?.details ?? null,
        url,
      });
    }

    if (response.status === 204) return null;
    if (!isJsonContentType(response)) {
      throw new ApiError("Ответ не является JSON (Content-Type).", { kind: "invalid-response", url });
    }
    try {
      return await response.json();
    } catch (error) {
      if (signal?.aborted || timeoutSignal.aborted) throw fail(error);
      throw new ApiError("Ответ содержит некорректный JSON.", {
        kind: "invalid-response", url, cause: error,
      });
    }
  }

  return { requestJson };
}
