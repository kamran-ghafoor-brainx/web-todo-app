import { LinkOffIcon } from "@/components/icons";
import { LinkButton } from "@/components/LinkButton";
import { AuthCard } from "@/features/auth";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

export function NotFoundPage() {
  return (
    <>
      <title>{messages.app.pageTitle(messages.notFound.title)}</title>
      <AuthCard
        title={messages.notFound.title}
        description={messages.notFound.description}
        icon={<LinkOffIcon className="size-6" />}
      >
        <LinkButton to={PATHS.home} fullWidth>
          {messages.notFound.homeLink}
        </LinkButton>
      </AuthCard>
    </>
  );
}
