import { screen, within } from "@testing-library/react";
import { authApi } from "@/features/auth";
import { TodoList } from "@/features/todos/components/TodoList";
import { initialTodosState, type TodosState } from "@/features/todos/todosSlice";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
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

function renderList(
  todos: Partial<TodosState>,
  { route = "/todos", onAddFirst }: { route?: string; onAddFirst?: () => void } = {},
) {
  return renderWithProviders(<TodoList onAddFirst={onAddFirst} />, {
    route,
    path: "/todos",
    preloadedState: { todos: { ...initialTodosState, ...todos } },
  });
}

const titles = () =>
  within(screen.getByRole("list", { name: messages.todoList.label }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("TodoList states (T-C12)", () => {
  it.each(["idle", "loading"] as const)(
    "shows a skeleton announced as loading while %s",
    (status) => {
      renderList({ status });

      expect(screen.getByRole("status")).toHaveTextContent(messages.todoList.loading);
      expect(screen.queryByRole("list", { name: messages.todoList.label })).not.toBeInTheDocument();
    },
  );

  it("keeps showing the list while it reloads, instead of a skeleton", () => {
    renderList({ status: "loading", items: [todo("a", false)] });

    expect(titles()).toEqual(["Todo a"]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the error with a Retry button that loads the list again", async () => {
    const { accessToken } = await authApi.login({
      email: MAGIC_EMAILS.demo,
      password: MAGIC_PASSWORD,
    });
    tokenStorage.set(accessToken);
    const { user } = renderList({ status: "error", error: messages.errors.network });

    expect(screen.getByRole("alert")).toHaveTextContent(messages.errors.network);
    await user.click(screen.getByRole("button", { name: messages.todoList.retry }));

    expect(await screen.findByText("Plan the week")).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the todos visible when a reload fails, with the error above them", () => {
    renderList({ status: "error", error: messages.errors.server, items: [todo("a", false)] });

    expect(screen.getByRole("alert")).toHaveTextContent(messages.errors.server);
    expect(screen.getByRole("button", { name: messages.todoList.retry })).toBeVisible();
    expect(titles()).toEqual(["Todo a"]);
  });

  it("welcomes a user with no todos and offers to add the first one (EC-56)", async () => {
    const onAddFirst = vi.fn();
    const { user } = renderList({ status: "success" }, { onAddFirst });

    expect(screen.getByRole("heading", { name: messages.todoList.emptyTitle })).toBeVisible();
    await user.click(screen.getByRole("button", { name: messages.todoList.addFirst }));

    expect(onAddFirst).toHaveBeenCalledOnce();
  });

  it("shows the first-time state even when a filter is selected", () => {
    renderList({ status: "success" }, { route: "/todos?status=completed" });

    expect(screen.getByRole("heading", { name: messages.todoList.emptyTitle })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: messages.todoList.noMatchTitle }),
    ).not.toBeInTheDocument();
  });

  it("leaves out the call to action when no add action is given", () => {
    renderList({ status: "success" });
    expect(
      screen.queryByRole("button", { name: messages.todoList.addFirst }),
    ).not.toBeInTheDocument();
  });

  it("says when the filter matches nothing, and links back to All (EC-55)", async () => {
    const { user, router } = renderList(
      { status: "success", items: [todo("a", false)] },
      { route: "/todos?status=completed" },
    );

    expect(screen.getByRole("heading", { name: messages.todoList.noMatchTitle })).toBeVisible();
    expect(screen.getByText(messages.todoList.noMatchDescription.completed)).toBeVisible();

    await user.click(screen.getByRole("link", { name: messages.todoList.showAll }));

    expect(router.state.location.search).toBe("");
    expect(titles()).toEqual(["Todo a"]);
  });

  it("lists the todos for the current filter", () => {
    renderList(
      { status: "success", items: [todo("a", false), todo("b", true), todo("c", false)] },
      { route: "/todos?status=active" },
    );
    expect(titles()).toEqual(["Todo a", "Todo c"]);
  });
});
