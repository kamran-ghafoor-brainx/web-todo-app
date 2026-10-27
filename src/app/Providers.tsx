import { StrictMode, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/app/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <Provider store={store}>{children}</Provider>
    </StrictMode>
  );
}
