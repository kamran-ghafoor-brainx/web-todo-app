import { delay, http as mock, HttpResponse } from "msw";
import { ApiError } from "@/lib/ApiError";
import { http, setUnauthorizedHandler } from "@/lib/http";
import { tokenStorage } from "@/lib/tokenStorage";
import { server } from "@/mocks/server";

afterEach(() => {
  tokenStorage.clear();
  setUnauthorizedHandler(null);
});

async function errorOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the request to fail, but it succeeded");
}

describe("http", () => {
  describe("successful requests", () => {
    it("prefixes the base URL and returns the parsed JSON", async () => {
      server.use(mock.get("/api/todos", () => HttpResponse.json([{ id: "1", title: "Milk" }])));

      await expect(http.get("/todos")).resolves.toEqual([{ id: "1", title: "Milk" }]);
    });

    it("sends the body as JSON with the right headers", async () => {
      let received: { contentType: string | null; body: unknown } | undefined;
      server.use(
        mock.post("/api/auth/login", async ({ request }) => {
          received = {
            contentType: request.headers.get("Content-Type"),
            body: await request.json(),
          };
          return HttpResponse.json({ ok: true });
        }),
      );

      await http.post("/auth/login", { email: "ann@example.com", password: "secret1" });

      expect(received).toEqual({
        contentType: "application/json",
        body: { email: "ann@example.com", password: "secret1" },
      });
    });

    it("resolves to undefined for 204 No Content", async () => {
      server.use(mock.delete("/api/todos/1", () => new HttpResponse(null, { status: 204 })));

      await expect(http.delete("/todos/1")).resolves.toBeUndefined();
    });
  });

  describe("authorization header", () => {
    it("attaches the bearer token when logged in", async () => {
      let authorization: string | null = null;
      server.use(
        mock.get("/api/auth/me", ({ request }) => {
          authorization = request.headers.get("Authorization");
          return HttpResponse.json({});
        }),
      );
      tokenStorage.set("token-123");

      await http.get("/auth/me");

      expect(authorization).toBe("Bearer token-123");
    });

    it("sends no Authorization header when logged out", async () => {
      let hasAuthorization = true;
      server.use(
        mock.get("/api/todos", ({ request }) => {
          hasAuthorization = request.headers.has("Authorization");
          return HttpResponse.json([]);
        }),
      );

      await http.get("/todos");

      expect(hasAuthorization).toBe(false);
    });
  });

  describe("failures become ApiError", () => {
    it("converts a NestJS error body, keeping status, code and Retry-After", async () => {
      server.use(
        mock.post("/api/auth/login", () =>
          HttpResponse.json(
            { statusCode: 429, message: "Too many attempts", code: "RATE_LIMITED" },
            { status: 429, headers: { "Retry-After": "60" } },
          ),
        ),
      );

      const error = await errorOf(http.post("/auth/login", {}));

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 429, code: "RATE_LIMITED", retryAfter: 60 });
    });

    it("handles an error response that is not JSON", async () => {
      server.use(
        mock.get("/api/todos", () => new HttpResponse("<h1>Bad Gateway</h1>", { status: 502 })),
      );

      const error = await errorOf(http.get("/todos"));

      expect(error).toMatchObject({ status: 502, message: "Request failed with status 502" });
    });

    it("reports a network failure as status 0 with NETWORK_ERROR", async () => {
      server.use(mock.get("/api/todos", () => HttpResponse.error()));

      const error = await errorOf(http.get("/todos"));

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR" });
    });

    it("reports a slow request as status 0 with TIMEOUT", async () => {
      server.use(
        mock.get("/api/todos", async () => {
          await delay(500);
          return HttpResponse.json([]);
        }),
      );

      const error = await errorOf(http.get("/todos", { timeoutMs: 20 }));

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 0, code: "TIMEOUT" });
    });
  });

  it("rejects with the browser's AbortError, not an ApiError, when the caller cancels", async () => {
    server.use(
      mock.get("/api/todos", async () => {
        await delay(500);
        return HttpResponse.json([]);
      }),
    );
    const controller = new AbortController();

    const pending = errorOf(http.get("/todos", { signal: controller.signal }));
    controller.abort();
    const error = await pending;

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ name: "AbortError" });
  });
});

describe("unauthorized (401) handler", () => {
  function respondUnauthorized() {
    server.use(
      mock.get("/api/todos", () =>
        HttpResponse.json({ statusCode: 401, message: "Unauthorized" }, { status: 401 }),
      ),
    );
  }

  it("reports a 401 on a logged-in request, and still rejects with the error", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set("expired-token");
    respondUnauthorized();

    const error = await errorOf(http.get("/todos"));

    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(error).toMatchObject({ status: 401 });
  });

  it("reports parallel 401s with the same token only once", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set("expired-token");
    respondUnauthorized();

    await Promise.allSettled(Array.from({ length: 5 }, () => http.get("/todos")));

    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("ignores a 401 when the request carried no token", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    respondUnauthorized();

    await errorOf(http.get("/todos"));

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("sends no token and reports nothing for public requests (auth: false)", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set("some-token");
    let hasAuthorization = true;
    server.use(
      mock.post("/api/auth/login", ({ request }) => {
        hasAuthorization = request.headers.has("Authorization");
        return HttpResponse.json(
          { statusCode: 401, message: "Invalid credentials", code: "INVALID_CREDENTIALS" },
          { status: 401 },
        );
      }),
    );

    const error = await errorOf(http.post("/auth/login", {}, { auth: false }));

    expect(hasAuthorization).toBe(false);
    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(error).toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
  });

  it("ignores a late 401 for a token that has since been replaced", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set("old-token");
    server.use(
      mock.get("/api/todos", () => {
        tokenStorage.set("new-token");
        return HttpResponse.json({}, { status: 401 });
      }),
    );

    await errorOf(http.get("/todos"));

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("reports again after a new login, when the new token expires too", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    respondUnauthorized();

    tokenStorage.set("first-token");
    await errorOf(http.get("/todos"));
    tokenStorage.set("second-token");
    await errorOf(http.get("/todos"));

    expect(onUnauthorized).toHaveBeenCalledTimes(2);
  });

  it("does not report other error statuses such as 403", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set("token-123");
    server.use(mock.get("/api/todos", () => HttpResponse.json({}, { status: 403 })));

    await errorOf(http.get("/todos"));

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
