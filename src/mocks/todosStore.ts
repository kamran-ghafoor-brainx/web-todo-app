import type { Todo } from "@/features/todos/types";
import { getDb, saveDb, type MockTodo } from "@/mocks/db";
import { newId } from "@/mocks/security";

export type TodoChanges = Partial<
  Pick<MockTodo, "title" | "description" | "dueDate" | "isCompleted">
>;

export function toPublicTodo(todo: MockTodo): Todo {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    isCompleted: todo.isCompleted,
    dueDate: todo.dueDate,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}

export async function listTodosOf(userId: string): Promise<MockTodo[]> {
  const db = await getDb();
  return db.todos
    .filter((todo) => todo.userId === userId)
    .reverse()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findTodoOf(userId: string, id: string): Promise<MockTodo | undefined> {
  const db = await getDb();
  return db.todos.find((todo) => todo.id === id && todo.userId === userId);
}

export async function createTodo(
  userId: string,
  input: { title: string; description: string | null; dueDate: string | null },
): Promise<MockTodo> {
  const db = await getDb();
  const now = new Date().toISOString();
  const todo: MockTodo = {
    id: newId(),
    userId,
    ...input,
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
  db.todos.push(todo);
  saveDb();
  return todo;
}

export async function updateTodo(todo: MockTodo, changes: TodoChanges): Promise<MockTodo> {
  Object.assign(todo, changes, { updatedAt: new Date().toISOString() });
  saveDb();
  return todo;
}

export async function deleteTodo(todo: MockTodo): Promise<void> {
  const db = await getDb();
  db.todos = db.todos.filter((candidate) => candidate !== todo);
  saveDb();
}
