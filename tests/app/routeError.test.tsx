import { screen } from "@testing-library/react";
import { messages } from "@/lib/messages";
import { renderApp } from "@tests/utils/renderApp";

vi.mock("@/pages/DevMailboxPage", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

describe("route error boundary", () => {
  it("shows the error page inside the app frame when a page fails to load", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderApp("/dev/mailbox");

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
