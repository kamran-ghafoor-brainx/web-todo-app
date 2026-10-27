import { StrictMode, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import { ToastProvider } from "@/components/toast/ToastProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <Provider store={store}>
        <ToastProvider>{children}</ToastProvider>
      </Provider>
    </StrictMode>
  );
}
