import { http as mswHttp, HttpResponse } from "msw";
import { sessionEnded } from "@/app/actions";
import { makeStore } from "@/app/store";
import { authApi } from "@/features/auth/authApi";
import { todosApi } from "@/features/todos/todosApi";
import { initialTodosState } from "@/features/todos/todosSlice";
import type { Todo } from "@/features/todos/types";
import { createTodo, deleteTodo, fetchTodos, updateTodo } from "@/features/todos/todosThunks";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { server } from "@/mocks/server";

async function logInAs(email: string) {
  const { accessToken } = await authApi.login({ email, password: MAGIC_PASSWORD });
  tokenStorage.set(accessToken);
}

async function loadedStore() {
  await logInAs(MAGIC_EMAILS.demo);
  const store = makeStore();
  await store.dispatch(fetchTodos());
  const first = store.getState().todos.items[0];
  if (!first) throw new Error("Expected seeded todos");
  return { store, first };
}

function countRequests(method: string, pathEnd: string) {
  const seen = { count: 0 };
  server.events.on("request:start", ({ request }) => {
    if (request.method === method && new URL(request.url).pathname.endsWith(pathEnd)) {
      seen.count += 1;
    }
  });
  return seen;
}

afterEach(() => server.events.removeAllListeners());

describe("fetchTodos (T-U10)", () => {
  it("loads the list, newest first, and marks it successful", async () => {
    await logInAs(MAGIC_EMAILS.demo);
    const store = makeStore();

    const request = store.dispatch(fetchTodos());
    expect(store.getState().todos.status).toBe("loading");
    await request;

    const { items, status, error } = store.getState().todos;
    expect(status).toBe("success");
    expect(error).toBeNull();
    expect(items.map((todo) => todo.title)[0]).toBe("Plan the week");
    expect(items).toHaveLength(5);
  });

  it("skips a second request while one is running (Strict Mode, EC-60)", async () => {
    await logInAs(MAGIC_EMAILS.demo);
    const requests = countRequests("GET", "/todos");
    const store = makeStore();

    await Promise.all([store.dispatch(fetchTodos()), store.dispatch(fetchTodos())]);

    expect(requests.count).toBe(1);
    expect(store.getState().todos.items).toHaveLength(5);
  });

  it("stores a readable error, and a retry clears it", async () => {
    await logInAs(MAGIC_EMAILS.demo);
    server.use(mswHttp.get("/api/todos", () => HttpResponse.error()));
    const store = makeStore();

    await store.dispatch(fetchTodos());
    expect(store.getState().todos).toMatchObject({
      status: "error",
      error: messages.errors.network,
      items: [],
    });

    server.resetHandlers();
    await store.dispatch(fetchTodos());
    expect(store.getState().todos).toMatchObject({ status: "success", error: null });
  });
});

describe("createTodo (T-U10)", () => {
  it("adds the saved todo at the top only after the server confirms", async () => {
    const { store } = await loadedStore();

    const request = store.dispatch(createTodo({ title: "Water the plants" }));
    expect(store.getState().todos.items).toHaveLength(5);
    const created = await request.unwrap();

    expect(store.getState().todos.items[0]).toEqual(created);
    expect(store.getState().todos.items).toHaveLength(6);
  });

  it("rejects with a readable message and leaves the list unchanged", async () => {
    const { store } = await loadedStore();
    const before = store.getState().todos.items;

    await expect(store.dispatch(createTodo({ title: "Boom [fail]" })).unwrap()).rejects.toBe(
      messages.errors.server,
    );
    expect(store.getState().todos.items).toBe(before);
  });
});

describe("updateTodo (T-U10)", () => {
  it("marks the item as updating, then replaces it with the server's version", async () => {
    const { store, first } = await loadedStore();

    const request = store.dispatch(updateTodo({ id: first.id, changes: { isCompleted: true } }));
    expect(store.getState().todos.pendingById).toEqual({ [first.id]: "updating" });
    expect(store.getState().todos.items[0]?.isCompleted).toBe(false);
    await request;

    expect(store.getState().todos.pendingById).toEqual({});
    expect(store.getState().todos.items[0]).toMatchObject({ id: first.id, isCompleted: true });
  });

  it("ignores a second change to the same item while the first is pending (EC-53)", async () => {
    const { store, first } = await loadedStore();
    const requests = countRequests("PATCH", `/todos/${first.id}`);

    await Promise.all([
      store.dispatch(updateTodo({ id: first.id, changes: { isCompleted: true } })),
      store.dispatch(updateTodo({ id: first.id, changes: { isCompleted: false } })),
    ]);

    expect(requests.count).toBe(1);
    expect(store.getState().todos.items[0]?.isCompleted).toBe(true);
  });

  it("keeps the item unchanged and clears pending when the server fails", async () => {
    const { store, first } = await loadedStore();

    const result = await store.dispatch(
      updateTodo({ id: first.id, changes: { title: "[fail] rename" } }),
    );

    expect(result.payload).toEqual({ message: messages.errors.server, notFound: false });
    expect(store.getState().todos.items[0]).toEqual(first);
    expect(store.getState().todos.pendingById).toEqual({});
  });

  it("removes the item and says it is gone when the server answers 404 (EC-50)", async () => {
    const { store, first } = await loadedStore();
    server.use(mswHttp.patch("/api/todos/:id", () => HttpResponse.json({}, { status: 404 })));

    const result = await store.dispatch(
      updateTodo({ id: first.id, changes: { isCompleted: true } }),
    );

    expect(result.payload).toEqual({ message: messages.todos.alreadyGone, notFound: true });
    expect(store.getState().todos.items.some((todo) => todo.id === first.id)).toBe(false);
  });
});

