import { z } from "zod";

const SERVER_ERROR_CODES = [
  "EMAIL_ALREADY_REGISTERED",
  "INVALID_CREDENTIALS",
  "EMAIL_NOT_VERIFIED",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "EMAIL_ALREADY_VERIFIED",
  "RATE_LIMITED",
] as const;

export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number];

export type ClientErrorCode = "NETWORK_ERROR" | "TIMEOUT";

export type ApiErrorCode = ServerErrorCode | ClientErrorCode;

export function isServerErrorCode(value: unknown): value is ServerErrorCode {
  return SERVER_ERROR_CODES.includes(value as ServerErrorCode);
}

type ApiErrorOptions = {
  status: number;
  message: string;
  code?: ApiErrorCode;
  details?: string[];
  retryAfter?: number;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  readonly details?: string[];
  readonly retryAfter?: number;

  constructor({ status, message, code, details, retryAfter, cause }: ApiErrorOptions) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }

  static network(cause?: unknown): ApiError {
    return new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Network request failed",
      cause,
    });
  }

  static timeout(cause?: unknown): ApiError {
    return new ApiError({ status: 0, code: "TIMEOUT", message: "Request timed out", cause });
  }

  static fromResponse(status: number, body: unknown, retryAfter: string | null = null): ApiError {
    const parsed = errorBodySchema.safeParse(body);
    const { message, code } = parsed.success ? parsed.data : {};

    const details = Array.isArray(message) ? message : undefined;
    const text = Array.isArray(message) ? message.join("; ") : message;

    return new ApiError({
      status,
      message: text || `Request failed with status ${status}`,
      code: isServerErrorCode(code) ? code : undefined,
      details,
      retryAfter: parseRetryAfter(retryAfter),
    });
  }
}

const errorBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
  code: z.string().optional(),
});

function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const seconds = Number(value);
  return Number.isInteger(seconds) && seconds >= 0 ? seconds : undefined;
}
