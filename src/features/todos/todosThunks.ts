import { createAppAsyncThunk } from "@/app/createAppAsyncThunk";
import { todosApi } from "@/features/todos/todosApi";
import type { CreateTodoRequest, Todo, UpdateTodoRequest } from "@/features/todos/types";
import { ApiError } from "@/lib/ApiError";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { messages } from "@/lib/messages";

export type TodoMutationError = { message: string; notFound: boolean };

function toMutationError(error: unknown): TodoMutationError {
  const notFound = error instanceof ApiError && error.status === 404;
  return {
    message: notFound ? messages.todos.alreadyGone : getErrorMessage(error),
    notFound,
  };
}

export const fetchTodos = createAppAsyncThunk<Todo[], void>(
  "todos/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await todosApi.list();
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
  { condition: (_, { getState }) => getState().todos.status !== "loading" },
);

export const createTodo = createAppAsyncThunk<Todo, CreateTodoRequest>(
  "todos/create",
  async (body, { rejectWithValue }) => {
    try {
      return await todosApi.create(body);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const updateTodo = createAppAsyncThunk<
  Todo,
  { id: string; changes: UpdateTodoRequest },
  { rejectValue: TodoMutationError }
>(
  "todos/update",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      return await todosApi.update(id, changes);
    } catch (error) {
      return rejectWithValue(toMutationError(error));
    }
  },
  { condition: ({ id }, { getState }) => !getState().todos.pendingById[id] },
);

export const deleteTodo = createAppAsyncThunk<string, string, { rejectValue: TodoMutationError }>(
  "todos/delete",
  async (id, { rejectWithValue }) => {
    try {
      await todosApi.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(toMutationError(error));
    }
  },
  { condition: (id, { getState }) => !getState().todos.pendingById[id] },
);
