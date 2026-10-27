import { useLocation, useNavigate } from "react-router";
import { Alert } from "@/components/Alert";
import {
  AuthCard,
  AuthFooterLink,
  authApi,
  LoginForm,
  readLoginNotice,
  type LoginValues,
} from "@/features/auth";
import { withUserFacingError } from "@/lib/formErrors";
import { messages } from "@/lib/messages";
import { PATHS } from "@/lib/paths";
import { tokenStorage } from "@/lib/tokenStorage";

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const notice = readLoginNotice(location.state);

  async function handleLogin(values: LoginValues) {
    const { accessToken } = await withUserFacingError(authApi.login(values));
    tokenStorage.set(accessToken);
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
