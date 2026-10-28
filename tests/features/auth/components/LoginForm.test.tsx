import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm, type LoginSubmitHandler } from "@/features/auth/components/LoginForm";
import { messages } from "@/lib/messages";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

function renderForm(onSubmit: LoginSubmitHandler = vi.fn().mockResolvedValue(undefined)) {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm onSubmit={onSubmit} />, { route: "/login" });
  return {
    user,
    onSubmit,
    email: screen.getByRole("textbox", { name: messages.fields.email }),
    password: screen.getByLabelText(messages.fields.password),
    submit: () => screen.getByRole("button", { name: messages.login.submit }),
  };
}

describe("LoginForm", () => {
  it("shows both required errors, focuses the email field and does not submit", async () => {
    const { user, onSubmit, email, password, submit } = renderForm();

    await user.click(submit());

    expect(email).toHaveAccessibleDescription(messages.validation.emailRequired);
    expect(password).toHaveAccessibleDescription(messages.validation.passwordRequired);
    expect(email).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const { user, email, password, submit } = renderForm();

    await user.type(email, "ann@");
    await user.type(password, "secret1");
    await user.click(submit());

    expect(email).toHaveAccessibleDescription(messages.validation.emailInvalid);
    expect(email).toHaveAttribute("aria-invalid", "true");
  });

  it("focuses the password when it is the only invalid field", async () => {
    const { user, email, password, submit } = renderForm();

    await user.type(email, "ann@example.com");
    await user.click(submit());

    expect(password).toHaveFocus();
  });

  it("clears an error once the user fixes the field", async () => {
    const { user, email, password, submit } = renderForm();

    await user.click(submit());
    await user.type(email, "ann@example.com");

    expect(email).not.toHaveAttribute("aria-invalid");
    expect(password).toHaveAttribute("aria-invalid", "true");
  });

  it("submits the cleaned email and the password exactly as typed", async () => {
    const { user, onSubmit, email, password, submit } = renderForm();

    await user.type(email, "  Ann@Example.COM ");
    await user.type(password, " secret 1 ");
    await user.click(submit());

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      email: "ann@example.com",
      password: " secret 1 ",
    });
  });

  it("sends one request on a double click and shows the busy state while pending", async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { user, email, password, submit } = renderForm(onSubmit);

    await user.type(email, "ann@example.com");
    await user.type(password, "secret1");
    await user.dblClick(submit());

    const busyButton = screen.getByRole("button", { name: messages.login.submitting });
    expect(busyButton).toBeDisabled();
    expect(busyButton).toHaveAttribute("aria-busy", "true");
    expect(onSubmit).toHaveBeenCalledOnce();

    finish();
    await waitFor(() => expect(submit()).toBeEnabled());
  });

  it("shows a rejected message from the page in an error alert", async () => {
    const onSubmit = vi.fn().mockRejectedValue(messages.auth.invalidCredentials);
    const { user, email, password, submit } = renderForm(onSubmit);

    await user.type(email, "ann@example.com");
    await user.type(password, "wrong-password");
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.auth.invalidCredentials);
  });

  it("never shows a technical error: unexpected failures get the generic message", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const { user, email, password, submit } = renderForm(onSubmit);

    await user.type(email, "ann@example.com");
    await user.type(password, "secret1");
    await user.click(submit());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(messages.errors.server);
    expect(alert).not.toHaveTextContent("Failed to fetch");
  });

  it("tells password managers which fields these are", () => {
    const { email, password } = renderForm();
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(password).toHaveAttribute("autocomplete", "current-password");
  });

  it("links to the forgot password page", () => {
    renderForm();
    expect(screen.getByRole("link", { name: messages.login.forgotPassword })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
