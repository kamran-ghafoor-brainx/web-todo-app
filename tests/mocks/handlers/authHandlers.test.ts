import { authApi } from "@/features/auth";
import { ApiError } from "@/lib/ApiError";
import { http } from "@/lib/http";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { listMailbox } from "@/mocks/mailbox";

const PASSWORD = "Passw0rd!";
const NEW_USER = { name: "Ann Lee", email: "ann@example.com", password: "secret12" };

async function apiErrorOf(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("Expected the request to fail, but it succeeded");
}

async function latestEmailToken(): Promise<string> {
  const [latest] = await listMailbox();
  const token = latest && new URLSearchParams(latest.link.split("?")[1]).get("token");
  if (!token) throw new Error("Expected an email with a token in the mock mailbox");
  return token;
}

function travelInTime(ms: number) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.now() + ms);
}

afterEach(() => vi.useRealTimers());

describe("POST /auth/signup", () => {
  it("creates an unverified account and sends a verification email (201)", async () => {
    await expect(authApi.signup(NEW_USER)).resolves.toEqual({
      message: expect.any(String),
    });

    const [email] = await listMailbox();
    expect(email).toMatchObject({ to: "ann@example.com", subject: "Verify your email" });
    expect(email?.link).toMatch(/^\/verify-email\?token=[0-9a-f]{64}$/);

    const error = await apiErrorOf(authApi.login(NEW_USER));
    expect(error).toMatchObject({ status: 403, code: "EMAIL_NOT_VERIFIED" });
  });

  it("refuses a registered email, ignoring case and spaces (409)", async () => {
    const error = await apiErrorOf(authApi.signup({ ...NEW_USER, email: " DEMO@example.com " }));
    expect(error).toMatchObject({ status: 409, code: "EMAIL_ALREADY_REGISTERED" });
  });

  it("validates the body itself, listing every problem (400, NestJS style)", async () => {
    const error = await apiErrorOf(
      http.post("/auth/signup", { name: "A", email: "nope", password: "short" }, { auth: false }),
    );
    expect(error.status).toBe(400);
    expect(error.details).toEqual([
      `name: ${messages.validation.nameTooShort}`,
      `email: ${messages.validation.emailInvalid}`,
      `password: ${messages.validation.passwordTooShort}`,
      `password: ${messages.validation.passwordNeedsLetterAndNumber}`,
    ]);
  });
});

describe("POST /auth/verify-email", () => {
  it("verifies the account once; the same link then answers 409 EMAIL_ALREADY_VERIFIED", async () => {
    await authApi.signup(NEW_USER);
    const token = await latestEmailToken();

    await expect(authApi.verifyEmail(token)).resolves.toEqual({ message: expect.any(String) });
    await expect(authApi.login(NEW_USER)).resolves.toMatchObject({
      user: { email: "ann@example.com", isEmailVerified: true },
    });

    const again = await apiErrorOf(authApi.verifyEmail(token));
    expect(again).toMatchObject({ status: 409, code: "EMAIL_ALREADY_VERIFIED" });
  });

  it("answers 400 TOKEN_INVALID for an unknown or missing token", async () => {
    expect(await apiErrorOf(authApi.verifyEmail("nope"))).toMatchObject({
      status: 400,
      code: "TOKEN_INVALID",
    });
    expect(await apiErrorOf(http.post("/auth/verify-email", {}, { auth: false }))).toMatchObject({
      status: 400,
      code: "TOKEN_INVALID",
    });
  });

  it("answers 400 TOKEN_EXPIRED after 24 hours", async () => {
    await authApi.signup(NEW_USER);
    const token = await latestEmailToken();
    travelInTime(24 * 60 * 60 * 1000 + 1000);

    expect(await apiErrorOf(authApi.verifyEmail(token))).toMatchObject({
      status: 400,
      code: "TOKEN_EXPIRED",
    });
  });

  it("only accepts the newest link after a resend", async () => {
    await authApi.signup(NEW_USER);
    const oldToken = await latestEmailToken();
    await authApi.resendVerification(NEW_USER.email);
    const newToken = await latestEmailToken();

    expect(await apiErrorOf(authApi.verifyEmail(oldToken))).toMatchObject({
      code: "TOKEN_INVALID",
    });
    await expect(authApi.verifyEmail(newToken)).resolves.toBeDefined();
  });
});

