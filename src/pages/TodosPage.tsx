import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { CheckCircleIcon } from "@/components/icons";
import { Spinner } from "@/components/Spinner";
import { AuthCard, authApi, type LoginLocationState, type User } from "@/features/auth";
import { ApiError } from "@/lib/ApiError";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";
import { tokenStorage } from "@/lib/tokenStorage";

export function TodosPage() {
  const navigate = useNavigate();
  const hasToken = tokenStorage.get() !== null;
  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!hasToken) return;
    const controller = new AbortController();

    authApi.me({ signal: controller.signal }).then(setUser, (error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) {
        tokenStorage.clear();
        const state: LoginLocationState = { notice: "sessionExpired" };
        navigate(PATHS.login, { replace: true, state });
        return;
      }
      setLoadError(getErrorMessage(error));
    });

    return () => controller.abort();
  }, [hasToken, navigate]);

  if (!hasToken) return <Navigate to={PATHS.login} replace />;

  async function logout() {
    setIsLoggingOut(true);
    await authApi.logout().catch(() => undefined);
    tokenStorage.clear();
    const state: LoginLocationState = { notice: "loggedOut" };
    navigate(PATHS.login, { replace: true, state });
  }

  const logoutButton = (
    <Button
      variant="secondary"
      fullWidth
      loading={isLoggingOut}
      loadingText={messages.home.loggingOut}
      onClick={logout}
    >
      {messages.home.logout}
    </Button>
  );

  if (loadError) {
    return (
      <>
        <title>{messages.app.pageTitle(messages.home.loadFailedTitle)}</title>
        <AuthCard title={messages.home.loadFailedTitle}>
          <div className="space-y-5">
            <Alert variant="error">{loadError}</Alert>
            {logoutButton}
          </div>
        </AuthCard>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <title>{messages.app.pageTitle(messages.home.loading)}</title>
        <AuthCard title={messages.home.loading}>
          <div className="flex justify-center py-2 text-primary">
            <Spinner size="lg" label={messages.home.loading} />
          </div>
        </AuthCard>
      </>
    );
  }

  return (
    <>
      <title>{messages.app.pageTitle(messages.home.welcome(user.name))}</title>
      <AuthCard
        title={messages.home.welcome(user.name)}
        description={messages.home.signedInAs(user.email)}
        icon={<CheckCircleIcon className="size-6" />}
        iconTone="success"
      >
        <div className="space-y-5">
          <p className="text-sm text-fg-muted">{messages.home.comingSoon}</p>
          {logoutButton}
        </div>
      </AuthCard>
    </>
  );
}
