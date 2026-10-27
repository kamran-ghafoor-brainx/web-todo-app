import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";

type Options = {
  route?: string;
  path?: string;
};

export function renderWithProviders(ui: ReactElement, { route = "/", path }: Options = {}) {
  const router = createMemoryRouter(
    [
      { path: path ?? route.split("?")[0], element: ui },
      { path: "*", element: null },
    ],
    { initialEntries: [route] },
  );

  return { router, ...render(<RouterProvider router={router} />) };
}
