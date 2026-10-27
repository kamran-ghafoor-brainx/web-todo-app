import { sessionEnded } from "@/app/actions";
import type { AppStore } from "@/app/store";
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

  return () => setUnauthorizedHandler(null);
}
