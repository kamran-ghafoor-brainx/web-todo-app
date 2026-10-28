import { z } from "zod";
import { messages } from "@/lib/messages";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: messages.validation.emailRequired })
  .max(254, { error: messages.validation.emailTooLong })
  .pipe(z.email({ error: messages.validation.emailInvalid }));

const loginPasswordField = z.string().min(1, { error: messages.validation.passwordRequired });

export const loginSchema = z.object({
  email: emailField,
  password: loginPasswordField,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const nameField = z
  .string()
  .trim()
  .min(1, { error: messages.validation.nameRequired })
  .min(2, { error: messages.validation.nameTooShort })
  .max(50, { error: messages.validation.nameTooLong });

export const newPasswordField = z
  .string()
  .min(1, { error: messages.validation.passwordRequired })
  .min(8, { error: messages.validation.passwordTooShort })
  .max(64, { error: messages.validation.passwordTooLong })
  .refine((value) => /\p{L}/u.test(value) && /\d/.test(value), {
    error: messages.validation.passwordNeedsLetterAndNumber,
  });

const confirmPasswordField = z
  .string()
  .min(1, { error: messages.validation.confirmPasswordRequired });

const passwordFields = { password: newPasswordField, confirmPassword: confirmPasswordField };
const passwordFieldsSchema = z.object(passwordFields);

function passwordsMatch(values: { password: string; confirmPassword: string }): boolean {
  return values.password === values.confirmPassword;
}

const passwordsMatchOptions = {
  error: messages.validation.passwordsDoNotMatch,
  path: ["confirmPassword"],
  when: (payload: z.core.ParsePayload) => passwordFieldsSchema.safeParse(payload.value).success,
};

export const signupSchema = z
  .object({ name: nameField, email: emailField, ...passwordFields })
  .refine(passwordsMatch, passwordsMatchOptions);
export type SignupValues = z.infer<typeof signupSchema>;

export const emailRequestSchema = z.object({ email: emailField });
export type EmailRequestValues = z.infer<typeof emailRequestSchema>;

export const resetPasswordSchema = passwordFieldsSchema.refine(
  passwordsMatch,
  passwordsMatchOptions,
);
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
