import { createSlice } from "@reduxjs/toolkit";
import { sessionEnded, type SessionEndReason } from "@/app/actions";
import { bootstrapSession, login } from "@/features/auth/authThunks";
import type { User } from "@/features/auth/types";
import { messages } from "@/lib/messages";

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  user: User | null;
  /** Set when startup could not reach the server; the retry screen shows it. */
  bootstrapError: string | null;
  /** Why the last session ended, so the login page can say so. */
  endReason: SessionEndReason | null;
};

export const initialAuthState: AuthState = {
  status: "unknown",
  user: null,
  bootstrapError: null,
  endReason: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        state.bootstrapError = null;
      })
      // A login or session end may have decided the session first; a late startup answer is stale.
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        if (state.status !== "unknown") return;
        state.user = action.payload;
        state.status = action.payload ? "authenticated" : "unauthenticated";
      })
      .addCase(bootstrapSession.rejected, (state, action) => {
        if (state.status !== "unknown") return;
        state.bootstrapError = action.payload ?? messages.errors.server;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.bootstrapError = null;
        state.endReason = null;
      })
      // The root reducer has already reset this slice; the session is now known to be over.
      .addCase(sessionEnded, (state, action) => {
        state.status = "unauthenticated";
        state.endReason = action.payload.reason;
      });
  },
});
