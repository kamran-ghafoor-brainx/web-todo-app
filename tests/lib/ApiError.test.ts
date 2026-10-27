import { ApiError, isServerErrorCode } from "@/lib/ApiError";

describe("ApiError", () => {
  it("is a real Error, so stack traces and instanceof checks work", () => {
    const error = new ApiError({ status: 404, message: "Not found" });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(404);
  });

  describe("client failures (no response)", () => {
    it("network(): status 0 with the NETWORK_ERROR code, keeping the original cause", () => {
      const cause = new TypeError("Failed to fetch");
      const error = ApiError.network(cause);
      expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
      expect(error.cause).toBe(cause);
    });

    it("timeout(): status 0 with the TIMEOUT code", () => {
      expect(ApiError.timeout()).toMatchObject({ status: 0, code: "TIMEOUT" });
    });
  });

  describe("fromResponse", () => {
    it("reads a string message and a known code", () => {
      const error = ApiError.fromResponse(403, {
        statusCode: 403,
        message: "Email not verified",
        error: "Forbidden",
        code: "EMAIL_NOT_VERIFIED",
      });
      expect(error).toMatchObject({
        status: 403,
        message: "Email not verified",
        code: "EMAIL_NOT_VERIFIED",
      });
      expect(error.details).toBeUndefined();
    });

    it("keeps a list of validation messages as details", () => {
      const error = ApiError.fromResponse(400, {
        statusCode: 400,
        message: ["email must be an email", "password is too short"],
        error: "Bad Request",
      });
      expect(error.details).toEqual(["email must be an email", "password is too short"]);
      expect(error.message).toBe("email must be an email; password is too short");
      expect(error.code).toBeUndefined();
    });

    it("drops a code it does not know instead of trusting it", () => {
      const error = ApiError.fromResponse(400, { message: "Nope", code: "SOMETHING_NEW" });
      expect(error.code).toBeUndefined();
    });

    it.each([
      ["no body", undefined],
      ["null", null],
      ["plain text", "<html>Bad Gateway</html>"],
      ["wrong field types", { message: 42, code: false }],
    ])("falls back to a safe message for %s", (_label, body) => {
      const error = ApiError.fromResponse(502, body);
      expect(error).toMatchObject({ status: 502, message: "Request failed with status 502" });
      expect(error.code).toBeUndefined();
    });

    it.each([
      ["60", 60],
      ["0", 0],
      [null, undefined],
      ["", undefined],
      ["soon", undefined],
      ["1.5", undefined],
      ["-5", undefined],
      ["Wed, 21 Oct 2026 07:28:00 GMT", undefined],
    ])("reads Retry-After %j as %j seconds", (header, expected) => {
      const error = ApiError.fromResponse(429, { code: "RATE_LIMITED" }, header);
      expect(error.retryAfter).toBe(expected);
    });
  });
});

describe("isServerErrorCode", () => {
  it("accepts the contract's codes and rejects anything else", () => {
    expect(isServerErrorCode("INVALID_CREDENTIALS")).toBe(true);
    expect(isServerErrorCode("TIMEOUT")).toBe(false);
    expect(isServerErrorCode("invalid_credentials")).toBe(false);
    expect(isServerErrorCode(undefined)).toBe(false);
  });
});
