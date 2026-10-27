import { ApiError } from "@/lib/ApiError";
import { env } from "@/lib/env";
import { tokenStorage } from "@/lib/tokenStorage";

export const REQUEST_TIMEOUT_MS = 15_000;

type ApiPath = `/${string}`;

type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  auth?: boolean;
};

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;
let lastReportedToken: string | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
  lastReportedToken = null;
}

function reportUnauthorized(sentToken: string | null): void {
  if (!sentToken) return;
  if (sentToken !== tokenStorage.get()) return;
  if (sentToken === lastReportedToken) return;

  lastReportedToken = sentToken;
  unauthorizedHandler?.();
}

function buildUrl(path: ApiPath): string {
  return new URL(`${env.VITE_API_URL}${path}`, window.location.origin).toString();
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function request<T>(
  method: Method,
  path: ApiPath,
  body: unknown,
  { signal, timeoutMs = REQUEST_TIMEOUT_MS, auth = true }: RequestOptions = {},
): Promise<T> {
  const token = auth ? tokenStorage.get() : null;

  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

  let response: Response;
  let data: unknown;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combinedSignal,
    });
    data = await readBody(response);
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeoutSignal.aborted) throw ApiError.timeout(error);
    throw ApiError.network(error);
  }

  if (!response.ok) {
    if (response.status === 401) reportUnauthorized(token);
    throw ApiError.fromResponse(response.status, data, response.headers.get("Retry-After"));
  }

  return data as T;
}

export const http = {
  get: <T>(path: ApiPath, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: ApiPath, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  patch: <T>(path: ApiPath, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T = void>(path: ApiPath, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
};
