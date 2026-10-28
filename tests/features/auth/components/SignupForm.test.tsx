import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { fieldError, type SubmitHandler } from "@/lib/formErrors";
import type { SignupValues } from "@/features/auth/authSchemas";
import { messages } from "@/lib/messages";

function renderForm(onSubmit: SubmitHandler<SignupValues> = vi.fn().mockResolvedValue(undefined)) {
  const user = userEvent.setup();
  render(<SignupForm onSubmit={onSubmit} />);
  const field = (label: string) => screen.getByLabelText(label);
  return {
    user,
    onSubmit,
    name: field(messages.fields.name),
    email: field(messages.fields.email),
    password: field(messages.fields.password),
    confirm: field(messages.fields.confirmPassword),
    submit: () => screen.getByRole("button", { name: messages.signup.submit }),
  };
}

async function fillValid(form: ReturnType<typeof renderForm>) {
  await form.user.type(form.name, "Ann Lee");
  await form.user.type(form.email, "Ann@Example.com");
  await form.user.type(form.password, "secret12");
  await form.user.type(form.confirm, "secret12");
}

describe("SignupForm", () => {
  it("shows the password rule before anything is typed", () => {
    const { password } = renderForm();
    expect(password).toHaveAccessibleDescription(messages.fields.passwordHint);
  });

  it("shows every required error, focuses the first field and does not submit", async () => {
    const { user, onSubmit, name, email, password, confirm, submit } = renderForm();

    await user.click(submit());

    expect(name).toHaveAccessibleDescription(messages.validation.nameRequired);
    expect(email).toHaveAccessibleDescription(messages.validation.emailRequired);
    expect(password).toHaveAccessibleDescription(
      `${messages.fields.passwordHint} ${messages.validation.passwordRequired}`,
    );
    expect(confirm).toHaveAccessibleDescription(messages.validation.confirmPasswordRequired);
    expect(name).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a mismatch under the confirm field", async () => {
    const form = renderForm();
    await fillValid(form);
    await form.user.clear(form.confirm);
    await form.user.type(form.confirm, "secret13");
    await form.user.click(form.submit());

    expect(form.confirm).toHaveAccessibleDescription(messages.validation.passwordsDoNotMatch);
    expect(form.onSubmit).not.toHaveBeenCalled();
  });

  it("submits cleaned values", async () => {
    const form = renderForm();
    await fillValid(form);
    await form.user.click(form.submit());

    expect(form.onSubmit).toHaveBeenCalledExactlyOnceWith({
      name: "Ann Lee",
      email: "ann@example.com",
      password: "secret12",
      confirmPassword: "secret12",
    });
  });

  it("shows an already-registered email under the email field and focuses it", async () => {
    const form = renderForm(
      vi.fn().mockRejectedValue(fieldError("email", messages.auth.emailTaken)),
    );
    await fillValid(form);
    await form.user.click(form.submit());

    expect(await screen.findByText(messages.auth.emailTaken)).toBeInTheDocument();
    expect(form.email).toHaveAccessibleDescription(messages.auth.emailTaken);
    expect(form.email).toHaveFocus();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows other failures in the form alert", async () => {
    const form = renderForm(vi.fn().mockRejectedValue(messages.errors.network));
    await fillValid(form);
    await form.user.click(form.submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.errors.network);
  });

  it("uses new-password autocomplete on both password fields (EC-06)", () => {
    const { name, password, confirm } = renderForm();
    expect(name).toHaveAttribute("autocomplete", "name");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(confirm).toHaveAttribute("autocomplete", "new-password");
  });
});
