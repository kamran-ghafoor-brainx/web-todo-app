import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircleIcon, CheckCircleIcon, CloseIcon, InfoIcon } from "@/components/icons";
import { ToastContext, type ToastApi, type ToastVariant } from "@/components/toast/toastContext";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

export const TOAST_DURATION_MS = 5_000;
export const MAX_TOASTS = 3;

const VARIANTS = {
  success: { Icon: CheckCircleIcon, iconClass: "text-success", boxClass: "border-success" },
  error: { Icon: AlertCircleIcon, iconClass: "text-danger", boxClass: "border-danger" },
  info: { Icon: InfoIcon, iconClass: "text-primary", boxClass: "border-primary" },
} as const;

type Toast = { id: number; variant: ToastVariant; message: string };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(() => {
    const show = (variant: ToastVariant, message: string) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { id, variant, message }].slice(-MAX_TOASTS));
    };
    return {
      show,
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    };
  }, []);

  return (
    <ToastContext value={api}>
      {children}
      {/* Always rendered, so screen readers are already watching it when a toast arrives. */}
      <section
        aria-label={messages.toast.region}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end"
      >
        <ol
          aria-live="polite"
          aria-relevant="additions text"
          className="flex w-full max-w-sm flex-col gap-2"
        >
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </ol>
      </section>
    </ToastContext>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const { Icon, iconClass, boxClass } = VARIANTS[toast.variant];
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remainingMs = useRef(TOAST_DURATION_MS);
  const paused = hovered || focused;

  // The timer pauses while the toast is hovered or focused, so it never vanishes mid-read.
  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remainingMs.current);
    return () => {
      clearTimeout(timer);
      remainingMs.current -= Date.now() - startedAt;
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-card border-l-4 bg-surface p-3 text-sm text-fg shadow-dialog",
        boxClass,
      )}
    >
      <Icon className={cn("mt-0.5 shrink-0", iconClass)} />
      <p className="min-w-0 flex-1 py-0.5 break-words">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={messages.toast.dismiss}
        className="-m-1 flex size-8 shrink-0 items-center justify-center rounded-control text-fg-muted hover:text-fg"
      >
        <CloseIcon className="size-4" />
      </button>
    </li>
  );
}
