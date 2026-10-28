import { useState } from "react";
import { MailIcon } from "@/components/icons";
import {
  AuthCard,
  AuthFooterLink,
  authApi,
  CheckEmailPanel,
  EmailRequestForm,
  type EmailRequestValues,
} from "@/features/auth";
import { withUserFacingError } from "@/lib/formErrors";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function requestResetLink(email: string) {
    await withUserFacingError(authApi.forgotPassword(email));
  }

  async function handleRequest({ email }: EmailRequestValues) {
    await requestResetLink(email);
    setSentTo(email);
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
            message={messages.auth.forgotSent(sentTo)}
            hint={messages.checkEmail.resetHint}
            onResend={() => requestResetLink(sentTo)}
          />
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <title>{messages.app.pageTitle(messages.forgotPassword.title)}</title>
      <AuthCard
        key="form"
        title={messages.forgotPassword.title}
        description={messages.forgotPassword.description}
        footer={
          <AuthFooterLink
            prompt={messages.forgotPassword.remembered}
            linkText={messages.forgotPassword.loginLink}
            to={PATHS.login}
          />
        }
      >
        <EmailRequestForm
          submitLabel={messages.forgotPassword.submit}
          submittingLabel={messages.forgotPassword.submitting}
          onSubmit={handleRequest}
        />
      </AuthCard>
    </>
  );
}
