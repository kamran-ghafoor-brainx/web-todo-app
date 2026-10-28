import { makeStore } from "@/app/store";
import { initialTodosState } from "@/features/todos/todosSlice";
import {
  selectPendingById,
  selectTodoCounts,
  selectTodoItems,
  selectTodosError,
  selectTodosStatus,
} from "@/features/todos/todosSelectors";
import type { Todo } from "@/features/todos/types";

function todo(id: string, isCompleted: boolean): Todo {
  return {
    id,
    title: `Todo ${id}`,
    description: null,
    isCompleted,
    dueDate: null,
    createdAt: "2026-10-27T09:00:00.000Z",
    updatedAt: "2026-10-27T09:00:00.000Z",
  };
}

function stateWith(items: Todo[]) {
  return makeStore({ todos: { ...initialTodosState, items, status: "success" } }).getState();
}

describe("todos selectors (T-U11)", () => {
  it("read the list, its status, its error and the pending items", () => {
    const items = [todo("a", false)];
    const state = makeStore({
      todos: {
        ...initialTodosState,
        items,
        status: "error",
        error: "Oops",
        pendingById: { a: "deleting" },
      },
    }).getState();

    expect(selectTodoItems(state)).toBe(items);
    expect(selectTodosStatus(state)).toBe("error");
    expect(selectTodosError(state)).toBe("Oops");
    expect(selectPendingById(state)).toEqual({ a: "deleting" });
  });

  it("count all, active and completed todos", () => {
    const state = stateWith([todo("a", false), todo("b", true), todo("c", false)]);
    expect(selectTodoCounts(state)).toEqual({ all: 3, active: 2, completed: 1 });
  });

  it("count zero for an empty list", () => {
    expect(selectTodoCounts(stateWith([]))).toEqual({ all: 0, active: 0, completed: 0 });
  });

  it("return the same counts object while the list is unchanged (memoized)", () => {
    const state = stateWith([todo("a", false)]);
    const first = selectTodoCounts(state);

    expect(selectTodoCounts({ ...state, auth: { ...state.auth } })).toBe(first);
    expect(selectTodoCounts(stateWith([todo("a", true)]))).not.toBe(first);
  });
});
