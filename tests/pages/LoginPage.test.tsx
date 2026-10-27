import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { messages } from "@/lib/messages";
import { LoginPage } from "@/pages/LoginPage";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

describe("LoginPage", () => {
  it("sets the browser tab title", async () => {
    renderWithProviders(<LoginPage />, { route: "/login" });
    await waitFor(() => expect(document.title).toBe("Log in · Todo App"));
  });

  it("shows the heading, the form and the link to sign up", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("heading", { level: 1, name: messages.login.title })).toBeVisible();
    expect(screen.getByRole("textbox", { name: messages.fields.email })).toBeVisible();
    expect(screen.getByRole("button", { name: messages.login.submit })).toBeVisible();
    expect(screen.getByRole("link", { name: messages.login.signupLink })).toBeVisible();
  });

  it("goes to the signup page from the footer link", async () => {
    const { router } = renderWithProviders(<LoginPage />, { route: "/login" });

    await userEvent.click(screen.getByRole("link", { name: messages.login.signupLink }));

    expect(router.state.location.pathname).toBe("/signup");
  });
});
