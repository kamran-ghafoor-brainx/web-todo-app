import { render, screen } from "@testing-library/react";
import { Spinner } from "@/components/Spinner";

describe("Spinner", () => {
  it("is announced by name when it has a label", () => {
    render(<Spinner label="Loading todos" />);
    expect(screen.getByRole("img", { name: "Loading todos" })).toBeInTheDocument();
  });

  it("is hidden from screen readers when it has no label", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
