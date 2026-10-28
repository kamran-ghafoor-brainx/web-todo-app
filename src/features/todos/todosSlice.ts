import { createSlice, isPending } from "@reduxjs/toolkit";
import { createTodo, deleteTodo, fetchTodos, updateTodo } from "@/features/todos/todosThunks";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";

export type TodosStatus = "idle" | "loading" | "success" | "error";

export type PendingTodoAction = "updating" | "deleting";

export type TodoChange =
  | { type: "created"; todo: Todo }
  | { type: "updated"; todo: Todo }
  | { type: "removed"; id: string };

export type TodosState = {
  items: Todo[];
  status: TodosStatus;
  error: string | null;
  pendingById: Record<string, PendingTodoAction>;
  /** Requests started in this session. Answers to any other request arrive too late and are ignored. */
  activeRequestIds: string[];
  /** Confirmed changes made while the list was loading; reapplied when it arrives. Null when not loading. */
  changesDuringFetch: TodoChange[] | null;
};

export const initialTodosState: TodosState = {
  items: [],
  status: "idle",
  error: null,
  pendingById: {},
  activeRequestIds: [],
  changesDuringFetch: null,
};

function settle(state: TodosState, requestId: string): boolean {
  const index = state.activeRequestIds.indexOf(requestId);
  if (index === -1) return false;
  state.activeRequestIds.splice(index, 1);
  return true;
}

function applyChange(items: Todo[], change: TodoChange): Todo[] {
  if (change.type === "removed") return items.filter((todo) => todo.id !== change.id);
  if (change.type === "updated") {
    return items.map((todo) => (todo.id === change.todo.id ? change.todo : todo));
  }
  return items.some((todo) => todo.id === change.todo.id) ? items : [change.todo, ...items];
}

function commit(state: TodosState, change: TodoChange) {
  state.items = applyChange(state.items, change);
  state.changesDuringFetch?.push(change);
}

export const todosSlice = createSlice({
  name: "todos",
  initialState: initialTodosState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.changesDuringFetch = [];
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        if (!settle(state, action.meta.requestId)) return;
        state.items = (state.changesDuringFetch ?? []).reduce(applyChange, action.payload);
        state.changesDuringFetch = null;
        state.status = "success";
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        if (!settle(state, action.meta.requestId)) return;
        state.changesDuringFetch = null;
        state.status = "error";
        state.error = action.payload ?? messages.errors.server;
      })

      .addCase(createTodo.fulfilled, (state, action) => {
        if (!settle(state, action.meta.requestId)) return;
        commit(state, { type: "created", todo: action.payload });
      })
      .addCase(createTodo.rejected, (state, action) => {
        settle(state, action.meta.requestId);
      })

      .addCase(updateTodo.pending, (state, action) => {
        state.pendingById[action.meta.arg.id] = "updating";
      })
      .addCase(updateTodo.fulfilled, (state, action) => {
        if (!settle(state, action.meta.requestId)) return;
        delete state.pendingById[action.meta.arg.id];
        commit(state, { type: "updated", todo: action.payload });
      })
      .addCase(updateTodo.rejected, (state, action) => {
        if (!settle(state, action.meta.requestId)) return;
        delete state.pendingById[action.meta.arg.id];
        if (action.payload?.notFound) commit(state, { type: "removed", id: action.meta.arg.id });
      })

      .addCase(deleteTodo.pending, (state, action) => {
        state.pendingById[action.meta.arg] = "deleting";
      })
      .addCase(deleteTodo.fulfilled, (state, action) => {
        if (!settle(state, action.meta.requestId)) return;
        delete state.pendingById[action.meta.arg];
        commit(state, { type: "removed", id: action.meta.arg });
      })
      .addCase(deleteTodo.rejected, (state, action) => {
        if (!settle(state, action.meta.requestId)) return;
        delete state.pendingById[action.meta.arg];
        if (action.payload?.notFound) commit(state, { type: "removed", id: action.meta.arg });
      })

      .addMatcher(isPending(fetchTodos, createTodo, updateTodo, deleteTodo), (state, action) => {
        state.activeRequestIds.push(action.meta.requestId);
      });
  },
});
