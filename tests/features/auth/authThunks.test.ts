import { http as mswHttp, HttpResponse } from "msw";
import { makeStore } from "@/app/store";
import { authApi } from "@/features/auth/authApi";
import { initialAuthState } from "@/features/auth/authSlice";
import { bootstrapSession, login, logout } from "@/features/auth/authThunks";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { server } from "@/mocks/server";

const demo = { email: MAGIC_EMAILS.demo, password: MAGIC_PASSWORD };

async function storeDemoToken() {
  const { accessToken } = await authApi.login(demo);
  tokenStorage.set(accessToken);
  return accessToken;
}

describe("bootstrapSession (T-U08)", () => {
  it("becomes unauthenticated without a request when there is no token", async () => {
    const onMe = vi.fn();
    server.events.on("request:start", ({ request }) => {
      if (request.url.endsWith("/auth/me")) onMe();
    });
    const store = makeStore();

    await store.dispatch(bootstrapSession());

    expect(store.getState().auth).toEqual({ ...initialAuthState, status: "unauthenticated" });
    expect(onMe).not.toHaveBeenCalled();
    server.events.removeAllListeners();
  });

  it("restores the user from a valid stored token", async () => {
    await storeDemoToken();
    const store = makeStore();

    await store.dispatch(bootstrapSession());

    expect(store.getState().auth.status).toBe("authenticated");
    expect(store.getState().auth.user?.email).toBe(MAGIC_EMAILS.demo);
  });

  it("clears an invalid token and becomes unauthenticated (EC-23)", async () => {
    tokenStorage.set("mock.not-a-real-token");
    const store = makeStore();

    await store.dispatch(bootstrapSession());

    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(store.getState().auth.user).toBeNull();
    expect(tokenStorage.get()).toBeNull();
  });

  it("keeps the session undecided and the token on a server error (EC-24)", async () => {
    tokenStorage.set("mock.some-token");
    server.use(mswHttp.get("/api/auth/me", () => HttpResponse.json({}, { status: 500 })));
    const store = makeStore();

    await store.dispatch(bootstrapSession());

    expect(store.getState().auth.status).toBe("unknown");
    expect(store.getState().auth.bootstrapError).toBe(messages.errors.server);
    expect(tokenStorage.get()).toBe("mock.some-token");
  });

  it("shows the network message when the server is unreachable, and clears it on retry", async () => {
    await storeDemoToken();
    server.use(mswHttp.get("/api/auth/me", () => HttpResponse.error()));
    const store = makeStore();

    await store.dispatch(bootstrapSession());
    expect(store.getState().auth.bootstrapError).toBe(messages.errors.network);

    server.resetHandlers();
    await store.dispatch(bootstrapSession());

    expect(store.getState().auth.status).toBe("authenticated");
    expect(store.getState().auth.bootstrapError).toBeNull();
  });

  it("does not run again once the session is decided", async () => {
    const store = makeStore({ auth: { ...initialAuthState, status: "unauthenticated" } });

    const result = await store.dispatch(bootstrapSession());

    expect(result.meta).toMatchObject({ condition: true });
  });
});

describe("login (T-U08)", () => {
  it("stores the token and the user on success", async () => {
    const store = makeStore({ auth: { ...initialAuthState, status: "unauthenticated" } });

    const user = await store.dispatch(login(demo)).unwrap();

    expect(user.email).toBe(MAGIC_EMAILS.demo);
    expect(tokenStorage.get()).not.toBeNull();
    expect(store.getState().auth).toMatchObject({ status: "authenticated", user });
  });

  it("rejects with the generic message and stores no token for a wrong password", async () => {
    const store = makeStore({ auth: { ...initialAuthState, status: "unauthenticated" } });

    await expect(store.dispatch(login({ ...demo, password: "wrongpass1" })).unwrap()).rejects.toBe(
      messages.auth.invalidCredentials,
    );

    expect(tokenStorage.get()).toBeNull();
    expect(store.getState().auth.status).toBe("unauthenticated");
  });

  it("stores no token for an unverified account", async () => {
    const store = makeStore();

    await expect(
      store.dispatch(login({ email: MAGIC_EMAILS.unverified, password: MAGIC_PASSWORD })).unwrap(),
    ).rejects.toBe(messages.auth.emailNotVerified);

    expect(tokenStorage.get()).toBeNull();
  });
});

describe("logout (T-U08)", () => {
  it("ends the session on the server and clears the token and all state", async () => {
    await storeDemoToken();
    const store = makeStore();
    await store.dispatch(bootstrapSession());

    await store.dispatch(logout());

    expect(tokenStorage.get()).toBeNull();
    expect(store.getState().auth).toEqual({
      ...initialAuthState,
      status: "unauthenticated",
      endReason: "loggedOut",
    });
  });

  it("still logs out locally when the logout request fails (EC-30)", async () => {
    await storeDemoToken();
    server.use(mswHttp.post("/api/auth/logout", () => HttpResponse.error()));
    const store = makeStore();
    await store.dispatch(bootstrapSession());

    await store.dispatch(logout());

    expect(tokenStorage.get()).toBeNull();
    expect(store.getState().auth.status).toBe("unauthenticated");
    expect(store.getState().auth.user).toBeNull();
  });
});
