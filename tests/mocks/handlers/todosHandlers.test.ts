import { authApi } from "@/features/auth";
import { todosApi } from "@/features/todos/todosApi";
import type { Todo } from "@/features/todos/types";
import { ApiError } from "@/lib/ApiError";
import { http } from "@/lib/http";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";

async function apiErrorOf(request: Promise<unknown>): Promise<ApiError> {
  try {
    await request;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("Expected the request to fail, but it succeeded");
}

async function logInAs(email: string) {
  const { accessToken } = await authApi.login({ email, password: MAGIC_PASSWORD });
  tokenStorage.set(accessToken);
}

const listTodos = todosApi.list;
const getTodo = todosApi.get;
const deleteTodo = todosApi.remove;
const createTodo = (body: unknown) => http.post<Todo>("/todos", body);
const updateTodo = (id: string, body: unknown) => http.patch<Todo>(`/todos/${id}`, body);

async function firstDemoTodo(): Promise<Todo> {
  await logInAs(MAGIC_EMAILS.demo);
  const [todo] = await listTodos();
  if (!todo) throw new Error("Expected the demo user to have todos");
  return todo;
}

function travelInTime(ms: number) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.now() + ms);
}

afterEach(() => vi.useRealTimers());

describe("todos endpoints require a session", () => {
  it.each([
    ["GET /todos", () => listTodos()],
    ["POST /todos", () => createTodo({ title: "x" })],
    ["GET /todos/:id", () => getTodo("any")],
    ["PATCH /todos/:id", () => updateTodo("any", { isCompleted: true })],
    ["DELETE /todos/:id", () => deleteTodo("any")],
  ])("%s answers 401 without a valid token", async (_name, call) => {
    tokenStorage.set("mock.not-a-real-token");
    expect(await apiErrorOf(call())).toMatchObject({ status: 401 });
  });
});

describe("GET /todos", () => {
  it("lists the user's own todos, newest first, without any owner id", async () => {
    await logInAs(MAGIC_EMAILS.demo);

    const todos = await listTodos();

    expect(todos.map((todo) => todo.title)).toEqual([
      "Plan the week",
      "Buy groceries",
      "Renew library books",
      "Call the dentist",
      "Read chapter 4",
    ]);
    expect(Object.keys(todos[0] ?? {}).sort()).toEqual(
      ["createdAt", "description", "dueDate", "id", "isCompleted", "title", "updatedAt"].sort(),
    );
  });

  it("shows another user none of the demo user's todos", async () => {
    await logInAs(MAGIC_EMAILS.shortlived);
    expect(await listTodos()).toEqual([]);
  });
});

describe("POST /todos", () => {
  it("creates an active todo with trimmed text and matching timestamps (201)", async () => {
    await logInAs(MAGIC_EMAILS.demo);

    const todo = await createTodo({
      title: "  Water the plants  ",
      description: "  Both balconies  ",
      dueDate: "2026-11-02",
    });

    expect(todo).toMatchObject({
      id: expect.any(String),
      title: "Water the plants",
      description: "Both balconies",
      dueDate: "2026-11-02",
      isCompleted: false,
    });
    expect(todo.updatedAt).toBe(todo.createdAt);
    expect((await listTodos())[0]?.id).toBe(todo.id);
  });

  it("keeps the newest first even when two todos share a timestamp", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2030-01-01T12:00:00.000Z"));
    await logInAs(MAGIC_EMAILS.demo);

    const first = await createTodo({ title: "First" });
    const second = await createTodo({ title: "Second" });

    expect(second.createdAt).toBe(first.createdAt);
    expect((await listTodos()).slice(0, 2).map((todo) => todo.title)).toEqual(["Second", "First"]);
  });

  it("stores a blank or missing description and a missing due date as null", async () => {
    await logInAs(MAGIC_EMAILS.demo);

    expect(await createTodo({ title: "No extras" })).toMatchObject({
      description: null,
      dueDate: null,
    });
    expect(await createTodo({ title: "Blank", description: "   ", dueDate: null })).toMatchObject({
      description: null,
      dueDate: null,
    });
  });

  it("ignores fields the client may not set, like an owner or completion", async () => {
    await logInAs(MAGIC_EMAILS.shortlived);

    const todo = await createTodo({ title: "Mine", userId: "someone-else", isCompleted: true });

    expect(todo.isCompleted).toBe(false);
    expect((await listTodos()).map((item) => item.id)).toEqual([todo.id]);
  });

  it("validates with the same rules as the form (400, NestJS style)", async () => {
    await logInAs(MAGIC_EMAILS.demo);

    const error = await apiErrorOf(
      createTodo({ title: "   ", description: "x".repeat(501), dueDate: "2026-02-30" }),
    );

    expect(error.status).toBe(400);
    expect(error.details).toEqual([
      `title: ${messages.validation.titleRequired}`,
      `description: ${messages.validation.descriptionTooLong}`,
      `dueDate: ${messages.validation.dueDateInvalid}`,
    ]);
  });

  it("accepts exactly 100 title and 500 description characters, but not 101 title characters", async () => {
    await logInAs(MAGIC_EMAILS.demo);

    await expect(
      createTodo({ title: "t".repeat(100), description: "d".repeat(500) }),
    ).resolves.toMatchObject({ title: "t".repeat(100) });

    const error = await apiErrorOf(createTodo({ title: "t".repeat(101) }));
    expect(error.details).toEqual([`title: ${messages.validation.titleTooLong}`]);
  });

  it("answers 500 for a [fail] title and saves nothing", async () => {
    await logInAs(MAGIC_EMAILS.demo);

    const error = await apiErrorOf(createTodo({ title: "Break it [fail]" }));

    expect(error.status).toBe(500);
    expect(await listTodos()).toHaveLength(5);
  });
});

