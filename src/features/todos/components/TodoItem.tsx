import { useId } from "react";
import { useAppDispatch } from "@/app/hooks";
import { Button } from "@/components/Button";
import { AlertCircleIcon } from "@/components/icons";
import { useToast } from "@/components/toast/useToast";
import { formatDate, isOverdue } from "@/features/todos/dates";
import type { PendingTodoAction } from "@/features/todos/todosSlice";
import { updateTodo } from "@/features/todos/todosThunks";
import type { Todo } from "@/features/todos/types";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

type TodoItemProps = {
  todo: Todo;
  pending?: PendingTodoAction;
  today: string;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
};

export function TodoItem({ todo, pending, today, onEdit, onDelete }: TodoItemProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const checkboxId = useId();
  const busy = pending !== undefined;
  const overdue = isOverdue(todo, today);

  async function toggle() {
    const result = await dispatch(
      updateTodo({ id: todo.id, changes: { isCompleted: !todo.isCompleted } }),
    );
    if (!updateTodo.rejected.match(result) || !result.payload) return;
    if (result.payload.notFound) toast.info(messages.todos.alreadyGone);
    else toast.error(result.payload.message);
  }

  return (
    <li
      aria-busy={busy || undefined}
      className={cn(
        "rounded-card border border-border bg-surface p-4 transition-opacity",
        busy && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={todo.isCompleted}
          disabled={busy}
          onChange={toggle}
          className="mt-0.5 size-5 shrink-0 accent-primary disabled:cursor-not-allowed"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <label
            htmlFor={checkboxId}
            className={cn(
              "block font-medium break-words",
              todo.isCompleted ? "text-fg-muted line-through" : "text-fg",
            )}
          >
            {todo.title}
          </label>
          {todo.description && (
            <p className="line-clamp-3 text-sm break-words whitespace-pre-line text-fg-muted">
              {todo.description}
            </p>
          )}
          {todo.dueDate && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
              <time dateTime={todo.dueDate}>{messages.todoItem.due(formatDate(todo.dueDate))}</time>
              {overdue && (
                <span className="inline-flex items-center gap-1 rounded-full bg-danger-subtle px-2 py-0.5 text-xs font-semibold text-danger">
                  <AlertCircleIcon className="size-3.5" />
                  {messages.todoItem.overdue}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="secondary"
          disabled={busy}
          aria-label={messages.todoItem.editLabel(todo.title)}
          onClick={() => onEdit(todo)}
        >
          {messages.todoItem.edit}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          aria-label={messages.todoItem.deleteLabel(todo.title)}
          onClick={() => onDelete(todo)}
        >
          {messages.todoItem.delete}
        </Button>
      </div>
    </li>
  );
}
