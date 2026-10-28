import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { PasswordField } from "@/components/form/PasswordField";
import { TextField } from "@/components/form/TextField";
import { signupSchema, type SignupValues } from "@/features/auth/authSchemas";
import { showSubmitError, type SubmitHandler } from "@/lib/formErrors";
import { messages } from "@/lib/messages";

type SignupFormProps = {
  onSubmit: SubmitHandler<SignupValues>;
};

export function SignupForm({ onSubmit }: SignupFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      showSubmitError(error, setError, ["name", "email", "password", "confirmPassword"]);
    }
  });

  const serverError = errors.root?.server?.message;

  return (
    <form noValidate onSubmit={submit} className="space-y-5">
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <TextField
        label={messages.fields.name}
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />

      <TextField
        label={messages.fields.email}
        type="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        label={messages.fields.password}
        autoComplete="new-password"
        hint={messages.fields.passwordHint}
        error={errors.password?.message}
        {...register("password")}
      />

      <PasswordField
        label={messages.fields.confirmPassword}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        loadingText={messages.signup.submitting}
      >
        {messages.signup.submit}
      </Button>
    </form>
  );
}
