import { Alert } from "@/components/Alert";
import { PageLoading } from "@/components/PageLoading";
import { useAppSelector } from "@/app/hooks";
import { useFilteredTodos } from "@/features/todos/hooks/useFilteredTodos";
import { selectTodosError, selectTodosStatus } from "@/features/todos/todosSelectors";
import { messages } from "@/lib/messages";

export function TodoList() {
  const status = useAppSelector(selectTodosStatus);
  const error = useAppSelector(selectTodosError);
  const { todos } = useFilteredTodos();

  if (status === "idle" || status === "loading") {
    return <PageLoading label={messages.todosPage.loading} />;
  }

  if (status === "error") return <Alert variant="error">{error}</Alert>;

  return (
    <ul aria-label={messages.todosPage.listLabel} className="space-y-2">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className="rounded-card border border-border bg-surface p-4 break-words text-fg"
        >
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
