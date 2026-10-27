import { act, fireEvent, render, screen } from "@testing-library/react";
import { MAX_TOASTS, TOAST_DURATION_MS, ToastProvider } from "@/components/toast/ToastProvider";
import { useToast } from "@/components/toast/useToast";
import { messages } from "@/lib/messages";

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.success("Todo added")}>
        Success
      </button>
      <button type="button" onClick={() => toast.error("Couldn't save")}>
        Error
      </button>
    </>
  );
}

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

function renderToasts() {
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );
  const region = screen.getByRole("region", { name: messages.toast.region });
  return { region };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ToastProvider and useToast", () => {
  it("shows the message inside a polite live region that exists before any toast", () => {
    const { region } = renderToasts();
    const live = region.querySelector("[aria-live]");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toBeEmptyDOMElement();

    click("Success");

    expect(region).toHaveTextContent("Todo added");
  });

  it("hides a toast after about 5 seconds", () => {
    const { region } = renderToasts();

    click("Success");
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));
    expect(region).toHaveTextContent("Todo added");

    act(() => vi.advanceTimersByTime(1));
    expect(region).not.toHaveTextContent("Todo added");
  });

  it("pauses while hovered, then finishes the remaining time", () => {
    const { region } = renderToasts();

    click("Success");
    act(() => vi.advanceTimersByTime(2_000));
    const toast = region.querySelector("li")!;
    fireEvent.mouseEnter(toast);
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS * 2));
    expect(region).toHaveTextContent("Todo added");

    fireEvent.mouseLeave(toast);
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 2_000));
    expect(region).not.toHaveTextContent("Todo added");
  });

  it("stays while its dismiss button has keyboard focus", () => {
    const { region } = renderToasts();

    click("Error");
    act(() => screen.getByRole("button", { name: messages.toast.dismiss }).focus());
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS * 2));

    expect(region).toHaveTextContent("Couldn't save");
  });

  it("can be dismissed with its close button", () => {
    const { region } = renderToasts();

    click("Error");
    click(messages.toast.dismiss);

    expect(region).not.toHaveTextContent("Couldn't save");
  });

  it(`keeps only the newest ${MAX_TOASTS} toasts`, () => {
    const { region } = renderToasts();

    click("Error");
    for (let i = 0; i < MAX_TOASTS; i++) {
      click("Success");
    }

    expect(region.querySelectorAll("li")).toHaveLength(MAX_TOASTS);
    expect(region).not.toHaveTextContent("Couldn't save");
  });

  it("fails loudly when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Trigger />)).toThrow(/ToastProvider/);
  });
});
