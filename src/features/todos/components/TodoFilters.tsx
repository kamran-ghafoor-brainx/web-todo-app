import { Link } from "react-router";
import { useAppSelector } from "@/app/hooks";
import { useTodoFilter } from "@/features/todos/hooks/useTodoFilter";
import { searchForFilter, TODO_FILTERS } from "@/features/todos/todoFilters";
import { selectTodoCounts, selectTodosStatus } from "@/features/todos/todosSelectors";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

export function TodoFilters() {
  const { filter: current, searchParams } = useTodoFilter();
  const counts = useAppSelector(selectTodoCounts);
  const countsKnown = useAppSelector(selectTodosStatus) === "success";

  return (
    <nav aria-label={messages.todoFilters.label}>
      <ul className="flex flex-wrap gap-2">
        {TODO_FILTERS.map((filter) => {
          const isCurrent = filter === current;
          return (
            <li key={filter}>
              <Link
                to={{ search: searchForFilter(searchParams, filter) }}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-touch items-center gap-2 rounded-control border px-4 text-sm font-medium transition-colors",
                  isCurrent
                    ? "border-transparent bg-primary text-on-primary"
                    : "border-border-strong bg-surface text-fg hover:bg-surface-muted",
                )}
              >
                {messages.todoFilters[filter]}
                {countsKnown && (
                  <span
                    className={cn(
                      "rounded-full px-2 text-xs tabular-nums",
                      isCurrent ? "bg-on-primary/20" : "bg-surface-muted",
                    )}
                  >
                    {counts[filter]}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
