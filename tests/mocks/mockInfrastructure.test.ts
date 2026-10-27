import { authApi } from "@/features/auth";
import { MOCK_DB_STORAGE_KEY, MOCK_DB_VERSION } from "@/mocks/config";
import { getDb, resetMockDb } from "@/mocks/db";
import { checkRateLimit } from "@/mocks/rateLimit";
import { createSeedTodos } from "@/mocks/seed";
import { createPasswordRecord, hashPassword, verifyPassword } from "@/mocks/security";

describe("mock database", () => {
  it("does not let a load that was in progress during a reset bring old data back", async () => {
    const loadBeforeReset = getDb();
    resetMockDb();

    const staleDb = await loadBeforeReset;
    const currentDb = await getDb();

    expect(currentDb).not.toBe(staleDb);
    expect(currentDb.users[0]?.id).not.toBe(staleDb.users[0]?.id);
  });

  it("is seeded with the magic test accounts (plan section 9.5)", async () => {
    const db = await getDb();
    expect(db.users.map((user) => [user.email, user.isEmailVerified])).toEqual([
      ["demo@example.com", true],
      ["unverified@example.com", false],
      ["shortlived@example.com", true],
      ["locked@example.com", true],
      ["slow@example.com", true],
    ]);
  });

  it("saves to localStorage, so data survives a page refresh", async () => {
    await authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" });

    const saved = JSON.parse(localStorage.getItem(MOCK_DB_STORAGE_KEY) ?? "null");
    expect(saved.users.map((user: { email: string }) => user.email)).toContain("ann@example.com");
  });

  it("loads the saved copy instead of re-seeding", async () => {
    await authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" });
    const saved = localStorage.getItem(MOCK_DB_STORAGE_KEY);

    resetMockDb();
    localStorage.setItem(MOCK_DB_STORAGE_KEY, saved ?? "");

    const db = await getDb();
    expect(db.users.some((user) => user.email === "ann@example.com")).toBe(true);
  });

  it("re-seeds when the saved copy is corrupted or has an old shape", async () => {
    localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify({ version: 0, users: "??" }));
    expect((await getDb()).users).toHaveLength(5);

    resetMockDb();
    localStorage.setItem(MOCK_DB_STORAGE_KEY, "{broken json");
    expect((await getDb()).users).toHaveLength(5);
  });

  it("upgrades a saved version 1 copy, keeping its users and adding the demo todos", async () => {
    await authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" });
    const v1 = { ...(await getDb()), version: 1, todos: undefined };
    resetMockDb();
    localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(v1));

    const db = await getDb();

    expect(db.version).toBe(MOCK_DB_VERSION);
    expect(db.users.some((user) => user.email === "ann@example.com")).toBe(true);
    expect(db.todos).toHaveLength(5);
    expect(JSON.parse(localStorage.getItem(MOCK_DB_STORAGE_KEY) ?? "null").version).toBe(MOCK_DB_VERSION);
  });

  it("resetMockDb() returns to the seed data", async () => {
    await authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" });
    resetMockDb();

    const db = await getDb();
    expect(db.users).toHaveLength(5);
    expect(db.mailbox).toEqual([]);
  });

  it("never stores passwords in plain text", async () => {
    await authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" });
    expect(localStorage.getItem(MOCK_DB_STORAGE_KEY)).not.toContain("secret12");
    expect(localStorage.getItem(MOCK_DB_STORAGE_KEY)).not.toContain("Passw0rd!");
  });
});

describe("seeded demo todos", () => {
  const today = new Date(2026, 9, 27, 9, 30);

  async function seededFor(now: Date) {
    const db = await getDb();
    return { db, todos: createSeedTodos(db.users, now) };
  }

  it("gives the demo user 5 todos and nobody else any", async () => {
    const db = await getDb();
    const demo = db.users.find((user) => user.email === "demo@example.com");

    expect(db.version).toBe(MOCK_DB_VERSION);
    expect(db.todos).toHaveLength(5);
    expect(db.todos.every((todo) => todo.userId === demo?.id)).toBe(true);
  });

  it("includes one overdue todo and one completed todo", async () => {
    const { todos } = await seededFor(today);
    const overdue = todos.filter(
      (todo) => !todo.isCompleted && todo.dueDate !== null && todo.dueDate < "2026-10-27",
    );

    expect(overdue.map((todo) => todo.dueDate)).toEqual(["2026-10-24"]);
    expect(todos.filter((todo) => todo.isCompleted)).toHaveLength(1);
  });

  it("uses date-only due dates relative to today, and some todos have none", async () => {
    const { todos } = await seededFor(today);

    expect(todos.map((todo) => todo.dueDate)).toEqual([
      "2026-10-29",
      "2026-10-27",
      "2026-10-24",
      "2026-10-26",
      null,
    ]);
  });

  it("is ordered newest first, with matching created and updated times", async () => {
    const { todos } = await seededFor(today);
    const created = todos.map((todo) => todo.createdAt);

    expect([...created].sort().reverse()).toEqual(created);
    expect(new Set(created).size).toBe(5);
    expect(todos.every((todo) => todo.updatedAt === todo.createdAt)).toBe(true);
  });

  it("crosses month boundaries correctly", async () => {
    const { todos } = await seededFor(new Date(2026, 0, 1, 0, 5));
    expect(todos[2]?.dueDate).toBe("2025-12-29");
  });
});

describe("password records", () => {
  it("uses a random salt, so the same password gives different hashes", async () => {
    const first = await createPasswordRecord("secret12");
    const second = await createPasswordRecord("secret12");
    expect(first.passwordHash).not.toBe(second.passwordHash);
    expect(first.passwordHash).toBe(await hashPassword("secret12", first.passwordSalt));
  });

  it("verifies the right password and rejects others, including spacing changes", async () => {
    const record = await createPasswordRecord(" secret12 ");
    await expect(verifyPassword(" secret12 ", record)).resolves.toBe(true);
    await expect(verifyPassword("secret12", record)).resolves.toBe(false);
  });
});

describe("rate limiter", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
  afterEach(() => vi.useRealTimers());

  const limit = { max: 2, windowMs: 10_000 };

  it("allows requests up to the limit, then refuses with the seconds to wait", () => {
    expect(checkRateLimit("k", limit)).toEqual({ allowed: true });
    vi.advanceTimersByTime(3_000);
    expect(checkRateLimit("k", limit)).toEqual({ allowed: true });

    expect(checkRateLimit("k", limit)).toEqual({ allowed: false, retryAfterSeconds: 7 });
  });

  it("allows again once old requests leave the window", () => {
    checkRateLimit("k", limit);
    checkRateLimit("k", limit);
    vi.advanceTimersByTime(10_000);
    expect(checkRateLimit("k", limit)).toEqual({ allowed: true });
  });

  it("counts each key separately", () => {
    checkRateLimit("a", { max: 1, windowMs: 10_000 });
    expect(checkRateLimit("b", { max: 1, windowMs: 10_000 })).toEqual({ allowed: true });
  });
});
