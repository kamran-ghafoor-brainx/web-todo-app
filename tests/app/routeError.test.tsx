import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "@/app/router";
import { messages } from "@/lib/messages";

vi.mock("@/pages/DevMailboxPage", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

describe("route error boundary", () => {
  it("shows the error page inside the app frame when a page fails to load", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const router = createMemoryRouter(routes, { initialEntries: ["/dev/mailbox"] });
    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { level: 1, name: messages.routeError.title }),
    ).toBeVisible();
    expect(screen.getByRole("banner")).toHaveTextContent(messages.app.name);
    expect(screen.getByRole("button", { name: messages.routeError.reload })).toBeVisible();
    expect(screen.getByRole("link", { name: messages.routeError.homeLink })).toHaveAttribute(
      "href",
      "/",
    );

    consoleError.mockRestore();
  });
});
