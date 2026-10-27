import { z } from "zod";
import type { CreateTodoRequest, Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export const titleField = z
  .string()
  .trim()
  .min(1, { error: messages.validation.titleRequired })
  .max(TITLE_MAX_LENGTH, { error: messages.validation.titleTooLong });

export const descriptionField = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, { error: messages.validation.descriptionTooLong });

export const dueDateField = z.iso.date({ error: messages.validation.dueDateInvalid });

const optionalDueDateField = z
  .string()
  .refine((value) => value === "" || dueDateField.safeParse(value).success, {
    error: messages.validation.dueDateInvalid,
  });

export const todoFormSchema = z.object({
  title: titleField,
  description: descriptionField,
  dueDate: optionalDueDateField,
});

export type TodoFormValues = z.infer<typeof todoFormSchema>;

export const emptyTodoFormValues: TodoFormValues = { title: "", description: "", dueDate: "" };

export function toTodoFormValues(todo: Todo): TodoFormValues {
  return {
    title: todo.title,
    description: todo.description ?? "",
    dueDate: todo.dueDate ?? "",
  };
}

export function toTodoRequest(values: TodoFormValues): Required<CreateTodoRequest> {
  return {
    title: values.title,
    description: values.description || null,
    dueDate: values.dueDate || null,
  };
}
