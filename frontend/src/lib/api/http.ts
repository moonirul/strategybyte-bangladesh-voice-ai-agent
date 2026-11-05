import { env } from "@/lib/env";

/** Shape of every error body returned by the FastAPI backend. */
interface ApiErrorBody {
  error?: { code?: string; message?: string; request_id?: string; details?: unknown };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId: string | null = null,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** 5xx, 429, and network/timeouts are worth retrying; 4xx are not. */
  get retryable() {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!env.apiBaseUrl) {
    throw new ApiError("Backend API is not configured (NEXT_PUBLIC_API_BASE_URL).", 0, "api_not_configured");
  }
  const { body, token, timeoutMs = 10_000, query, headers, ...init } = opts;

  const url = new URL(env.apiBaseUrl + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    throw new ApiError(
      aborted ? "The request timed out." : "Could not reach the server.",
      0,
      aborted ? "timeout" : "network_error",
    );
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return undefined as T;

  const requestId = res.headers.get("x-request-id");
  if (!res.ok) {
    let parsed: ApiErrorBody = {};
    try {
      parsed = (await res.json()) as ApiErrorBody;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(
      parsed.error?.message ?? `Request failed (${res.status}).`,
      res.status,
      parsed.error?.code ?? "http_error",
      parsed.error?.request_id ?? requestId,
      parsed.error?.details ?? null,
    );
  }
  return (await res.json()) as T;
}
