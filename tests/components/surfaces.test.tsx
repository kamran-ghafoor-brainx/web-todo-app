import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { AppLogo } from "@/components/AppLogo";
import { Card } from "@/components/Card";
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
