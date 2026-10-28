import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/toast/useToast";
import { selectPendingById } from "@/features/todos/todosSelectors";
import { deleteTodo } from "@/features/todos/todosThunks";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";

type DeleteTodoDialogProps = {
  todo: Todo;
  onClose: () => void;
  returnFocusTo?: () => HTMLElement | null;
};

export function DeleteTodoDialog({ todo, onClose, returnFocusTo }: DeleteTodoDialogProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const deleting = useAppSelector(selectPendingById)[todo.id] === "deleting";

  async function confirm() {
    const result = await dispatch(deleteTodo(todo.id));
    if (deleteTodo.rejected.match(result) && result.meta.condition) return;

    onClose();
    if (deleteTodo.fulfilled.match(result)) toast.success(messages.todos.deleted);
    else if (result.payload?.notFound) toast.info(messages.todos.alreadyGone);
    else toast.error(result.payload?.message ?? messages.todos.saveFailed);
  }

  return (
    <ConfirmDialog
      title={messages.todoItem.deleteTitle(todo.title)}
      description={messages.todoItem.deleteDescription}
      confirmLabel={messages.todoItem.deleteConfirm}
      confirmingLabel={messages.todoItem.deleting}
      loading={deleting}
      onConfirm={confirm}
      onCancel={onClose}
      returnFocusTo={returnFocusTo}
    />
  );
}
