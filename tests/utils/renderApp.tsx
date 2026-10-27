import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { Provider } from "react-redux";
import { createMemoryRouter, RouterProvider, type InitialEntry } from "react-router";
import { routes } from "@/app/router";
import { registerSessionListeners } from "@/app/sessionListeners";
import { makeStore } from "@/app/store";

/** Renders the whole route tree at `entry` with a fresh store, like the real app. */
export function renderApp(entry: InitialEntry, { strict = false } = {}) {
  const store = makeStore();
  onTestFinished(registerSessionListeners(store));
  const router = createMemoryRouter(routes, { initialEntries: [entry] });
  const app = (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
  const result = render(strict ? <StrictMode>{app}</StrictMode> : app);

  return {
    ...result,
    store,
    router,
    user: userEvent.setup(),
    path: () => router.state.location.pathname,
  };
}
