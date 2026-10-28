import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { CheckCircleIcon, LinkOffIcon, MailIcon } from "@/components/icons";
import { LinkButton } from "@/components/LinkButton";
import { Spinner } from "@/components/Spinner";
import {
  AuthCard,
  AuthFooterLink,
  authApi,
  CheckEmailPanel,
  EmailRequestForm,
  type EmailRequestValues,
} from "@/features/auth";
import { ApiError } from "@/lib/ApiError";
import { withUserFacingError } from "@/lib/formErrors";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

type VerifyState =
  | { kind: "verifying" }
  | { kind: "verified" }
  | { kind: "already-verified" }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "failed"; message: string }
  | { kind: "new-link-sent"; email: string };

function stateForError(error: unknown): VerifyState {
  if (error instanceof ApiError) {
    if (error.code === "EMAIL_ALREADY_VERIFIED") return { kind: "already-verified" };
    if (error.code === "TOKEN_EXPIRED") return { kind: "expired" };
    if (error.code === "TOKEN_INVALID") return { kind: "invalid" };
  }
  return { kind: "failed", message: getErrorMessage(error) };
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  return <VerifyEmailScreen key={token ?? ""} token={token} />;
}

function VerifyEmailScreen({ token }: { token: string | null }) {
  const [state, setState] = useState<VerifyState>(
    token ? { kind: "verifying" } : { kind: "invalid" },
  );
  const [attempt, setAttempt] = useState(0);
  const sentRequest = useRef<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const requestKey = `${token}#${attempt}`;
    if (sentRequest.current === requestKey) return;
    sentRequest.current = requestKey;

    authApi.verifyEmail(token).then(
      () => setState({ kind: "verified" }),
      (error: unknown) => setState(stateForError(error)),
    );
  }, [token, attempt]);

  function retry() {
    setState({ kind: "verifying" });
    setAttempt((current) => current + 1);
  }

  async function requestNewLink({ email }: EmailRequestValues) {
    await withUserFacingError(authApi.resendVerification(email));
    setState({ kind: "new-link-sent", email });
  }

  const backToLogin = (
    <AuthFooterLink linkText={messages.verifyEmail.backToLogin} to={PATHS.login} />
  );

  switch (state.kind) {
    case "verifying":
      return (
        <Screen title={messages.verifyEmail.verifyingTitle}>
          <AuthCard
            title={messages.verifyEmail.verifyingTitle}
            description={messages.verifyEmail.verifyingDescription}
            icon={<MailIcon className="size-6" />}
          >
            <div className="flex justify-center py-2 text-primary">
              <Spinner size="lg" label={messages.verifyEmail.verifyingTitle} />
            </div>
          </AuthCard>
        </Screen>
      );

    case "verified":
    case "already-verified": {
      const isNew = state.kind === "verified";
      const title = isNew
        ? messages.verifyEmail.verifiedTitle
        : messages.verifyEmail.alreadyVerifiedTitle;
      return (
        <Screen title={title}>
          <AuthCard
            key={state.kind}
            title={title}
            description={isNew ? messages.auth.verified : messages.auth.alreadyVerified}
            icon={<CheckCircleIcon className="size-6" />}
            iconTone="success"
            autoFocusTitle
          >
            <LinkButton to={PATHS.login} fullWidth>
              {messages.verifyEmail.goToLogin}
            </LinkButton>
          </AuthCard>
        </Screen>
      );
    }

    case "invalid":
    case "expired": {
      const isExpired = state.kind === "expired";
      const title = isExpired
        ? messages.verifyEmail.expiredTitle
        : messages.verifyEmail.invalidTitle;
      return (
        <Screen title={title}>
          <AuthCard
            key={state.kind}
            title={title}
            description={isExpired ? messages.auth.linkExpired : messages.auth.linkInvalid}
            icon={<LinkOffIcon className="size-6" />}
            iconTone="danger"
            autoFocusTitle
            footer={backToLogin}
          >
            <p className="mb-5 text-sm text-fg-muted">{messages.verifyEmail.newLinkPrompt}</p>
            <EmailRequestForm
              submitLabel={messages.verifyEmail.sendNewLink}
              submittingLabel={messages.verifyEmail.sending}
              onSubmit={requestNewLink}
            />
          </AuthCard>
        </Screen>
      );
    }

    case "new-link-sent":
      return (
        <Screen title={messages.checkEmail.title}>
          <AuthCard
            key="new-link-sent"
            title={messages.checkEmail.title}
            icon={<MailIcon className="size-6" />}
            autoFocusTitle
            footer={backToLogin}
          >
            <CheckEmailPanel
              message={messages.auth.resendSent}
              hint={messages.checkEmail.verifyHint}
              onResend={() => requestNewLink({ email: state.email })}
            />
          </AuthCard>
        </Screen>
      );

    case "failed":
      return (
        <Screen title={messages.verifyEmail.failedTitle}>
          <AuthCard
            key="failed"
            title={messages.verifyEmail.failedTitle}
            icon={<LinkOffIcon className="size-6" />}
            iconTone="danger"
            autoFocusTitle
            footer={backToLogin}
          >
            <div className="space-y-5">
              <Alert variant="error">{state.message}</Alert>
              <Button fullWidth onClick={retry}>
                {messages.verifyEmail.retry}
              </Button>
            </div>
          </AuthCard>
        </Screen>
      );
  }
}

function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <title>{messages.app.pageTitle(title)}</title>
      {children}
    </>
  );
}
