import { ignoreErrors } from "@/lib/ignoreErrors";

describe("ignoreErrors", () => {
  it("runs the action", () => {
    const action = vi.fn();
    ignoreErrors(action);
    expect(action).toHaveBeenCalledOnce();
  });

  it("swallows an error thrown by the action", () => {
    expect(() =>
      ignoreErrors(() => {
        throw new DOMException("Storage is full", "QuotaExceededError");
      }),
    ).not.toThrow();
  });
});
