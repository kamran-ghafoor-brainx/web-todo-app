import { render, screen } from "@testing-library/react";
import { AuthCard } from "@/features/auth/components/AuthCard";

describe("AuthCard", () => {
  it("renders the title as the page's h1, then the description and content", () => {
    render(
      <AuthCard title="Log in" description="Welcome back." footer="Footer text">
        <p>Form goes here</p>
      </AuthCard>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Log in" })).toBeInTheDocument();
    expect(screen.getByText("Welcome back.")).toBeInTheDocument();
    expect(screen.getByText("Form goes here")).toBeInTheDocument();
    expect(screen.getByText("Footer text")).toBeInTheDocument();
  });

  it("leaves out the description and footer when they are not given", () => {
    const { container } = render(
      <AuthCard title="Log in">
        <p>Form goes here</p>
      </AuthCard>,
    );
    expect(container).toHaveTextContent(/^Log inForm goes here$/);
  });
});
