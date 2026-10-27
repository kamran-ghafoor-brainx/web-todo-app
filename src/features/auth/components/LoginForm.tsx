import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { PasswordField } from "@/components/form/PasswordField";
import { TextField } from "@/components/form/TextField";
import { TextLink } from "@/components/TextLink";
import { loginSchema, type LoginValues } from "@/features/auth/authSchemas";
import { showSubmitError, type SubmitHandler } from "@/lib/formErrors";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

export type LoginSubmitHandler = SubmitHandler<LoginValues>;

type LoginFormProps = {
  onSubmit: LoginSubmitHandler;
};

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      showSubmitError(error, setError, ["email", "password"]);
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

      <div className="space-y-2">
        <PasswordField
          label={messages.fields.password}
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end text-sm">
          <TextLink to={PATHS.forgotPassword}>{messages.login.forgotPassword}</TextLink>
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        loadingText={messages.login.submitting}
      >
        {messages.login.submit}
      </Button>
    </form>
  );
}
