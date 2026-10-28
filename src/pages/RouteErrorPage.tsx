import { useEffect } from "react";
import { useRouteError } from "react-router";
import { Button } from "@/components/Button";
import { AlertCircleIcon } from "@/components/icons";
import { LinkButton } from "@/components/LinkButton";
import { AuthCard } from "@/features/auth";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

export function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <title>{messages.app.pageTitle(messages.routeError.title)}</title>
      <AuthCard
        title={messages.routeError.title}
        description={messages.routeError.description}
        icon={<AlertCircleIcon className="size-6" />}
        iconTone="danger"
        autoFocusTitle
      >
        <div className="grid gap-3">
          <Button fullWidth onClick={() => window.location.reload()}>
            {messages.routeError.reload}
          </Button>
          <LinkButton to={PATHS.home} variant="secondary" fullWidth reloadDocument>
            {messages.routeError.homeLink}
          </LinkButton>
        </div>
      </AuthCard>
    </>
  );
}
