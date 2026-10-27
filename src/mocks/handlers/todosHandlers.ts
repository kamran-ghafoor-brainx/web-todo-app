import { http, HttpResponse } from "msw";
import { z } from "zod";
import { descriptionField, dueDateField, titleField } from "@/features/todos/todoSchemas";
import type { Todo } from "@/features/todos/types";
import { apiUrl, MAGIC_FAIL_TITLE } from "@/mocks/config";
import {
  authenticate,
  errorResponse,
  parseJsonBody,
  unauthorizedResponse,
} from "@/mocks/responses";
import {
  createTodo,
  deleteTodo,
  findTodoOf,
  listTodosOf,
  toPublicTodo,
  updateTodo,
  type TodoChanges,
} from "@/mocks/todosStore";

const createBody = z.object({
  title: titleField,
  description: descriptionField.nullish(),
  dueDate: dueDateField.nullish(),
});

const updateBody = z.object({
  title: titleField.optional(),
  description: descriptionField.nullable().optional(),
  dueDate: dueDateField.nullable().optional(),
  isCompleted: z.boolean().optional(),
});

type TodoParams = { id: string };

const blankToNull = (value: string | null | undefined) => (value ? value : null);

const isMagicFailure = (title: string | undefined) => title?.includes(MAGIC_FAIL_TITLE) ?? false;

function serverError() {
  return errorResponse(500, "Internal server error");
}

function todoNotFound() {
  return errorResponse(404, "Todo not found");
}

function changesFrom(body: z.infer<typeof updateBody>): TodoChanges {
  const changes: TodoChanges = {};
  if (body.title !== undefined) changes.title = body.title;
  if (body.description !== undefined) changes.description = blankToNull(body.description);
  if (body.dueDate !== undefined) changes.dueDate = body.dueDate;
  if (body.isCompleted !== undefined) changes.isCompleted = body.isCompleted;
  return changes;
}

export const todosHandlers = [
  http.get(apiUrl("/todos"), async ({ request }) => {
    const user = await authenticate(request);
    if (!user) return unauthorizedResponse();

    const todos = await listTodosOf(user.id);
    return HttpResponse.json<Todo[]>(todos.map(toPublicTodo));
  }),

  http.post(apiUrl("/todos"), async ({ request }) => {
    const user = await authenticate(request);
    if (!user) return unauthorizedResponse();

    const body = await parseJsonBody(request, createBody);
    if (!body.ok) return body.response;
    if (isMagicFailure(body.data.title)) return serverError();

    const todo = await createTodo(user.id, {
      title: body.data.title,
      description: blankToNull(body.data.description),
      dueDate: body.data.dueDate ?? null,
    });
    return HttpResponse.json<Todo>(toPublicTodo(todo), { status: 201 });
  }),

  http.get<TodoParams>(apiUrl("/todos/:id"), async ({ request, params }) => {
    const user = await authenticate(request);
    if (!user) return unauthorizedResponse();

    const todo = await findTodoOf(user.id, params.id);
    return todo ? HttpResponse.json<Todo>(toPublicTodo(todo)) : todoNotFound();
  }),

  http.patch<TodoParams>(apiUrl("/todos/:id"), async ({ request, params }) => {
    const user = await authenticate(request);
    if (!user) return unauthorizedResponse();

    const body = await parseJsonBody(request, updateBody);
    if (!body.ok) return body.response;

    const todo = await findTodoOf(user.id, params.id);
    if (!todo) return todoNotFound();
    if (isMagicFailure(body.data.title)) return serverError();

    const updated = await updateTodo(todo, changesFrom(body.data));
    return HttpResponse.json<Todo>(toPublicTodo(updated));
  }),

  http.delete<TodoParams>(apiUrl("/todos/:id"), async ({ request, params }) => {
    const user = await authenticate(request);
    if (!user) return unauthorizedResponse();

    const todo = await findTodoOf(user.id, params.id);
    if (!todo) return todoNotFound();

    await deleteTodo(todo);
    return new HttpResponse(null, { status: 204 });
  }),
];
