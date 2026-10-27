import { HttpResponse, delay } from "msw";
import type { z } from "zod";
import type { ServerErrorCode } from "@/lib/ApiError";
import { findUserBySessionToken } from "@/mocks/authStore";
import { LATENCY, MAGIC_EMAILS } from "@/mocks/config";
import type { MockUser } from "@/mocks/db";

const STATUS_TEXT: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  429: "Too Many Requests",
  500: "Internal Server Error",
};

export function errorResponse(
  status: number,
  message: string | string[],
  options: { code?: ServerErrorCode; retryAfterSeconds?: number } = {},
) {
  const { code, retryAfterSeconds } = options;
  return HttpResponse.json(
    { statusCode: status, message, error: STATUS_TEXT[status] ?? "Error", ...(code && { code }) },
    {
      status,
      headers:
        retryAfterSeconds === undefined ? undefined : { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

export function unauthorizedResponse() {
  return errorResponse(401, "Unauthorized");
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization");
  const match = header?.match(/^Bearer (.+)$/);
  return match?.[1] ?? null;
}

type ParsedBody<T> = { ok: true; data: T } | { ok: false; response: Response };

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParsedBody<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: errorResponse(400, ["Request body must be valid JSON"]) };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((issue) =>
      issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    );
    return { ok: false, response: errorResponse(400, messages) };
  }
  return { ok: true, data: result.data };
}

export async function simulateLatency({ slow = false }: { slow?: boolean } = {}) {
  const ms = slow
    ? LATENCY.slowMs
    : LATENCY.minMs + Math.random() * (LATENCY.maxMs - LATENCY.minMs);
  if (ms > 0) await delay(ms);
}

export async function authenticate(request: Request): Promise<MockUser | undefined> {
  const token = readBearerToken(request);
  const user = token ? await findUserBySessionToken(token) : undefined;
  await simulateLatency({ slow: user?.email === MAGIC_EMAILS.slow });
  return user;
}
