import { ApiError } from "@/lib/ApiError";
import { fieldError, showSubmitError, withUserFacingError } from "@/lib/formErrors";
import { messages } from "@/lib/messages";

type Values = { email: string; password: string };

describe("showSubmitError", () => {
  const fields = ["email", "password"] as const;

  it("shows a string at form level", () => {
    const setError = vi.fn();
    showSubmitError<Values>("Email or password is incorrect.", setError, fields);
    expect(setError).toHaveBeenCalledWith("root.server", {
      message: "Email or password is incorrect.",
    });
  });

  it("shows a field error under its field and moves focus there", () => {
    const setError = vi.fn();
    showSubmitError<Values>(fieldError("email", "Taken."), setError, fields);
    expect(setError).toHaveBeenCalledWith("email", { message: "Taken." }, { shouldFocus: true });
  });

  it("falls back to form level for a field the form does not have", () => {
    const setError = vi.fn();
    showSubmitError<Values>(fieldError("name", "Too short."), setError, fields);
    expect(setError).toHaveBeenCalledWith("root.server", { message: "Too short." });
  });

  it("never shows a technical error: anything else gets the generic message", () => {
    const setError = vi.fn();
    showSubmitError<Values>(new TypeError("Failed to fetch"), setError, fields);
    expect(setError).toHaveBeenCalledWith("root.server", { message: messages.errors.server });
  });
});

describe("withUserFacingError", () => {
  it("passes a successful result through", async () => {
    await expect(withUserFacingError(Promise.resolve(42))).resolves.toBe(42);
  });

  it("rejects with the user-facing message instead of the raw error", async () => {
    const failure = Promise.reject(ApiError.network());
    await expect(withUserFacingError(failure)).rejects.toBe(messages.errors.network);
  });
});
