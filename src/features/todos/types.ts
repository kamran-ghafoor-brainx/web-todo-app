export type Todo = {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTodoRequest = {
  title: string;
  description?: string | null;
  dueDate?: string | null;
};

export type UpdateTodoRequest = Partial<{
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
}>;
