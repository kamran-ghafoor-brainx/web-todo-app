import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, type RefObject } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/form/TextArea";
import { TextField } from "@/components/form/TextField";
import {
  DESCRIPTION_MAX_LENGTH,
  emptyTodoFormValues,
  todoFormSchema,
  type TodoFormValues,
} from "@/features/todos/todoSchemas";
import { showSubmitError, type SubmitHandler } from "@/lib/formErrors";
import { messages } from "@/lib/messages";

type TodoFormProps = {
  onSubmit: SubmitHandler<TodoFormValues>;
  submitLabel: string;
  submittingLabel: string;
  defaultValues?: TodoFormValues;
  /** Clears the form after a successful save, ready for the next todo. */
  resetOnSuccess?: boolean;
  titleInputRef?: RefObject<HTMLInputElement | null>;
  onCancel?: () => void;
};

export function TodoForm({
  onSubmit,
  submitLabel,
  submittingLabel,
  defaultValues = emptyTodoFormValues,
  resetOnSuccess = false,
  titleInputRef,
  onCancel,
}: TodoFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<TodoFormValues>({ resolver: zodResolver(todoFormSchema), defaultValues });

  const description = useWatch({ control, name: "description" });
  const titleElement = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!resetOnSuccess || !isSubmitSuccessful) return;
    reset();
    titleElement.current?.focus();
  }, [resetOnSuccess, isSubmitSuccessful, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      showSubmitError(error, setError, ["title", "description", "dueDate"]);
    }
  });

  const { ref: titleRef, ...titleField } = register("title");
  const serverError = errors.root?.server?.message;

  return (
    <form noValidate onSubmit={submit} className="space-y-4">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <TextField
        label={messages.todoForm.title}
        autoComplete="off"
        error={errors.title?.message}
        ref={(element) => {
          titleRef(element);
          titleElement.current = element;
          if (titleInputRef) titleInputRef.current = element;
        }}
        {...titleField}
      />

      <TextArea
        label={messages.todoForm.description}
        rows={3}
        hint={messages.todoForm.descriptionCount(description.trim().length, DESCRIPTION_MAX_LENGTH)}
        error={errors.description?.message}
        {...register("description")}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <TextField
          label={messages.todoForm.dueDate}
          type="date"
          className="sm:w-56"
          error={errors.dueDate?.message}
          {...register("dueDate")}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {onCancel && (
            <Button variant="secondary" disabled={isSubmitting} onClick={onCancel}>
              {messages.dialog.cancel}
            </Button>
          )}
          <Button type="submit" loading={isSubmitting} loadingText={submittingLabel}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
