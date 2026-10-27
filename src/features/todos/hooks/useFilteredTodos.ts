import { useMemo } from "react";
import { useAppSelector } from "@/app/hooks";
import { useTodoFilter } from "@/features/todos/hooks/useTodoFilter";
import { filterTodos } from "@/features/todos/todoFilters";
import { selectTodoItems } from "@/features/todos/todosSelectors";

export function useFilteredTodos() {
  const { filter } = useTodoFilter();
  const items = useAppSelector(selectTodoItems);
  const todos = useMemo(() => filterTodos(items, filter), [items, filter]);

  return { filter, todos };
}
