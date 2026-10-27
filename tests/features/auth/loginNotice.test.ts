import { loginStateAfterSessionEnd, readLoginNotice } from "@/features/auth/loginNotice";
import { messages } from "@/lib/messages";

describe("loginStateAfterSessionEnd", () => {
  it("turns a logout into the 'logged out' notice", () => {
    const state = loginStateAfterSessionEnd("loggedOut");
    expect(readLoginNotice(state)).toEqual({ variant: "info", message: messages.auth.loggedOut });
  });

  it("turns an expired session into the 'session expired' notice", () => {
    const state = loginStateAfterSessionEnd("expired");
    expect(readLoginNotice(state)?.message).toBe(messages.auth.sessionExpired);
  });

  it("shows no notice when no session has ended (a first visit)", () => {
    expect(loginStateAfterSessionEnd(null)).toBeUndefined();
  });
});
