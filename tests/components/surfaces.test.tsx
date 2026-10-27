import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppLogo } from "@/components/AppLogo";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { TextLink } from "@/components/TextLink";

describe("Card", () => {
  it("renders its children and passes native props through", () => {
    render(
      <Card aria-label="Login form">
        <p>Content</p>
      </Card>,
    );
    expect(screen.getByLabelText("Login form")).toHaveTextContent("Content");
  });
});

describe("AppLogo", () => {
  it("is read as the app name, with the graphic hidden", () => {
    const { container } = render(<AppLogo />);
    expect(container).toHaveTextContent("Todo App");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("TextLink", () => {
  it("renders a link to the given in-app path", () => {
    render(
      <MemoryRouter>
        <TextLink to="/signup">Sign up</TextLink>
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });
});

describe("EmptyState", () => {
  it("shows a heading, a description and an action", () => {
    render(
      <EmptyState
        title="No todos yet"
        description="Add your first todo to get started."
        action={<button type="button">Add a todo</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "No todos yet" })).toBeVisible();
    expect(screen.getByText("Add your first todo to get started.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Add a todo" })).toBeVisible();
  });
});
