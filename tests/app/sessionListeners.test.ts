import { http as mswHttp, HttpResponse } from "msw";
import { registerSessionListeners } from "@/app/sessionListeners";
import { makeStore } from "@/app/store";
import { initialAuthState } from "@/features/auth/authSlice";
import { http } from "@/lib/http";
import { TOKEN_STORAGE_KEY, tokenStorage } from "@/lib/tokenStorage";
import { server } from "@/mocks/server";

const user = { id: "u1", name: "Ada", email: "ada@example.com", isEmailVerified: true };

let cleanup: () => void = () => undefined;
afterEach(() => cleanup());

describe("registerSessionListeners (FR-A10)", () => {
  it("ends the session once, as expired, on a 401 for the current token", async () => {
    tokenStorage.set("mock.current-token");
    server.use(mswHttp.get("/api/anything", () => HttpResponse.json({}, { status: 401 })));
    const store = makeStore({ auth: { ...initialAuthState, status: "authenticated", user } });
    const dispatch = vi.spyOn(store, "dispatch");
    cleanup = registerSessionListeners(store);

    await Promise.allSettled([http.get("/anything"), http.get("/anything")]);

    expect(store.getState().auth).toEqual({
      ...initialAuthState,
      status: "unauthenticated",
      endReason: "expired",
    });
    expect(tokenStorage.get()).toBeNull();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("ignores a 401 on a public request that sent no token (EC-26)", async () => {
    tokenStorage.set("mock.current-token");
    server.use(mswHttp.post("/api/public", () => HttpResponse.json({}, { status: 401 })));
    const store = makeStore({ auth: { ...initialAuthState, status: "authenticated", user } });
    cleanup = registerSessionListeners(store);

    await http.post("/public", {}, { auth: false }).catch(() => undefined);

    expect(store.getState().auth.status).toBe("authenticated");
    expect(tokenStorage.get()).toBe("mock.current-token");
  });
});

function otherTabChangesToken(newValue: string | null) {
  window.dispatchEvent(
    new StorageEvent("storage", { key: TOKEN_STORAGE_KEY, newValue, storageArea: localStorage }),
  );
}

describe("registerSessionListeners: other tabs (EC-27)", () => {
  it("ends this tab's session as a logout when another tab logs out", () => {
    const store = makeStore({ auth: { ...initialAuthState, status: "authenticated", user } });
    cleanup = registerSessionListeners(store);

    otherTabChangesToken(null);

    expect(store.getState().auth).toEqual({
      ...initialAuthState,
      status: "unauthenticated",
      endReason: "loggedOut",
    });
  });

  it("ends this tab's session when another tab replaces the token", () => {
    const store = makeStore({ auth: { ...initialAuthState, status: "authenticated", user } });
    cleanup = registerSessionListeners(store);

    otherTabChangesToken("mock.someone-else");

    expect(store.getState().auth.status).toBe("unauthenticated");
  });

  it.each(["unauthenticated", "unknown"] as const)(
    "does nothing while this tab is %s",
    (status) => {
      const store = makeStore({ auth: { ...initialAuthState, status } });
      const dispatch = vi.spyOn(store, "dispatch");
      cleanup = registerSessionListeners(store);

      otherTabChangesToken(null);

      expect(dispatch).not.toHaveBeenCalled();
    },
  );

  it("stops listening after cleanup", () => {
    const store = makeStore({ auth: { ...initialAuthState, status: "authenticated", user } });
    registerSessionListeners(store)();

    otherTabChangesToken(null);

    expect(store.getState().auth.status).toBe("authenticated");
  });
});
