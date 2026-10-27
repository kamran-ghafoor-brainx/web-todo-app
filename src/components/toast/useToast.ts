import { useContext } from "react";
import { ToastContext, type ToastApi } from "@/components/toast/toastContext";

/**
 * Shows short, non-blocking messages. Do not toast while a modal `Dialog` is open: the browser
 * makes everything outside the dialog inert, so the toast would be hidden and not announced.
 * Show errors inside the dialog instead, and toast after it closes.
 */
export function useToast(): ToastApi {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>");
  return toast;
}
