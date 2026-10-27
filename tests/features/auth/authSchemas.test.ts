import { z } from "zod";
import {
  emailRequestSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/features/auth/authSchemas";
import { messages } from "@/lib/messages";

function fieldErrors(input: unknown) {
  const result = loginSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "ann@example.com", password: "secret1" }).success).toBe(
      true,
    );
  });

  it("trims and lowercases the email before checking and sending it", () => {
    const result = loginSchema.parse({ email: "  Ann@Example.COM ", password: "secret1" });
    expect(result.email).toBe("ann@example.com");
  });

  it("keeps the password exactly as typed, spaces included", () => {
    const result = loginSchema.parse({ email: "ann@example.com", password: " pass word " });
    expect(result.password).toBe(" pass word ");
  });

  it("asks for the email when it is empty or only spaces", () => {
    expect(fieldErrors({ email: "   ", password: "secret1" }).email).toEqual([
      messages.validation.emailRequired,
    ]);
  });

  it("rejects an invalid email with one clear message", () => {
    expect(fieldErrors({ email: "ann@", password: "secret1" }).email).toEqual([
      messages.validation.emailInvalid,
    ]);
  });

  it("rejects an email longer than 254 characters", () => {
    const longEmail = `${"a".repeat(250)}@example.com`;
    expect(fieldErrors({ email: longEmail, password: "secret1" }).email).toEqual([
      messages.validation.emailTooLong,
    ]);
  });

  it("asks for the password when it is empty", () => {
    expect(fieldErrors({ email: "ann@example.com", password: "" }).password).toEqual([
      messages.validation.passwordRequired,
    ]);
  });

  it("reports both fields at once when both are empty", () => {
    expect(fieldErrors({ email: "", password: "" })).toEqual({
      email: [messages.validation.emailRequired],
      password: [messages.validation.passwordRequired],
    });
  });
});

describe("signupSchema", () => {
  const valid = {
    name: "Ann Lee",
    email: "ann@example.com",
    password: "secret12",
    confirmPassword: "secret12",
  };

  function signupErrors(overrides: Partial<typeof valid>) {
    const result = signupSchema.safeParse({ ...valid, ...overrides });
    return result.success ? {} : z.flattenError(result.error).fieldErrors;
  }

  it("accepts valid values, trimming the name and cleaning the email", () => {
    const result = signupSchema.parse({ ...valid, name: "  Ann Lee ", email: " Ann@Example.COM" });
    expect(result).toMatchObject({ name: "Ann Lee", email: "ann@example.com" });
  });

  it.each([
    ["", messages.validation.nameRequired],
    ["   ", messages.validation.nameRequired],
    ["A", messages.validation.nameTooShort],
    ["A".repeat(51), messages.validation.nameTooLong],
  ])("rejects the name %j with the right first message", (name, message) => {
    expect(signupErrors({ name }).name?.[0]).toBe(message);
  });

  it.each([
    ["", messages.validation.passwordRequired],
    ["abc1", messages.validation.passwordTooShort],
    [`a1${"x".repeat(63)}`, messages.validation.passwordTooLong],
    ["onlyletters", messages.validation.passwordNeedsLetterAndNumber],
    ["12345678", messages.validation.passwordNeedsLetterAndNumber],
  ])("rejects the password %j with the right first message", (password, message) => {
    expect(signupErrors({ password, confirmPassword: password }).password?.[0]).toBe(message);
  });

  it("accepts letters from any alphabet", () => {
    expect(signupErrors({ password: "пароль12", confirmPassword: "пароль12" })).toEqual({});
  });

  it("keeps spaces in the password exactly as typed", () => {
    const result = signupSchema.parse({
      ...valid,
      password: " secret12 ",
      confirmPassword: " secret12 ",
    });
    expect(result.password).toBe(" secret12 ");
  });

  it("puts a mismatch under the confirm field", () => {
    expect(signupErrors({ confirmPassword: "secret13" })).toEqual({
      confirmPassword: [messages.validation.passwordsDoNotMatch],
    });
  });

  it("reports a mismatch even while another field is still invalid", () => {
    const errors = signupErrors({ name: "", confirmPassword: "secret13" });
    expect(errors.confirmPassword).toEqual([messages.validation.passwordsDoNotMatch]);
    expect(errors.name?.[0]).toBe(messages.validation.nameRequired);
  });

  it("asks for the confirmation when it is empty, without a mismatch message", () => {
    expect(signupErrors({ confirmPassword: "" }).confirmPassword).toEqual([
      messages.validation.confirmPasswordRequired,
    ]);
  });
});

describe("emailRequestSchema", () => {
  it("only needs a valid email, cleaned like everywhere else", () => {
    expect(emailRequestSchema.parse({ email: " Ann@Example.com " })).toEqual({
      email: "ann@example.com",
    });
    expect(emailRequestSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("uses the same password rule and match check as signup", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "secret12", confirmPassword: "secret12" }).success,
    ).toBe(true);

    const short = resetPasswordSchema.safeParse({ password: "abc", confirmPassword: "abc" });
    expect(short.success || z.flattenError(short.error).fieldErrors.password?.[0]).toBe(
      messages.validation.passwordTooShort,
    );

    const mismatch = resetPasswordSchema.safeParse({ password: "secret12", confirmPassword: "x" });
    expect(mismatch.success || z.flattenError(mismatch.error).fieldErrors).toEqual({
      confirmPassword: [messages.validation.passwordsDoNotMatch],
    });
  });
});
