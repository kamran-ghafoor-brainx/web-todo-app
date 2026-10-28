import { act, renderHook } from "@testing-library/react";
import { useResendCooldown } from "@/features/auth/hooks/useResendCooldown";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function advanceSeconds(seconds: number) {
  for (let i = 0; i < seconds; i += 1) {
    act(() => vi.advanceTimersByTime(1000));
  }
}

describe("useResendCooldown", () => {
  it("starts idle by default", () => {
    const { result } = renderHook(() => useResendCooldown());
    expect(result.current).toMatchObject({ secondsLeft: 0, isCoolingDown: false });
  });

  it("can start counting down immediately (an email was just sent)", () => {
    const { result } = renderHook(() => useResendCooldown({ startImmediately: true }));
    expect(result.current).toMatchObject({ secondsLeft: 60, isCoolingDown: true });
  });

  it("counts down once per second and ends at zero", () => {
    const { result } = renderHook(() => useResendCooldown({ seconds: 3, startImmediately: true }));

    advanceSeconds(1);
    expect(result.current.secondsLeft).toBe(2);

    advanceSeconds(2);
    expect(result.current).toMatchObject({ secondsLeft: 0, isCoolingDown: false });

    advanceSeconds(5);
    expect(result.current.secondsLeft).toBe(0);
  });

  it("restarts with start(), optionally for a custom length", () => {
    const { result } = renderHook(() => useResendCooldown({ seconds: 60 }));

    act(() => result.current.start());
    expect(result.current.secondsLeft).toBe(60);

    act(() => result.current.start(30));
    expect(result.current.secondsLeft).toBe(30);
  });

  it("stops its timer when the component unmounts", () => {
    const { unmount } = renderHook(() => useResendCooldown({ startImmediately: true }));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
