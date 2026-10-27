import { render, screen } from "@testing-library/react";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";

describe("Alert", () => {
  it('uses role="alert" for errors, so they are announced immediately', () => {
    render(<Alert variant="error">Email or password is incorrect.</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Email or password is incorrect.");
  });

  it.each(["success", "info"] as const)('uses role="status" for %s messages', (variant) => {
    render(<Alert variant={variant}>Password updated. Please log in.</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("Password updated. Please log in.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the title before the message", () => {
    render(
      <Alert variant="info" title="Check your inbox">
        We sent you a link.
      </Alert>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /^Check your inbox.*We sent you a link\.$/,
    );
  });

  it("renders an action the user can take", () => {
    render(
      <Alert variant="error" action={<Button variant="secondary">Resend email</Button>}>
        Please verify your email before logging in.
      </Alert>,
    );
    expect(screen.getByRole("button", { name: "Resend email" })).toBeInTheDocument();
  });

  it("keeps the icon hidden from screen readers", () => {
    render(<Alert variant="success">Saved.</Alert>);
    expect(screen.getByRole("status").querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
