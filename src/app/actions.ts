import { createAction } from "@reduxjs/toolkit";

/**
 * The session ended (logout, a 401 on the current token, or logout in another tab).
 * The root reducer resets every slice to its initial state when it sees this event.
 */
export const sessionEnded = createAction("app/sessionEnded");
