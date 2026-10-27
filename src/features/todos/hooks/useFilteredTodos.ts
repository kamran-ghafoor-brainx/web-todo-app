import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useAppSelector } from "@/app/hooks";
import { filterTodos, parseTodoFilter, TODO_FILTER_PARAM } from "@/features/todos/todoFilters";
import { selectTodoItems } from "@/features/todos/todosSelectors";

export function useFilteredTodos() {
  const [searchParams] = useSearchParams();
  const filter = parseTodoFilter(searchParams.get(TODO_FILTER_PARAM));
  const items = useAppSelector(selectTodoItems);
  const todos = useMemo(() => filterTodos(items, filter), [items, filter]);

  return { filter, todos };
}
