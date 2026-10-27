import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "@/app/router";

function renderApp(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("app routes", () => {
  it("shows the login page inside the auth layout at /login", () => {
    renderApp("/login");

    expect(screen.getByRole("heading", { level: 1, name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveTextContent("Todo App");
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("heading", { level: 1 }));
  });

  it("links to the signup page from the login footer", () => {
    renderApp("/login");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });

  it("redirects / to /login for now", () => {
    const router = renderApp("/");
    expect(router.state.location.pathname).toBe("/login");
  });
});
