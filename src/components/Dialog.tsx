import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";

type DialogProps = {
  title: string;
  description?: ReactNode;
  /** Called on Escape. The parent decides whether to unmount the dialog. */
  onClose: () => void;
  /** Receives focus when the dialog opens. Defaults to the browser's choice (the first control). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * A modal built on the native `<dialog>` and `showModal()`, which makes the rest of the page
 * inert (the focus trap) and turns Escape into a `cancel` event. Render it to open it and
 * unmount it to close it; focus then returns to the element that was focused before.
 */
export function Dialog({
  title,
  description,
  onClose,
  initialFocusRef,
  children,
  footer,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const opener = document.activeElement;
    dialog.showModal();

    const target = initialFocusRef?.current;
    if (target) target.focus();
    else if (!dialog.contains(document.activeElement)) dialog.focus();

    function handleCancel(event: Event) {
      // Keep the dialog open until React unmounts it, so state and DOM never disagree.
      event.preventDefault();
      onCloseRef.current();
    }
    // Browsers may still close it (e.g. a repeated Escape); tell the parent so state follows.
    // If the parent keeps it mounted anyway (e.g. while busy), reopen it once React has rendered.
    let active = true;
    function handleClose() {
      onCloseRef.current();
      queueMicrotask(() => {
        if (active && dialog && !dialog.open) dialog.showModal();
      });
    }
    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);

    return () => {
      active = false;
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [initialFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      tabIndex={-1}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-border bg-surface p-6 text-fg shadow-dialog",
        "backdrop:bg-fg/50",
        className,
      )}
    >
      <h2 id={titleId} className="break-words">
        {title}
      </h2>
      {description && (
        <div id={descriptionId} className="mt-2 text-sm break-words text-fg-muted">
          {description}
        </div>
      )}
      {children && <div className="mt-5">{children}</div>}
      {footer && (
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>
      )}
    </dialog>
  );
}
