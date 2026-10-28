import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { TextField } from "@/components/form/TextField";
import { emailRequestSchema, type EmailRequestValues } from "@/features/auth/authSchemas";
import { showSubmitError, type SubmitHandler } from "@/lib/formErrors";
import { messages } from "@/lib/messages";

type EmailRequestFormProps = {
  submitLabel: string;
  submittingLabel: string;
  onSubmit: SubmitHandler<EmailRequestValues>;
};

export function EmailRequestForm({
  submitLabel,
  submittingLabel,
  onSubmit,
}: EmailRequestFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmailRequestValues>({
    resolver: zodResolver(emailRequestSchema),
    defaultValues: { email: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      showSubmitError(error, setError, ["email"]);
    }
  });

  const serverError = errors.root?.server?.message;

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <TextField
        label={messages.fields.email}
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" fullWidth loading={isSubmitting} loadingText={submittingLabel}>
        {submitLabel}
      </Button>
    </form>
  );
}
