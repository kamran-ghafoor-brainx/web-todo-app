import { sessionEnded } from "@/app/actions";
import { createAppAsyncThunk } from "@/app/createAppAsyncThunk";
import { authApi } from "@/features/auth/authApi";
import type { LoginRequest, User } from "@/features/auth/types";
import { ApiError } from "@/lib/ApiError";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { tokenStorage } from "@/lib/tokenStorage";

/**
 * Decides the session on app start (FR-A05). Resolves with the user, or `null` when there is
 * no valid token. A network or server failure rejects, so the user is not logged out (EC-24).
 */
export const bootstrapSession = createAppAsyncThunk<User | null, void>(
  "auth/bootstrapSession",
  async (_, { rejectWithValue }) => {
    if (!tokenStorage.get()) return null;

    try {
      return await authApi.me();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        tokenStorage.clear();
        return null;
      }
      return rejectWithValue(getErrorMessage(error));
    }
  },
  { condition: (_, { getState }) => getState().auth.status === "unknown" },
);

/** Rejects with a user-facing message; no token is stored on failure (FR-A04). */
export const login = createAppAsyncThunk<User, LoginRequest>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { accessToken, user } = await authApi.login(credentials);
      tokenStorage.set(accessToken);
      return user;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/** Best-effort server logout; the local session is always cleared (FR-A06, EC-30). */
export const logout = createAppAsyncThunk<void, void>("auth/logout", async (_, { dispatch }) => {
  try {
    await authApi.logout();
  } catch {
    // The server session may already be gone; the local logout still goes ahead.
  }
  tokenStorage.clear();
  dispatch(sessionEnded({ reason: "loggedOut" }));
});
