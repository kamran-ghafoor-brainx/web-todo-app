import { useState } from "react";
import { Navigate, Outlet } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Alert } from "@/components/Alert";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/Button";
import { PageLoading } from "@/components/PageLoading";
import {
  AuthCard,
  bootstrapSession,
  loginStateAfterSessionEnd,
  logout,
  selectAuthStatus,
  selectBootstrapError,
  selectSessionEndReason,
  selectUser,
} from "@/features/auth";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

export function AppLayout() {
  const status = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectUser);
  const endReason = useAppSelector(selectSessionEndReason);

  if (status === "unauthenticated") {
    return <Navigate to={PATHS.login} replace state={loginStateAfterSessionEnd(endReason)} />;
  }

  if (status === "unknown" || !user) return <SessionCheck />;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-content items-center justify-between gap-3 px-4 py-3">
          <AppLogo className="shrink-0" />
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="min-w-0 truncate text-sm text-fg-muted"
              title={messages.session.signedInAs(user.name)}
            >
              {user.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function LogoutButton() {
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await dispatch(logout());
  }

  return (
    <Button
      variant="secondary"
      className="shrink-0"
      loading={isLoggingOut}
      loadingText={messages.session.loggingOut}
      onClick={handleLogout}
    >
      {messages.session.logout}
    </Button>
  );
}

function SessionCheck() {
  const dispatch = useAppDispatch();
  const bootstrapError = useAppSelector(selectBootstrapError);

  if (!bootstrapError) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <title>{messages.app.pageTitle(messages.session.checking)}</title>
        <PageLoading label={messages.session.checking} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-auth items-center px-4 py-10">
      <title>{messages.app.pageTitle(messages.session.loadFailedTitle)}</title>
      <div className="w-full">
        <AuthCard title={messages.session.loadFailedTitle}>
          <div className="space-y-5">
            <Alert variant="error">{bootstrapError}</Alert>
            <Button fullWidth onClick={() => void dispatch(bootstrapSession())}>
              {messages.session.retry}
            </Button>
          </div>
        </AuthCard>
      </div>
    </main>
  );
}
