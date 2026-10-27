import type { Todo } from "@/features/todos/types";

export const TODO_FILTERS = ["all", "active", "completed"] as const;

export type TodoFilter = (typeof TODO_FILTERS)[number];

export const TODO_FILTER_PARAM = "status";

export function parseTodoFilter(value: string | null): TodoFilter {
  return TODO_FILTERS.find((filter) => filter === value) ?? "all";
}

export function filterTodos(todos: Todo[], filter: TodoFilter): Todo[] {
  if (filter === "active") return todos.filter((todo) => !todo.isCompleted);
  if (filter === "completed") return todos.filter((todo) => todo.isCompleted);
  return todos;
}

export function searchForFilter(current: URLSearchParams, filter: TodoFilter): string {
  const next = new URLSearchParams(current);
  if (filter === "all") next.delete(TODO_FILTER_PARAM);
  else next.set(TODO_FILTER_PARAM, filter);
  const search = next.toString();
  return search ? `?${search}` : "";
}
