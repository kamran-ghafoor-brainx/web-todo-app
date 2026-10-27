import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { PasswordField } from "@/components/form/PasswordField";
import { TextArea } from "@/components/form/TextArea";
import { TextField } from "@/components/form/TextField";

describe("TextField", () => {
  it("is labelled by its visible label", () => {
    render(<TextField label="Email" />);
    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
  });

  it("is valid and has no description by default", () => {
    render(<TextField label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("links the hint to the input", () => {
    render(<TextField label="Name" hint="2 to 50 characters." />);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription(
      "2 to 50 characters.",
    );
  });

  it("marks the input invalid and links the error message", () => {
    render(<TextField label="Email" error="Enter a valid email address." />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address.");
  });

  it("links both the hint and the error when both are shown", () => {
    render(<TextField label="Name" hint="2 to 50 characters." error="Name is too short." />);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription(
      "2 to 50 characters. Name is too short.",
    );
  });

  it("gives two fields with the same label different ids", () => {
    render(
      <>
        <TextField label="Email" />
        <TextField label="Email" />
      </>,
    );
    const [first, second] = screen.getAllByRole("textbox", { name: "Email" });
    expect(first?.id).not.toBe(second?.id);
  });

  it("passes the ref and native props through to the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField label="Email" ref={ref} name="email" autoComplete="email" />);
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Email" }));
    expect(ref.current).toHaveAttribute("name", "email");
    expect(ref.current).toHaveAttribute("autocomplete", "email");
  });
});

describe("PasswordField", () => {
  it("hides the password by default", () => {
    render(<PasswordField label="Password" />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show password" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows and hides the password with the toggle", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" />);
    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("does not submit the surrounding form when toggled", async () => {
    const onSubmit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <PasswordField label="Password" />
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("marks the input invalid and links the error message", () => {
    render(<PasswordField label="Password" error="Enter your password." />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter your password.");
  });

  it("disables the toggle together with the input", () => {
    render(<PasswordField label="Password" disabled />);
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });
});

describe("TextArea", () => {
  it("is a labelled multi-line field with linked hint and error", () => {
    render(<TextArea label="Description" hint="Up to 500 characters." error="Too long." />);
    const textarea = screen.getByRole("textbox", { name: "Description" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("Up to 500 characters. Too long.");
  });

  it("passes the ref and native props through to the textarea", async () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextArea label="Description" ref={ref} maxLength={500} name="description" />);

    await userEvent.type(screen.getByRole("textbox", { name: "Description" }), "Two\nlines");

    expect(ref.current).toHaveValue("Two\nlines");
    expect(ref.current).toHaveAttribute("maxlength", "500");
    expect(ref.current).toHaveAttribute("name", "description");
  });
});
