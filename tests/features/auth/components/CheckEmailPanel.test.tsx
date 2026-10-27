import { act, fireEvent, render, screen } from "@testing-library/react";
import { CheckEmailPanel } from "@/features/auth/components/CheckEmailPanel";
import { messages } from "@/lib/messages";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function click(button: HTMLElement) {
  await act(async () => {
    fireEvent.click(button);
  });
}

function advanceSeconds(seconds: number) {
  for (let i = 0; i < seconds; i += 1) {
    act(() => vi.advanceTimersByTime(1000));
  }
}

function renderPanel(onResend: () => Promise<void> = vi.fn().mockResolvedValue(undefined)) {
  render(
    <CheckEmailPanel
      message={messages.auth.checkEmail("ann@example.com")}
      hint={messages.checkEmail.verifyHint}
      onResend={onResend}
    />,
  );
  return { onResend };
}

describe("CheckEmailPanel", () => {
  it("announces where the email went", () => {
    renderPanel();
    expect(screen.getByRole("status")).toHaveTextContent("ann@example.com");
  });

  it("blocks resending for 60 seconds, showing the countdown", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: "Resend in 60s" })).toBeDisabled();

    advanceSeconds(59);
    expect(screen.getByRole("button", { name: "Resend in 1s" })).toBeDisabled();

    advanceSeconds(1);
    expect(screen.getByRole("button", { name: messages.checkEmail.resend })).toBeEnabled();
  });

  it("resends, confirms with the generic message and restarts the cooldown", async () => {
    const { onResend } = renderPanel();
    advanceSeconds(60);

    await click(screen.getByRole("button", { name: messages.checkEmail.resend }));

    expect(onResend).toHaveBeenCalledOnce();
    expect(screen.getByText(messages.auth.resendSent)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend in 60s" })).toBeDisabled();
  });

  it("shows a failure (e.g. the server's 429) and lets the user try again later", async () => {
    const onResend = vi.fn().mockRejectedValue(messages.errors.rateLimitedFor(30));
    renderPanel(onResend);
    advanceSeconds(60);

    await click(screen.getByRole("button", { name: messages.checkEmail.resend }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please try again in 30 seconds.");
    expect(screen.getByRole("button", { name: messages.checkEmail.resend })).toBeEnabled();
  });
});
