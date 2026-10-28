import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { LinkOffIcon } from "@/components/icons";
import { LinkButton } from "@/components/LinkButton";
import {
  AuthCard,
  AuthFooterLink,
  authApi,
  ResetPasswordForm,
  type LoginLocationState,
  type ResetPasswordValues,
} from "@/features/auth";
import { ApiError } from "@/lib/ApiError";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

type LinkProblem = "invalid" | "expired";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  return <ResetPasswordScreen key={token ?? ""} token={token} />;
}

function ResetPasswordScreen({ token }: { token: string | null }) {
  const navigate = useNavigate();
  const [linkProblem, setLinkProblem] = useState<LinkProblem | null>(token ? null : "invalid");

  if (!token || linkProblem) {
    const isExpired = linkProblem === "expired";
    const title = isExpired
      ? messages.resetPassword.expiredTitle
      : messages.resetPassword.invalidTitle;

    return (
      <>
        <title>{messages.app.pageTitle(title)}</title>
        <AuthCard
          key="link-problem"
          title={title}
          description={isExpired ? messages.auth.linkExpired : messages.auth.linkInvalid}
          icon={<LinkOffIcon className="size-6" />}
          iconTone="danger"
          autoFocusTitle
          footer={<AuthFooterLink linkText={messages.resetPassword.backToLogin} to={PATHS.login} />}
        >
          <LinkButton to={PATHS.forgotPassword} fullWidth>
            {messages.resetPassword.requestNewLink}
          </LinkButton>
        </AuthCard>
      </>
    );
  }

  const handleReset = async ({ password }: ResetPasswordValues) => {
    try {
      await authApi.resetPassword({ token, password });
    } catch (error) {
      if (error instanceof ApiError && error.code === "TOKEN_EXPIRED") {
        setLinkProblem("expired");
        return;
      }
      if (error instanceof ApiError && error.code === "TOKEN_INVALID") {
        setLinkProblem("invalid");
        return;
      }
      throw getErrorMessage(error);
    }

    const state: LoginLocationState = { notice: "passwordUpdated" };
    navigate(PATHS.login, { replace: true, state });
  };

  return (
    <>
      <title>{messages.app.pageTitle(messages.resetPassword.title)}</title>
      <AuthCard
        key="form"
        title={messages.resetPassword.title}
        description={messages.resetPassword.description}
        footer={<AuthFooterLink linkText={messages.resetPassword.backToLogin} to={PATHS.login} />}
      >
        <ResetPasswordForm onSubmit={handleReset} />
      </AuthCard>
    </>
  );
}
