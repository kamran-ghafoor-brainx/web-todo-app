import { ApiError, type ApiErrorCode } from "@/lib/ApiError";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { messages } from "@/lib/messages";

describe("getErrorMessage", () => {
  it.each<[ApiErrorCode, number, string]>([
    ["NETWORK_ERROR", 0, messages.errors.network],
    ["TIMEOUT", 0, messages.errors.timeout],
    ["INVALID_CREDENTIALS", 401, messages.auth.invalidCredentials],
    ["EMAIL_NOT_VERIFIED", 403, messages.auth.emailNotVerified],
    ["EMAIL_ALREADY_REGISTERED", 409, messages.auth.emailTaken],
    ["EMAIL_ALREADY_VERIFIED", 409, messages.auth.alreadyVerified],
    ["TOKEN_INVALID", 400, messages.auth.linkInvalid],
    ["TOKEN_EXPIRED", 400, messages.auth.linkExpired],
  ])("maps the %s code to its message", (code, status, expected) => {
    expect(getErrorMessage(new ApiError({ status, code, message: "technical" }))).toBe(expected);
  });

  describe("too many attempts (429, EC-10)", () => {
    it.each([
      [1, "Too many attempts. Please try again in 1 second."],
      [45, "Too many attempts. Please try again in 45 seconds."],
      [60, "Too many attempts. Please try again in 1 minute."],
      [61, "Too many attempts. Please try again in 2 minutes."],
    ])("includes a Retry-After of %i seconds as the wait time", (retryAfter, expected) => {
      const error = new ApiError({ status: 429, code: "RATE_LIMITED", message: "x", retryAfter });
      expect(getErrorMessage(error)).toBe(expected);
    });

    it("uses the standard message when the server gave no wait time", () => {
      const error = new ApiError({ status: 429, code: "RATE_LIMITED", message: "x" });
      expect(getErrorMessage(error)).toBe(messages.errors.rateLimited);
    });

    it("recognises a 429 even without the code", () => {
      expect(getErrorMessage(new ApiError({ status: 429, message: "x" }))).toBe(
        messages.errors.rateLimited,
      );
    });
  });

  it("treats a 401 without a code as an expired session", () => {
    expect(getErrorMessage(new ApiError({ status: 401, message: "Unauthorized" }))).toBe(
      messages.auth.sessionExpired,
    );
  });

  it.each([500, 502, 503, 418])(
    "falls back to the generic server message for status %i",
    (status) => {
      expect(getErrorMessage(new ApiError({ status, message: "technical detail" }))).toBe(
        messages.errors.server,
      );
    },
  );

  it.each([
    ["a TypeError", new TypeError("Cannot read properties of undefined")],
    ["a string", "oops"],
    ["undefined", undefined],
  ])("returns the generic server message for %s", (_label, error) => {
    expect(getErrorMessage(error)).toBe(messages.errors.server);
  });
});
