import type { CreateTodoRequest, Todo, UpdateTodoRequest } from "@/features/todos/types";
import { http } from "@/lib/http";

const todoPath = (id: string) => `/todos/${encodeURIComponent(id)}` as const;

export const todosApi = {
  list: () => http.get<Todo[]>("/todos"),

  create: (body: CreateTodoRequest) => http.post<Todo>("/todos", body),

  get: (id: string) => http.get<Todo>(todoPath(id)),

  update: (id: string, changes: UpdateTodoRequest) => http.patch<Todo>(todoPath(id), changes),

  remove: (id: string) => http.delete(todoPath(id)),
};