describe("POST /auth/resend-verification", () => {
  it("answers the same for any email, but only sends to unverified accounts (S-04)", async () => {
    await authApi.signup(NEW_USER);
    const before = (await listMailbox()).length;

    const known = await authApi.resendVerification(NEW_USER.email);
    const unknown = await authApi.resendVerification("nobody@example.com");
    const verified = await authApi.resendVerification("demo@example.com");

    expect(known).toEqual(unknown);
    expect(unknown).toEqual(verified);
    expect((await listMailbox()).length).toBe(before + 1);
  });

  it("allows one request per email every 30 seconds (429 with Retry-After)", async () => {
    await authApi.resendVerification("demo@example.com");

    const error = await apiErrorOf(authApi.resendVerification("demo@example.com"));
    expect(error).toMatchObject({ status: 429, code: "RATE_LIMITED" });
    expect(error.retryAfter).toBeGreaterThan(0);
    expect(error.retryAfter).toBeLessThanOrEqual(30);

    await expect(authApi.resendVerification("ann@example.com")).resolves.toBeDefined();
  });
});

describe("POST /auth/login", () => {
  it("returns an opaque token and the public user", async () => {
    const result = await authApi.login({ email: "Demo@Example.com", password: PASSWORD });

    expect(result.accessToken).toMatch(/^mock\.[0-9a-f]{64}$/);
    expect(result.user).toEqual({
      id: expect.any(String),
      name: "Demo User",
      email: "demo@example.com",
      isEmailVerified: true,
    });
    expect(Object.keys(result.user).sort()).toEqual(["email", "id", "isEmailVerified", "name"]);
  });

  it("gives one answer for a wrong password and an unknown email (401, EC-08)", async () => {
    const wrongPassword = await apiErrorOf(
      authApi.login({ email: "demo@example.com", password: "nope" }),
    );
    const unknownEmail = await apiErrorOf(
      authApi.login({ email: "nobody@example.com", password: PASSWORD }),
    );

    expect(wrongPassword).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    expect(unknownEmail).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
    expect(unknownEmail.message).toBe(wrongPassword.message);
  });

  it("refuses an unverified account with 403 EMAIL_NOT_VERIFIED (EC-09)", async () => {
    const error = await apiErrorOf(
      authApi.login({ email: "unverified@example.com", password: PASSWORD }),
    );
    expect(error).toMatchObject({ status: 403, code: "EMAIL_NOT_VERIFIED" });
  });

  it("always answers 429 for locked@example.com, with Retry-After 60", async () => {
    const error = await apiErrorOf(
      authApi.login({ email: "locked@example.com", password: PASSWORD }),
    );
    expect(error).toMatchObject({ status: 429, code: "RATE_LIMITED", retryAfter: 60 });
  });

  it("refuses the 6th attempt for the same email within a minute (EC-10)", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await apiErrorOf(authApi.login({ email: "demo@example.com", password: "wrong" }));
    }

    const error = await apiErrorOf(
      authApi.login({ email: "demo@example.com", password: PASSWORD }),
    );
    expect(error).toMatchObject({ status: 429, code: "RATE_LIMITED" });
    expect(error.retryAfter).toBeLessThanOrEqual(60);
  });

  it("validates the body itself (400)", async () => {
    const error = await apiErrorOf(http.post("/auth/login", { email: "x" }, { auth: false }));
    expect(error.status).toBe(400);
    expect(error.details).toEqual(
      expect.arrayContaining([`email: ${messages.validation.emailInvalid}`]),
    );
  });

  it("answers 400 for a body that is not JSON", async () => {
    const response = await fetch(new URL("/api/auth/login", window.location.origin), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ statusCode: 400, error: "Bad Request" });
  });
});

