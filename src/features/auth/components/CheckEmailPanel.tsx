import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { useResendCooldown } from "@/features/auth/hooks/useResendCooldown";
import { messages } from "@/lib/messages";

type CheckEmailPanelProps = {
  message: string;
  hint: string;
  onResend: () => Promise<void>;
};

type ResendResult = { kind: "sent" } | { kind: "failed"; message: string } | null;

export function CheckEmailPanel({ message, hint, onResend }: CheckEmailPanelProps) {
  const cooldown = useResendCooldown({ startImmediately: true });
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<ResendResult>(null);

  async function handleResend() {
    setIsSending(true);
    setResult(null);
    try {
      await onResend();
      setResult({ kind: "sent" });
      cooldown.start();
    } catch (error) {
      setResult({
        kind: "failed",
        message: typeof error === "string" ? error : messages.errors.server,
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <Alert variant="info">{message}</Alert>

      <div className="space-y-1 text-sm text-fg-muted">
        <p>{hint}</p>
        <p>{messages.checkEmail.notReceived}</p>
      </div>

      {result?.kind === "sent" && <Alert variant="success">{messages.auth.resendSent}</Alert>}
      {result?.kind === "failed" && <Alert variant="error">{result.message}</Alert>}

      <Button
        variant="secondary"
        fullWidth
        loading={isSending}
        loadingText={messages.checkEmail.resending}
        disabled={cooldown.isCoolingDown}
        onClick={handleResend}
      >
        {cooldown.isCoolingDown
          ? messages.checkEmail.resendIn(cooldown.secondsLeft)
          : messages.checkEmail.resend}
      </Button>
    </div>
  );
}