describe("GET /todos/:id", () => {
  it("returns the user's own todo", async () => {
    const todo = await firstDemoTodo();
    expect(await getTodo(todo.id)).toEqual(todo);
  });

  it("answers 404 for another user's todo, so its existence is not revealed", async () => {
    const todo = await firstDemoTodo();
    await logInAs(MAGIC_EMAILS.shortlived);

    expect(await apiErrorOf(getTodo(todo.id))).toMatchObject({ status: 404 });
    expect(await apiErrorOf(getTodo("no-such-id"))).toMatchObject({ status: 404 });
  });
});

describe("PATCH /todos/:id", () => {
  it("toggles completion and moves updatedAt forward, keeping other fields", async () => {
    const todo = await firstDemoTodo();
    travelInTime(60_000);

    const updated = await updateTodo(todo.id, { isCompleted: true });

    expect(updated).toEqual({ ...todo, isCompleted: true, updatedAt: expect.any(String) });
    expect(updated.updatedAt > todo.updatedAt).toBe(true);
    expect(updated.createdAt).toBe(todo.createdAt);
  });

  it("edits the text and clears the description and due date", async () => {
    const todo = await firstDemoTodo();

    const updated = await updateTodo(todo.id, {
      title: " Plan next week ",
      description: "",
      dueDate: null,
    });

    expect(updated).toMatchObject({ title: "Plan next week", description: null, dueDate: null });
    expect(await getTodo(todo.id)).toEqual(updated);
  });

  it("validates the changed fields (400)", async () => {
    const todo = await firstDemoTodo();

    const error = await apiErrorOf(updateTodo(todo.id, { title: "", isCompleted: "yes" }));

    expect(error.status).toBe(400);
    expect(error.details?.[0]).toBe(`title: ${messages.validation.titleRequired}`);
    expect(error.details).toHaveLength(2);
  });

  it("answers 404 for another user's todo and leaves it unchanged", async () => {
    const todo = await firstDemoTodo();
    await logInAs(MAGIC_EMAILS.shortlived);

    expect(await apiErrorOf(updateTodo(todo.id, { isCompleted: true }))).toMatchObject({
      status: 404,
    });

    await logInAs(MAGIC_EMAILS.demo);
    expect(await getTodo(todo.id)).toEqual(todo);
  });

  it("answers 500 for a [fail] title and leaves the todo unchanged", async () => {
    const todo = await firstDemoTodo();

    expect(await apiErrorOf(updateTodo(todo.id, { title: "[fail] edit" }))).toMatchObject({
      status: 500,
    });
    expect(await getTodo(todo.id)).toEqual(todo);
  });
});

describe("todosApi (C3)", () => {
  it("creates, reads, updates and deletes through one function per endpoint", async () => {
    await logInAs(MAGIC_EMAILS.demo);

    const created = await todosApi.create({ title: "Through the API", dueDate: "2026-12-01" });
    expect(await todosApi.get(created.id)).toEqual(created);

    const updated = await todosApi.update(created.id, { isCompleted: true });
    expect(updated.isCompleted).toBe(true);

    await todosApi.remove(created.id);
    expect((await todosApi.list()).some((todo) => todo.id === created.id)).toBe(false);
  });

  it("escapes the id, so it can never reach another path", async () => {
    await logInAs(MAGIC_EMAILS.demo);
    expect(await apiErrorOf(todosApi.get("../auth/me"))).toMatchObject({ status: 404 });
  });
});

describe("DELETE /todos/:id", () => {
  it("deletes the todo (204); deleting it again answers 404", async () => {
    const todo = await firstDemoTodo();

    await expect(deleteTodo(todo.id)).resolves.toBeUndefined();

    expect((await listTodos()).some((item) => item.id === todo.id)).toBe(false);
    expect(await apiErrorOf(deleteTodo(todo.id))).toMatchObject({ status: 404 });
  });

  it("answers 404 for another user's todo and keeps it", async () => {
    const todo = await firstDemoTodo();
    await logInAs(MAGIC_EMAILS.shortlived);

    expect(await apiErrorOf(deleteTodo(todo.id))).toMatchObject({ status: 404 });

    await logInAs(MAGIC_EMAILS.demo);
    expect(await getTodo(todo.id)).toEqual(todo);
  });
});
