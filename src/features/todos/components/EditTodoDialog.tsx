import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Dialog } from "@/components/Dialog";
import { useToast } from "@/components/toast/useToast";
import { TodoForm } from "@/features/todos/components/TodoForm";
import { toTodoFormValues, toTodoRequest, type TodoFormValues } from "@/features/todos/todoSchemas";
import { selectPendingById } from "@/features/todos/todosSelectors";
import { updateTodo } from "@/features/todos/todosThunks";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";

type EditTodoDialogProps = {
  todo: Todo;
  onClose: () => void;
  returnFocusTo?: () => HTMLElement | null;
};

export function EditTodoDialog({ todo, onClose, returnFocusTo }: EditTodoDialogProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const saving = useAppSelector(selectPendingById)[todo.id] === "updating";

  async function save(values: TodoFormValues) {
    const result = await dispatch(updateTodo({ id: todo.id, changes: toTodoRequest(values) }));
    if (updateTodo.fulfilled.match(result)) {
      onClose();
      toast.success(messages.todos.updated);
      return;
    }
    if (result.payload?.notFound) {
      onClose();
      toast.info(messages.todos.alreadyGone);
      return;
    }
    throw result.payload?.message ?? messages.todos.saveFailed;
  }

  return (
    <Dialog
      title={messages.todoItem.editHeading}
      onClose={() => {
        if (!saving) onClose();
      }}
      returnFocusTo={returnFocusTo}
    >
      <TodoForm
        defaultValues={toTodoFormValues(todo)}
        submitLabel={messages.todoItem.save}
        submittingLabel={messages.todoItem.saving}
        onSubmit={save}
        onCancel={onClose}
      />
    </Dialog>
  );
}
