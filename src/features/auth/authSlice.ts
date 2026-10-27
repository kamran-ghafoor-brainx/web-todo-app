import { createSlice } from "@reduxjs/toolkit";
import { sessionEnded } from "@/app/actions";
import type { User } from "@/features/auth/types";

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  user: User | null;
  bootstrapError: string | null;
};

export const initialAuthState: AuthState = {
  status: "unknown",
  user: null,
  bootstrapError: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialAuthState,
  reducers: {},
  extraReducers: (builder) => {
    // The root reducer has already reset this slice; the session is now known to be over.
    builder.addCase(sessionEnded, (state) => {
      state.status = "unauthenticated";
    });
  },
});
