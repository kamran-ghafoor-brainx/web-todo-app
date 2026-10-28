import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { MailIcon } from "@/components/icons";
import { Spinner } from "@/components/Spinner";
import { TextLink } from "@/components/TextLink";
import { AuthCard, AuthFooterLink } from "@/features/auth";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { http } from "@/lib/http";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";
import { tokenStorage } from "@/lib/tokenStorage";

type MailboxEmail = { id: string; to: string; subject: string; link: string; sentAt: string };

const devApi = {
  mailbox: (signal?: AbortSignal) => http.get<MailboxEmail[]>("/__dev/mailbox", { signal }),
  reset: () => http.post<void>("/__dev/reset"),
};

export function DevMailboxPage() {
  const [emails, setEmails] = useState<MailboxEmail[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    return devApi.mailbox(signal).then(
      (list) => {
        setEmails(list);
        setError(null);
      },
      (loadError: unknown) => {
        if (!signal?.aborted) setError(getErrorMessage(loadError));
      },
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function refresh() {
    setIsRefreshing(true);
    setNotice(null);
    await load();
    setIsRefreshing(false);
  }

  async function resetMockData() {
    setIsResetting(true);
    setNotice(null);
    try {
      await devApi.reset();
      tokenStorage.clear();
      setNotice(messages.devMailbox.resetDone);
      await load();
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <title>{messages.app.pageTitle(messages.devMailbox.title)}</title>
      <AuthCard
        title={messages.devMailbox.title}
        description={messages.devMailbox.description}
        icon={<MailIcon className="size-6" />}
        footer={<AuthFooterLink linkText={messages.verifyEmail.backToLogin} to={PATHS.login} />}
      >
        <div className="space-y-5">
          <Alert variant="info">{messages.devMailbox.devOnly}</Alert>
          {notice && <Alert variant="success">{notice}</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          {emails === null && !error && (
            <div className="flex justify-center py-4 text-primary">
              <Spinner label={messages.devMailbox.loading} />
            </div>
          )}

          {emails?.length === 0 && (
            <p className="text-sm text-fg-muted">{messages.devMailbox.empty}</p>
          )}

          {emails && emails.length > 0 && (
            <ul className="divide-y divide-border rounded-control border border-border">
              {emails.map((email) => (
                <li key={email.id} className="space-y-1 p-4 text-sm">
                  <p className="font-medium text-fg">{email.subject}</p>
                  <p className="break-all text-fg-muted">{messages.devMailbox.to(email.to)}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <time dateTime={email.sentAt} className="text-fg-muted">
                      {new Date(email.sentAt).toLocaleString()}
                    </time>
                    <TextLink to={email.link}>{messages.devMailbox.openLink}</TextLink>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="secondary"
              loading={isRefreshing}
              loadingText={messages.devMailbox.refreshing}
              onClick={refresh}
            >
              {messages.devMailbox.refresh}
            </Button>
            <Button
              variant="danger"
              loading={isResetting}
              loadingText={messages.devMailbox.resetting}
              onClick={resetMockData}
            >
              {messages.devMailbox.reset}
            </Button>
          </div>
        </div>
      </AuthCard>
    </>
  );
}
