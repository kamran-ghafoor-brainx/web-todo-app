import { screen } from "@testing-library/react";
import { TodoItem } from "@/features/todos/components/TodoItem";
import type { PendingTodoAction } from "@/features/todos/todosSlice";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

const TODAY = "2026-10-27";

const base: Todo = {
  id: "t1",
  title: "Buy milk",
  description: null,
  isCompleted: false,
  dueDate: null,
  createdAt: "2026-10-27T09:00:00.000Z",
  updatedAt: "2026-10-27T09:00:00.000Z",
};

function renderItem(
  changes: Partial<Todo> = {},
  { pending }: { pending?: PendingTodoAction } = {},
) {
  const todo = { ...base, ...changes };
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const result = renderWithProviders(
    <ul>
      <TodoItem todo={todo} pending={pending} today={TODAY} onEdit={onEdit} onDelete={onDelete} />
    </ul>,
  );
  return { ...result, todo, onEdit, onDelete };
}

const editButton = (title = base.title) =>
  screen.getByRole("button", { name: messages.todoItem.editLabel(title) });
const deleteButton = (title = base.title) =>
  screen.getByRole("button", { name: messages.todoItem.deleteLabel(title) });

describe("TodoItem (T-C11)", () => {
  it("is a checkbox named by the title, checked when completed", () => {
    renderItem({ isCompleted: true });
    expect(screen.getByRole("checkbox", { name: "Buy milk" })).toBeChecked();
  });

  it("shows the description and the due date in a readable form", () => {
    renderItem({ description: "Two litres", dueDate: "2026-11-02" });

    expect(screen.getByText("Two litres")).toBeVisible();
    const due = screen.getByText(messages.todoItem.due("2 Nov 2026"));
    expect(due.tagName).toBe("TIME");
    expect(due).toHaveAttribute("datetime", "2026-11-02");
  });

  it("shows an Overdue badge in words, not only colour, for an active todo due before today (EC-43)", () => {
    renderItem({ dueDate: "2026-10-26" });
    expect(screen.getByText(messages.todoItem.overdue)).toBeVisible();
  });

  it.each([
    ["due today", { dueDate: TODAY }],
    ["completed", { dueDate: "2026-10-01", isCompleted: true }],
    ["without a due date", { dueDate: null }],
  ])("shows no Overdue badge when %s", (_case, changes) => {
    renderItem(changes);
    expect(screen.queryByText(messages.todoItem.overdue)).not.toBeInTheDocument();
  });

  it("shows HTML in the title and description as plain text (EC-45)", () => {
    const { container } = renderItem({
      title: '<img src=x onerror="alert(1)"><b>Bold</b>',
      description: "<script>alert(1)</script>",
    });

    expect(screen.getByText('<img src=x onerror="alert(1)"><b>Bold</b>')).toBeVisible();
    expect(screen.getByText("<script>alert(1)</script>")).toBeVisible();
    expect(container.querySelector("img, b, script")).toBeNull();
  });

  it("shows emoji and right-to-left text as typed (EC-47)", () => {
    renderItem({ title: "🛒 شراء الحليب", description: "Café ☕" });

    expect(screen.getByRole("checkbox", { name: "🛒 شراء الحليب" })).toBeInTheDocument();
    expect(screen.getByText("Café ☕")).toBeVisible();
  });

  it("lets a very long word wrap instead of overflowing (EC-46)", () => {
    renderItem({ title: "a".repeat(100) });
    expect(screen.getByText("a".repeat(100))).toHaveClass("break-words");
  });

  it("names the Edit and Delete buttons after the todo and reports clicks", async () => {
    const { user, todo, onEdit, onDelete } = renderItem();

    await user.click(editButton());
    await user.click(deleteButton());

    expect(onEdit).toHaveBeenCalledWith(todo);
    expect(onDelete).toHaveBeenCalledWith(todo);
  });

  it.each<PendingTodoAction>(["updating", "deleting"])(
    "disables every control while the item is %s (EC-53)",
    (pending) => {
      renderItem({}, { pending });

      expect(screen.getByRole("listitem")).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("checkbox")).toBeDisabled();
      expect(editButton()).toBeDisabled();
      expect(deleteButton()).toBeDisabled();
    },
  );
});
