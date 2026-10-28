export type User = {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
};

export type SignupRequest = { name: string; email: string; password: string };

export type LoginRequest = { email: string; password: string };

export type LoginResponse = { accessToken: string; user: User };

export type ResetPasswordRequest = { token: string; password: string };

export type MessageResponse = { message: string };