describe("GET /auth/me and POST /auth/logout", () => {
  async function logInAs(email: string) {
    const { accessToken } = await authApi.login({ email, password: PASSWORD });
    tokenStorage.set(accessToken);
    return accessToken;
  }

  it("returns the user of the current token", async () => {
    await logInAs("demo@example.com");
    await expect(authApi.me()).resolves.toMatchObject({ email: "demo@example.com" });
  });

  it("answers 401 without a token, or with an unknown one", async () => {
    expect(await apiErrorOf(authApi.me())).toMatchObject({ status: 401 });

    tokenStorage.set("mock.not-a-real-token");
    expect(await apiErrorOf(authApi.me())).toMatchObject({ status: 401 });
  });

  it("expires shortlived@example.com's session after 30 seconds", async () => {
    await logInAs("shortlived@example.com");
    await expect(authApi.me()).resolves.toBeDefined();

    travelInTime(31 * 1000);
    expect(await apiErrorOf(authApi.me())).toMatchObject({ status: 401 });
  });

  it("logs out: 204, then the token no longer works", async () => {
    await logInAs("demo@example.com");

    await expect(authApi.logout()).resolves.toBeUndefined();
    expect(await apiErrorOf(authApi.me())).toMatchObject({ status: 401 });
    expect(await apiErrorOf(authApi.logout())).toMatchObject({ status: 401 });
  });
});

describe("POST /auth/forgot-password and POST /auth/reset-password", () => {
  it("answers the same for any email, but only sends a link to real accounts (EC-16)", async () => {
    const known = await authApi.forgotPassword("demo@example.com");
    const unknown = await authApi.forgotPassword("nobody@example.com");

    expect(known).toEqual(unknown);
    const mailbox = await listMailbox();
    expect(mailbox).toHaveLength(1);
    expect(mailbox[0]).toMatchObject({ to: "demo@example.com", subject: "Reset your password" });
    expect(mailbox[0]?.link).toMatch(/^\/reset-password\?token=[0-9a-f]{64}$/);
  });

  it("allows one request per email every 30 seconds (429)", async () => {
    await authApi.forgotPassword("demo@example.com");
    expect(await apiErrorOf(authApi.forgotPassword("demo@example.com"))).toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
    });
  });

  it("sets the new password, ends existing sessions, and burns the link", async () => {
    const { accessToken } = await authApi.login({ email: "demo@example.com", password: PASSWORD });
    await authApi.forgotPassword("demo@example.com");
    const token = await latestEmailToken();

    await expect(authApi.resetPassword({ token, password: "brandNew99" })).resolves.toEqual({
      message: expect.any(String),
    });

    expect(
      await apiErrorOf(authApi.login({ email: "demo@example.com", password: PASSWORD })),
    ).toMatchObject({ code: "INVALID_CREDENTIALS" });
    await expect(
      authApi.login({ email: "demo@example.com", password: "brandNew99" }),
    ).resolves.toBeDefined();

    tokenStorage.set(accessToken);
    expect(await apiErrorOf(authApi.me())).toMatchObject({ status: 401 });

    expect(await apiErrorOf(authApi.resetPassword({ token, password: "another99" }))).toMatchObject(
      { status: 400, code: "TOKEN_INVALID" },
    );
  });

  it("answers 400 TOKEN_EXPIRED after 1 hour", async () => {
    await authApi.forgotPassword("demo@example.com");
    const token = await latestEmailToken();
    travelInTime(60 * 60 * 1000 + 1000);

    expect(
      await apiErrorOf(authApi.resetPassword({ token, password: "brandNew99" })),
    ).toMatchObject({ status: 400, code: "TOKEN_EXPIRED" });
  });

  it("rejects a weak password without using up the link", async () => {
    await authApi.forgotPassword("demo@example.com");
    const token = await latestEmailToken();

    const weak = await apiErrorOf(authApi.resetPassword({ token, password: "short" }));
    expect(weak.status).toBe(400);
    expect(weak.details).toContain(`password: ${messages.validation.passwordTooShort}`);

    await expect(authApi.resetPassword({ token, password: "brandNew99" })).resolves.toBeDefined();
  });

  it("does not accept a verification token as a reset token", async () => {
    await authApi.signup(NEW_USER);
    const verifyToken = await latestEmailToken();

    expect(
      await apiErrorOf(authApi.resetPassword({ token: verifyToken, password: "brandNew99" })),
    ).toMatchObject({ code: "TOKEN_INVALID" });
  });
});
