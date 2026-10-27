import { sessionEnded } from "@/app/actions";
import type { AppStore } from "@/app/store";
import { bootstrapSession } from "@/features/auth/authThunks";
import { setUnauthorizedHandler } from "@/lib/http";
import { tokenStorage } from "@/lib/tokenStorage";

/**
 * Connects `lib/` session signals to the store. `http` calls the handler once per token,
 * only for a 401 on a request that carried the current token (FR-A10, EC-25).
 * Returns a cleanup function.
 */
export function registerSessionListeners(store: AppStore): () => void {
  setUnauthorizedHandler(() => {
    tokenStorage.clear();
    store.dispatch(sessionEnded({ reason: "expired" }));
  });

  // Another tab logged out or replaced the token, so this tab's session is over (EC-27).
  const stopTabSync = tokenStorage.subscribe(() => {
    if (store.getState().auth.status !== "authenticated") return;
    store.dispatch(sessionEnded({ reason: "loggedOut" }));
  });

  return () => {
    setUnauthorizedHandler(null);
    stopTabSync();
  };
}

/** What the app does once at startup: listen for session signals, then decide the session (FR-A05). */
export function startSession(store: AppStore): () => void {
  const stopListening = registerSessionListeners(store);
  void store.dispatch(bootstrapSession());
  return stopListening;
}
