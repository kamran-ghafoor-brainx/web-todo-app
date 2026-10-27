import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider } from "react-router";
import { makeStore, type AppStore, type RootState } from "@/app/store";
import { ToastProvider } from "@/components/toast/ToastProvider";

type Options = {
  route?: string;
  path?: string;
} & (
  | { preloadedState?: Partial<RootState>; store?: never }
  | { store: AppStore; preloadedState?: never }
);

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = "/", path } = options;
  const store = options.store ?? makeStore(options.preloadedState);

  const router = createMemoryRouter(
    [
      { path: path ?? route.split("?")[0], element: ui },
      { path: "*", element: null },
    ],
    { initialEntries: [route] },
  );

  return {
    store,
    router,
    user: userEvent.setup(),
    ...render(
      <Provider store={store}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </Provider>,
    ),
  };
}
