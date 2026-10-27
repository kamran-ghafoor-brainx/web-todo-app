import { useSearchParams } from "react-router";
import { parseTodoFilter, TODO_FILTER_PARAM } from "@/features/todos/todoFilters";

export function useTodoFilter() {
  const [searchParams] = useSearchParams();
  return { filter: parseTodoFilter(searchParams.get(TODO_FILTER_PARAM)), searchParams };
}
