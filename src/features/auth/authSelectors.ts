import type { RootState } from "@/app/store";

export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.status === "authenticated";
export const selectBootstrapError = (state: RootState) => state.auth.bootstrapError;
export const selectSessionEndReason = (state: RootState) => state.auth.endReason;
