import { useState } from "react";
import { MailIcon } from "@/components/icons";
import {
  AuthCard,
  AuthFooterLink,
  authApi,
  CheckEmailPanel,
  SignupForm,
  type SignupValues,
} from "@/features/auth";
import { ApiError } from "@/lib/ApiError";
import { fieldError, withUserFacingError } from "@/lib/formErrors";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

export function SignupPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSignup({ name, email, password }: SignupValues) {
    try {
      await authApi.signup({ name, email, password });
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_ALREADY_REGISTERED") {
        throw fieldError("email", getErrorMessage(error));
      }
      throw getErrorMessage(error);
    }
    setSentTo(email);
  }

  async function resendVerification(email: string) {
    await withUserFacingError(authApi.resendVerification(email));
  }

  if (sentTo) {
    return (
      <>
        <title>{messages.app.pageTitle(messages.checkEmail.title)}</title>
        <AuthCard
          key="check-email"
          title={messages.checkEmail.title}
          icon={<MailIcon className="size-6" />}
          autoFocusTitle
          footer={<AuthFooterLink linkText={messages.checkEmail.backToLogin} to={PATHS.login} />}
        >
          <CheckEmailPanel
            message={messages.auth.checkEmail(sentTo)}
            hint={messages.checkEmail.verifyHint}
            onResend={() => resendVerification(sentTo)}
          />
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <title>{messages.app.pageTitle(messages.signup.title)}</title>
      <AuthCard
        key="form"
        title={messages.signup.title}
        description={messages.signup.description}
        footer={
          <AuthFooterLink
            prompt={messages.signup.haveAccount}
            linkText={messages.signup.loginLink}
            to={PATHS.login}
          />
        }
      >
        <SignupForm onSubmit={handleSignup} />
      </AuthCard>
    </>
  );
}
