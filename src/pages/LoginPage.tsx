import { useLocation, useNavigate } from "react-router";
import { useAppDispatch } from "@/app/hooks";
import { Alert } from "@/components/Alert";
import {
  AuthCard,
  AuthFooterLink,
  login,
  LoginForm,
  readLoginNotice,
  type LoginValues,
} from "@/features/auth";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const notice = readLoginNotice(location.state);

  async function handleLogin(values: LoginValues) {
    // unwrap() throws the thunk's user-facing message, which LoginForm shows.
    await dispatch(login(values)).unwrap();
    navigate(PATHS.todos, { replace: true });
  }

  return (
    <>
      <title>{messages.app.pageTitle(messages.login.title)}</title>

      <AuthCard
        title={messages.login.title}
        description={messages.login.description}
        footer={
          <AuthFooterLink
            prompt={messages.login.noAccount}
            linkText={messages.login.signupLink}
            to={PATHS.signup}
          />
        }
      >
        {notice && (
          <Alert variant={notice.variant} className="mb-5">
            {notice.message}
          </Alert>
        )}
        <LoginForm onSubmit={handleLogin} />
      </AuthCard>
    </>
  );
}
