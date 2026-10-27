import { useId, type RefObject } from "react";
import { useAppDispatch } from "@/app/hooks";
import { Card } from "@/components/Card";
import { TodoForm } from "@/features/todos/components/TodoForm";
import { toTodoRequest, type TodoFormValues } from "@/features/todos/todoSchemas";
import { createTodo } from "@/features/todos/todosThunks";
import { messages } from "@/lib/messages";

type AddTodoFormProps = {
  titleInputRef?: RefObject<HTMLInputElement | null>;
};

export function AddTodoForm({ titleInputRef }: AddTodoFormProps) {
  const dispatch = useAppDispatch();
  const headingId = useId();

  async function handleAdd(values: TodoFormValues) {
    await dispatch(createTodo(toTodoRequest(values))).unwrap();
  }

  return (
    <section aria-labelledby={headingId}>
      <Card>
        <h2 id={headingId} className="mb-4">
          {messages.todoForm.addHeading}
        </h2>
        <TodoForm
          onSubmit={handleAdd}
          submitLabel={messages.todoForm.add}
          submittingLabel={messages.todoForm.adding}
          resetOnSuccess
          titleInputRef={titleInputRef}
        />
      </Card>
    </section>
  );
}
