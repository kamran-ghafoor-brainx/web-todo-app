import type {
  LoginRequest,
  LoginResponse,
  MessageResponse,
  ResetPasswordRequest,
  SignupRequest,
  User,
} from "@/features/auth/types";
import { http } from "@/lib/http";

export const authApi = {
  signup: (body: SignupRequest) =>
    http.post<MessageResponse>("/auth/signup", body, { auth: false }),

  verifyEmail: (token: string) =>
    http.post<MessageResponse>("/auth/verify-email", { token }, { auth: false }),

  resendVerification: (email: string) =>
    http.post<MessageResponse>("/auth/resend-verification", { email }, { auth: false }),

  login: (body: LoginRequest) => http.post<LoginResponse>("/auth/login", body, { auth: false }),

  me: (options?: { signal?: AbortSignal }) => http.get<User>("/auth/me", options),

  logout: () => http.post<void>("/auth/logout"),

  forgotPassword: (email: string) =>
    http.post<MessageResponse>("/auth/forgot-password", { email }, { auth: false }),

  resetPassword: (body: ResetPasswordRequest) =>
    http.post<MessageResponse>("/auth/reset-password", body, { auth: false }),
};