describe("deleteTodo (T-U10)", () => {
  it("marks the item as deleting, then removes it", async () => {
    const { store, first } = await loadedStore();

    const request = store.dispatch(deleteTodo(first.id));
    expect(store.getState().todos.pendingById).toEqual({ [first.id]: "deleting" });
    await request;

    expect(store.getState().todos.items.some((todo) => todo.id === first.id)).toBe(false);
    expect(store.getState().todos.pendingById).toEqual({});
  });

  it("removes the item and says it is gone when it was already deleted elsewhere (404)", async () => {
    const { store, first } = await loadedStore();
    await todosApi.remove(first.id);

    const result = await store.dispatch(deleteTodo(first.id));

    expect(result.payload).toEqual({ message: messages.todos.alreadyGone, notFound: true });
    expect(store.getState().todos.items.some((todo) => todo.id === first.id)).toBe(false);
  });

  it("keeps the item when the server fails for another reason", async () => {
    const { store, first } = await loadedStore();
    server.use(mswHttp.delete("/api/todos/:id", () => HttpResponse.error()));

    const result = await store.dispatch(deleteTodo(first.id));

    expect(result.payload).toEqual({ message: messages.errors.network, notFound: false });
    expect(store.getState().todos.items[0]).toEqual(first);
    expect(store.getState().todos.pendingById).toEqual({});
  });
});

describe("changes made while the list is loading", () => {
  async function storeWithSlowStaleList() {
    await logInAs(MAGIC_EMAILS.demo);
    const staleList = await todosApi.list();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      mswHttp.get("/api/todos", async () => {
        await gate;
        return HttpResponse.json(staleList);
      }),
    );
    const store = makeStore();
    const fetching = store.dispatch(fetchTodos());
    return { store, staleList, finishFetch: () => (release(), fetching) };
  }

  it("keeps a todo created before an older list arrives", async () => {
    const { store, finishFetch } = await storeWithSlowStaleList();

    const created = await store.dispatch(createTodo({ title: "Added mid-load" })).unwrap();
    await finishFetch();

    expect(store.getState().todos.items[0]).toEqual(created);
    expect(store.getState().todos.items).toHaveLength(6);
    expect(store.getState().todos.changesDuringFetch).toBeNull();
  });

  it("keeps a delete and an update made before an older list arrives", async () => {
    const { store, staleList, finishFetch } = await storeWithSlowStaleList();
    const [first, second] = staleList as [Todo, Todo];

    await store.dispatch(deleteTodo(first.id));
    await store.dispatch(updateTodo({ id: second.id, changes: { isCompleted: true } }));
    await finishFetch();

    const { items } = store.getState().todos;
    expect(items.some((todo) => todo.id === first.id)).toBe(false);
    expect(items.find((todo) => todo.id === second.id)?.isCompleted).toBe(true);
    expect(items).toHaveLength(4);
  });

  it("does not duplicate a todo the list already contains", async () => {
    await logInAs(MAGIC_EMAILS.demo);
    const store = makeStore();

    const fetching = store.dispatch(fetchTodos());
    await store.dispatch(createTodo({ title: "Maybe in both" }));
    await fetching;

    const ids = store.getState().todos.items.map((todo) => todo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("session end (T-U10, EC-58)", () => {
  it("empties the todos on sessionEnded", async () => {
    const { store } = await loadedStore();

    store.dispatch(sessionEnded({ reason: "loggedOut" }));

    expect(store.getState().todos).toEqual(initialTodosState);
  });

  it("ignores an answer that arrives after the session ended", async () => {
    await logInAs(MAGIC_EMAILS.demo);
    const store = makeStore();

    const lateFetch = store.dispatch(fetchTodos());
    const lateCreate = store.dispatch(createTodo({ title: "Created just before logout" }));
    store.dispatch(sessionEnded({ reason: "loggedOut" }));
    await Promise.all([lateFetch, lateCreate]);

    expect(store.getState().todos).toEqual(initialTodosState);
  });
});
