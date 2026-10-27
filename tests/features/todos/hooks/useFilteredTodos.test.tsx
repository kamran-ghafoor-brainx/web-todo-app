import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { makeStore } from "@/app/store";
import { useFilteredTodos } from "@/features/todos/hooks/useFilteredTodos";
import { initialTodosState } from "@/features/todos/todosSlice";
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

const items = [todo("a", false), todo("b", true), todo("c", false)];

function renderAt(url: string) {
  const store = makeStore({ todos: { ...initialTodosState, items, status: "success" } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
    </Provider>
  );
  return renderHook(() => useFilteredTodos(), { wrapper });
}

const ids = (todos: Todo[]) => todos.map((item) => item.id);

describe("useFilteredTodos (T-U12)", () => {
  it("shows everything when there is no ?status=", () => {
    const { result } = renderAt("/todos");
    expect(result.current.filter).toBe("all");
    expect(ids(result.current.todos)).toEqual(["a", "b", "c"]);
  });

  it("shows only active todos for ?status=active, keeping the order", () => {
    const { result } = renderAt("/todos?status=active");
    expect(result.current.filter).toBe("active");
    expect(ids(result.current.todos)).toEqual(["a", "c"]);
  });

  it("shows only completed todos for ?status=completed", () => {
    const { result } = renderAt("/todos?status=completed");
    expect(result.current.filter).toBe("completed");
    expect(ids(result.current.todos)).toEqual(["b"]);
  });

  it.each(["foo", "ACTIVE", ""])("falls back to All for ?status=%s (EC-54)", (value) => {
    const { result } = renderAt(`/todos?status=${value}`);
    expect(result.current.filter).toBe("all");
    expect(ids(result.current.todos)).toEqual(["a", "b", "c"]);
  });

  it("returns the same list between renders while nothing changes", () => {
    const { result, rerender } = renderAt("/todos?status=active");
    const first = result.current.todos;

    rerender();

    expect(result.current.todos).toBe(first);
  });
});
