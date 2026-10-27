import { createAction } from "@reduxjs/toolkit";

/** `loggedOut`: this tab or another one logged out. `expired`: the server rejected the token. */
export type SessionEndReason = "loggedOut" | "expired";

/**
 * The session ended (logout, a 401 on the current token, or logout in another tab).
 * The root reducer resets every slice to its initial state when it sees this event.
 */
export const sessionEnded = createAction<{ reason: SessionEndReason }>("app/sessionEnded");
