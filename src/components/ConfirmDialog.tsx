import { useRef, type ReactNode } from "react";
import { Button } from "@/components/Button";
import type { ButtonVariant } from "@/components/buttonStyles";
import { Dialog } from "@/components/Dialog";
import { messages } from "@/lib/messages";

type ConfirmDialogProps = {
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  /** While true, the confirm button shows a spinner and both buttons are disabled. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Asks before an action. Focus starts on Cancel, so Enter never confirms by accident. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmingLabel,
  cancelLabel = messages.dialog.cancel,
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      title={title}
      description={description}
      onClose={() => {
        if (!loading) onCancel();
      }}
      initialFocusRef={cancelRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            loading={loading}
            loadingText={confirmingLabel}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
