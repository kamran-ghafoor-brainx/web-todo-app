import { screen } from "@testing-library/react";
import { TodoFilters } from "@/features/todos/components/TodoFilters";
import { searchForFilter } from "@/features/todos/todoFilters";
import { initialTodosState, type TodosStatus } from "@/features/todos/todosSlice";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

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

function renderFilters(route: string, status: TodosStatus = "success") {
  return renderWithProviders(<TodoFilters />, {
    route,
    path: "/todos",
    preloadedState: {
      todos: {
        ...initialTodosState,
        status,
        items: [todo("a", false), todo("b", true), todo("c", false)],
      },
    },
  });
}

const link = (name: string) => screen.getByRole("link", { name: new RegExp(`^${name}`) });

describe("TodoFilters (D2)", () => {
  it("shows All, Active and Completed with their counts", () => {
    renderFilters("/todos");

    expect(screen.getByRole("navigation", { name: messages.todoFilters.label })).toBeVisible();
    expect(link(messages.todoFilters.all)).toHaveTextContent("All3");
    expect(link(messages.todoFilters.active)).toHaveTextContent("Active2");
    expect(link(messages.todoFilters.completed)).toHaveTextContent("Completed1");
  });

  it.each<TodosStatus>(["idle", "loading", "error"])(
    "shows no counts while the list is %s, so it never claims 0 todos",
    (status) => {
      renderFilters("/todos", status);

      expect(link(messages.todoFilters.all)).toHaveTextContent(/^All$/);
      expect(link(messages.todoFilters.active)).toHaveTextContent(/^Active$/);
      expect(link(messages.todoFilters.completed)).toHaveTextContent(/^Completed$/);
    },
  );

  it("marks the filter from the URL as current, and only that one", () => {
    renderFilters("/todos?status=completed");

    expect(link(messages.todoFilters.completed)).toHaveAttribute("aria-current", "true");
    expect(link(messages.todoFilters.all)).not.toHaveAttribute("aria-current");
    expect(link(messages.todoFilters.active)).not.toHaveAttribute("aria-current");
  });

  it("treats an unknown ?status= as All (EC-54)", () => {
    renderFilters("/todos?status=banana");
    expect(link(messages.todoFilters.all)).toHaveAttribute("aria-current", "true");
  });

  it("stores the choice in the URL, and All removes it", async () => {
    const { user, router } = renderFilters("/todos");

    await user.click(link(messages.todoFilters.active));
    expect(router.state.location.search).toBe("?status=active");
    expect(link(messages.todoFilters.active)).toHaveAttribute("aria-current", "true");

    await user.click(link(messages.todoFilters.all));
    expect(router.state.location.search).toBe("");
  });

  it("adds a history entry, so Back returns to the previous filter", async () => {
    const { user, router } = renderFilters("/todos?status=active");

    await user.click(link(messages.todoFilters.completed));
    await router.navigate(-1);

    expect(router.state.location.search).toBe("?status=active");
  });
});

describe("searchForFilter", () => {
  it("keeps other query parameters", () => {
    const current = new URLSearchParams("q=milk&status=active");
    expect(searchForFilter(current, "completed")).toBe("?q=milk&status=completed");
    expect(searchForFilter(current, "all")).toBe("?q=milk");
  });

  it("returns an empty search for All with nothing else", () => {
    expect(searchForFilter(new URLSearchParams("status=active"), "all")).toBe("");
  });
});
