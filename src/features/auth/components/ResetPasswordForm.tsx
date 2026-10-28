import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { PasswordField } from "@/components/form/PasswordField";
import { resetPasswordSchema, type ResetPasswordValues } from "@/features/auth/authSchemas";
import { showSubmitError, type SubmitHandler } from "@/lib/formErrors";
import { messages } from "@/lib/messages";

type ResetPasswordFormProps = {
  onSubmit: SubmitHandler<ResetPasswordValues>;
};

export function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      showSubmitError(error, setError, ["password", "confirmPassword"]);
    }
  });

  const serverError = errors.root?.server?.message;

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <PasswordField
        label={messages.fields.newPassword}
        autoComplete="new-password"
        hint={messages.fields.passwordHint}
        error={errors.password?.message}
        {...register("password")}
      />

      <PasswordField
        label={messages.fields.confirmNewPassword}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        loadingText={messages.resetPassword.submitting}
      >
        {messages.resetPassword.submit}
      </Button>
    </form>
  );
}
