import { http, HttpResponse } from "msw";
import { z } from "zod";
import { emailField, nameField, newPasswordField } from "@/features/auth/authSchemas";
import type { LoginResponse, MessageResponse } from "@/features/auth/types";
import { PATHS } from "@/lib/paths";
import {
  changePassword,
  consumeEmailToken,
  createSession,
  createUser,
  deleteSession,
  findUserByCredentials,
  findUserByEmail,
  issueEmailToken,
  markEmailVerified,
  toPublicUser,
} from "@/mocks/authStore";
import { apiUrl, MAGIC_EMAILS, RATE_LIMITS } from "@/mocks/config";
import type { MockUser } from "@/mocks/db";
import { sendEmail } from "@/mocks/mailbox";
import { checkRateLimit } from "@/mocks/rateLimit";
import {
  authenticate,
  errorResponse,
  parseJsonBody,
  readBearerToken,
  simulateLatency,
  unauthorizedResponse,
} from "@/mocks/responses";

const signupBody = z.object({ name: nameField, email: emailField, password: newPasswordField });
const loginBody = z.object({ email: emailField, password: z.string().min(1) });
const emailBody = z.object({ email: emailField });
const tokenBody = z.object({ token: z.string().min(1) });
const resetBody = z.object({ token: z.string(), password: z.string() });

const GENERIC_EMAIL_REPLY: MessageResponse = {
  message: "If an account exists for this email, we sent a link to it.",
};

const isSlow = (email: string | undefined) => email === MAGIC_EMAILS.slow;

async function sendVerificationEmail(user: MockUser) {
  const token = await issueEmailToken(user, "verify-email");
  await sendEmail({
    to: user.email,
    subject: "Verify your email",
    link: `${PATHS.verifyEmail}?token=${token}`,
  });
}

function emailRequestLimit(endpoint: string, email: string) {
  return checkRateLimit(`${endpoint}:${email}`, RATE_LIMITS.emailRequest);
}

function tooManyRequests(retryAfterSeconds: number) {
  return errorResponse(429, "Too many requests", { code: "RATE_LIMITED", retryAfterSeconds });
}

export const authHandlers = [
  http.post(apiUrl("/auth/signup"), async ({ request }) => {
    const body = await parseJsonBody(request, signupBody);
    await simulateLatency();
    if (!body.ok) return body.response;

    const { name, email, password } = body.data;
    if (await findUserByEmail(email)) {
      return errorResponse(409, "Email already registered", { code: "EMAIL_ALREADY_REGISTERED" });
    }

    const user = await createUser({ name, email, password });
    await sendVerificationEmail(user);
    return HttpResponse.json<MessageResponse>(
      { message: "Account created. Check your email to verify it." },
      { status: 201 },
    );
  }),

  http.post(apiUrl("/auth/verify-email"), async ({ request }) => {
    const body = await parseJsonBody(request, tokenBody);
    await simulateLatency();
    if (!body.ok) {
      return errorResponse(400, "Invalid verification token", { code: "TOKEN_INVALID" });
    }

    const check = await consumeEmailToken(body.data.token, "verify-email");
    if (check.status === "unknown") {
      return errorResponse(400, "Invalid verification token", { code: "TOKEN_INVALID" });
    }
    if (check.status === "expired") {
      return errorResponse(400, "Verification token expired", { code: "TOKEN_EXPIRED" });
    }
    if (check.user.isEmailVerified) {
      return errorResponse(409, "Email already verified", { code: "EMAIL_ALREADY_VERIFIED" });
    }
    if (check.status === "used") {
      return errorResponse(400, "Invalid verification token", { code: "TOKEN_INVALID" });
    }

    await markEmailVerified(check.user);
    return HttpResponse.json<MessageResponse>({ message: "Email verified." });
  }),

  http.post(apiUrl("/auth/resend-verification"), async ({ request }) => {
    const body = await parseJsonBody(request, emailBody);
    await simulateLatency({ slow: body.ok && isSlow(body.data.email) });
    if (!body.ok) return body.response;

    const { email } = body.data;
    const limit = emailRequestLimit("resend-verification", email);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const user = await findUserByEmail(email);
    if (user && !user.isEmailVerified) await sendVerificationEmail(user);
    return HttpResponse.json(GENERIC_EMAIL_REPLY);
  }),

  http.post(apiUrl("/auth/login"), async ({ request }) => {
    const body = await parseJsonBody(request, loginBody);
    await simulateLatency({ slow: body.ok && isSlow(body.data.email) });
    if (!body.ok) return body.response;

    const { email, password } = body.data;
    if (email === MAGIC_EMAILS.locked) {
      return tooManyRequests(RATE_LIMITS.lockedRetryAfterSeconds);
    }
    const limit = checkRateLimit(`login:${email}`, RATE_LIMITS.login);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const user = await findUserByCredentials(email, password);
    if (!user) {
      return errorResponse(401, "Invalid email or password", { code: "INVALID_CREDENTIALS" });
    }
    if (!user.isEmailVerified) {
      return errorResponse(403, "Email not verified", { code: "EMAIL_NOT_VERIFIED" });
    }

    const session = await createSession(user);
    return HttpResponse.json<LoginResponse>({
      accessToken: session.token,
      user: toPublicUser(user),
    });
  }),

  http.get(apiUrl("/auth/me"), async ({ request }) => {
    const user = await authenticate(request);
    return user ? HttpResponse.json(toPublicUser(user)) : unauthorizedResponse();
  }),

  http.post(apiUrl("/auth/logout"), async ({ request }) => {
    const user = await authenticate(request);
    const token = readBearerToken(request);
    if (!token || !user) return unauthorizedResponse();

    await deleteSession(token);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(apiUrl("/auth/forgot-password"), async ({ request }) => {
    const body = await parseJsonBody(request, emailBody);
    await simulateLatency({ slow: body.ok && isSlow(body.data.email) });
    if (!body.ok) return body.response;

    const { email } = body.data;
    const limit = emailRequestLimit("forgot-password", email);
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const user = await findUserByEmail(email);
    if (user) {
      const token = await issueEmailToken(user, "reset-password");
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        link: `${PATHS.resetPassword}?token=${token}`,
      });
    }
    return HttpResponse.json(GENERIC_EMAIL_REPLY);
  }),

  http.post(apiUrl("/auth/reset-password"), async ({ request }) => {
    const body = await parseJsonBody(request, resetBody);
    await simulateLatency();
    if (!body.ok) return body.response;

    const { token, password } = body.data;
    if (!token) {
      return errorResponse(400, "Invalid reset token", { code: "TOKEN_INVALID" });
    }
    const passwordCheck = newPasswordField.safeParse(password);
    if (!passwordCheck.success) {
      return errorResponse(
        400,
        passwordCheck.error.issues.map((issue) => `password: ${issue.message}`),
      );
    }

    const check = await consumeEmailToken(token, "reset-password");
    if (check.status === "expired") {
      return errorResponse(400, "Reset token expired", { code: "TOKEN_EXPIRED" });
    }
    if (check.status !== "valid") {
      return errorResponse(400, "Invalid reset token", { code: "TOKEN_INVALID" });
    }

    await changePassword(check.user, password);
    return HttpResponse.json<MessageResponse>({ message: "Password updated." });
  }),
];
