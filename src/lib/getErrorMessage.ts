import { ApiError, type ApiErrorCode } from "@/lib/ApiError";
import { messages } from "@/lib/messages";

const MESSAGE_BY_CODE: Record<ApiErrorCode, string> = {
  NETWORK_ERROR: messages.errors.network,
  TIMEOUT: messages.errors.timeout,
  RATE_LIMITED: messages.errors.rateLimited,
  INVALID_CREDENTIALS: messages.auth.invalidCredentials,
  EMAIL_NOT_VERIFIED: messages.auth.emailNotVerified,
  EMAIL_ALREADY_REGISTERED: messages.auth.emailTaken,
  EMAIL_ALREADY_VERIFIED: messages.auth.alreadyVerified,
  TOKEN_INVALID: messages.auth.linkInvalid,
  TOKEN_EXPIRED: messages.auth.linkExpired,
};

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return messages.errors.server;

  if (error.code === "RATE_LIMITED" || error.status === 429) {
    return error.retryAfter !== undefined && error.retryAfter > 0
      ? messages.errors.rateLimitedFor(error.retryAfter)
      : messages.errors.rateLimited;
  }

  if (error.code) return MESSAGE_BY_CODE[error.code];

  if (error.status === 401) return messages.auth.sessionExpired;

  return messages.errors.server;
}
