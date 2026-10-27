import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { CheckCircleIcon } from "@/components/icons";
import { LinkButton } from "@/components/LinkButton";
import { useFilteredTodos } from "@/features/todos/hooks/useFilteredTodos";
import { useTodoFilter } from "@/features/todos/hooks/useTodoFilter";
import { searchForFilter } from "@/features/todos/todoFilters";
import { fetchTodos } from "@/features/todos/todosThunks";
import {
  selectTodoCounts,
  selectTodosError,
  selectTodosStatus,
} from "@/features/todos/todosSelectors";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";

const SKELETON_ROWS = 3;

type TodoListProps = {
  onAddFirst?: () => void;
};

export function TodoList({ onAddFirst }: TodoListProps) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectTodosStatus);
  const error = useAppSelector(selectTodosError);
  const { all } = useAppSelector(selectTodoCounts);
  const { todos } = useFilteredTodos();

  const retry = () => void dispatch(fetchTodos());

  if (all === 0) {
    if (status === "idle" || status === "loading") return <TodoListSkeleton />;
    if (status === "error") return <LoadError message={error} onRetry={retry} />;
    return (
      <EmptyState
        icon={<CheckCircleIcon className="size-6" />}
        title={messages.todoList.emptyTitle}
        description={messages.todoList.emptyDescription}
        action={onAddFirst && <Button onClick={onAddFirst}>{messages.todoList.addFirst}</Button>}
      />
    );
  }

  return (
    <div className="space-y-4">
      {status === "error" && <LoadError message={error} onRetry={retry} />}
      {todos.length === 0 ? <NoMatches /> : <TodoItems todos={todos} />}
    </div>
  );
}

function TodoItems({ todos }: { todos: Todo[] }) {
  return (
    <ul aria-label={messages.todoList.label} className="space-y-2">
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

function TodoListSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">{messages.todoList.loading}</span>
      <ul aria-hidden="true" className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <li key={index} className="h-14 animate-pulse rounded-card bg-surface-muted" />
        ))}
      </ul>
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <Alert
      variant="error"
      action={
        <Button variant="secondary" onClick={onRetry}>
          {messages.todoList.retry}
        </Button>
      }
    >
      {message ?? messages.errors.server}
    </Alert>
  );
}

function NoMatches() {
  const { filter, searchParams } = useTodoFilter();

  return (
    <EmptyState
      title={messages.todoList.noMatchTitle}
      description={filter === "all" ? undefined : messages.todoList.noMatchDescription[filter]}
      action={
        <LinkButton variant="secondary" to={{ search: searchForFilter(searchParams, "all") }}>
          {messages.todoList.showAll}
        </LinkButton>
      }
    />
  );
}
