import { createBrowserRouter, Navigate, type RouteObject } from "react-router";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { PageLoading } from "@/components/PageLoading";
import { env } from "@/lib/env";
import { PATHS } from "@/lib/paths";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { SignupPage } from "@/pages/SignupPage";
import { TodosPage } from "@/pages/TodosPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";

const devRoutes: RouteObject[] = env.VITE_USE_MOCK
  ? [
      {
        path: PATHS.devMailbox,
        HydrateFallback: PageLoading,
        lazy: async () => ({ Component: (await import("@/pages/DevMailboxPage")).DevMailboxPage }),
      },
    ]
  : [];

export const routes: RouteObject[] = [
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { path: PATHS.login, element: <LoginPage /> },
          { path: PATHS.signup, element: <SignupPage /> },
          { path: PATHS.verifyEmail, element: <VerifyEmailPage /> },
          { path: PATHS.forgotPassword, element: <ForgotPasswordPage /> },
          { path: PATHS.resetPassword, element: <ResetPasswordPage /> },
          { path: PATHS.todos, element: <TodosPage /> },
          ...devRoutes,
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  {
    path: PATHS.home,
    element: <Navigate to={PATHS.login} replace />,
  },
];

export const router = createBrowserRouter(routes);
