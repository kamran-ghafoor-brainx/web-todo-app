# API contract

The contract that both the MSW mock (`src/mocks`) and the future NestJS backend implement.
Source of truth: section 8 of [Todo-App-Project-Plan.md](../Todo-App-Project-Plan.md). If the mock or the backend changes, update this file in the same commit.

## 1. Conventions

- Base URL: `${VITE_API_URL}` (for example `/api` in mock mode, `http://localhost:3000` against NestJS).
- JSON in and out. Timestamps are ISO 8601 strings. `dueDate` is a date-only string, `YYYY-MM-DD`.
- Authenticated endpoints need `Authorization: Bearer <accessToken>`.
- The frontend **never** sends a user id. The server derives the user from the token.
- The access token is **opaque** to the frontend. It is never decoded on the client.

## 2. Error format

The NestJS default exception body, plus an optional machine-readable `code`:

```json
{ "statusCode": 400, "message": ["email must be an email"], "error": "Bad Request" }
```

```json
{
  "statusCode": 403,
  "message": "Email not verified",
  "error": "Forbidden",
  "code": "EMAIL_NOT_VERIFIED"
}
```

`message` can be a string or an array of strings (validation errors). **Clients branch on `statusCode` and `code`, never on `message` text.**

| `code`                     | Status | Meaning                                                           |
| -------------------------- | ------ | ----------------------------------------------------------------- |
| `EMAIL_ALREADY_REGISTERED` | 409    | Signup with an existing email                                     |
| `INVALID_CREDENTIALS`      | 401    | Wrong email or password                                           |
| `EMAIL_NOT_VERIFIED`       | 403    | Login before verifying the email                                  |
| `TOKEN_INVALID`            | 400    | Verification or reset token is malformed, unknown or already used |
| `TOKEN_EXPIRED`            | 400    | Verification or reset token is past its expiry                    |
| `EMAIL_ALREADY_VERIFIED`   | 409    | Verifying an account that is already verified                     |
| `RATE_LIMITED`             | 429    | Too many attempts. Sent with a `Retry-After` header (seconds).    |

## 3. Models

```ts
interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  dueDate: string | null; // "YYYY-MM-DD"
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

## 4. Validation rules

The client (Zod) and the server (mock handlers, later NestJS DTOs) enforce the same rules.

| Field         | Rule                                                                                    |
| ------------- | --------------------------------------------------------------------------------------- |
| `name`        | Trimmed, 2 to 50 characters                                                             |
| `email`       | Trimmed, lowercased, valid email, up to 254 characters                                  |
| `password`    | 8 to 64 characters, at least one letter and one number, spaces allowed, **not trimmed** |
| `title`       | Trimmed, 1 to 100 characters                                                            |
| `description` | Optional, up to 500 characters                                                          |
| `dueDate`     | Optional, `YYYY-MM-DD`                                                                  |

## 5. Endpoints

### 5.1 Authentication

| Method and path                  | Auth | Request body                | Success                              | Errors                                                                  |
| -------------------------------- | ---- | --------------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| `POST /auth/signup`              | No   | `{ name, email, password }` | `201` `{ message }`                  | `400` validation, `409 EMAIL_ALREADY_REGISTERED`                        |
| `POST /auth/verify-email`        | No   | `{ token }`                 | `200` `{ message }`                  | `400 TOKEN_INVALID`, `400 TOKEN_EXPIRED`, `409 EMAIL_ALREADY_VERIFIED`  |
| `POST /auth/resend-verification` | No   | `{ email }`                 | `200` `{ message }` (always generic) | `429 RATE_LIMITED`                                                      |
| `POST /auth/login`               | No   | `{ email, password }`       | `200` `{ accessToken, user }`        | `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED`, `429 RATE_LIMITED` |
| `GET /auth/me`                   | Yes  | none                        | `200` `User`                         | `401`                                                                   |
| `POST /auth/logout`              | Yes  | none                        | `204`                                | `401` (ignored by the client)                                           |
| `POST /auth/forgot-password`     | No   | `{ email }`                 | `200` `{ message }` (always generic) | `429 RATE_LIMITED`                                                      |
| `POST /auth/reset-password`      | No   | `{ token, password }`       | `200` `{ message }`                  | `400 TOKEN_INVALID`, `400 TOKEN_EXPIRED`, `400` validation              |

### 5.2 Todos

All todo endpoints require authentication and are scoped to the token's user.

| Method and path     | Request body                                          | Success                      | Errors                                      |
| ------------------- | ----------------------------------------------------- | ---------------------------- | ------------------------------------------- |
| `GET /todos`        | none                                                  | `200` `Todo[]`, newest first | `401`                                       |
| `POST /todos`       | `{ title, description?, dueDate? }`                   | `201` `Todo`                 | `400`, `401`                                |
| `GET /todos/:id`    | none                                                  | `200` `Todo`                 | `401`, `404` (also for another user's todo) |
| `PATCH /todos/:id`  | any of `{ title, description, dueDate, isCompleted }` | `200` `Todo`                 | `400`, `401`, `404`                         |
| `DELETE /todos/:id` | none                                                  | `204`                        | `401`, `404`                                |

## 6. Behavior rules

- A user's todos are only ever visible to that user. Another user's todo id returns `404`, not `403`, so its existence is not revealed.
- Todo `title` and `description` are trimmed. A blank `description` is stored as `null`. Unknown body fields (for example `userId`) are ignored.
- `forgot-password` and `resend-verification` return `200` for **any** email, so accounts cannot be enumerated.
- Verification and reset tokens are **single-use**. Verification tokens last 24 hours, reset tokens 1 hour.
- Emails are compared case-insensitively, after trimming.
- A `401` from `POST /auth/login` means wrong credentials. A `401` on any request that carried a token means the session has ended.

## 7. Mapping to the NestJS backend

| Contract piece                      | NestJS implementation                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Request bodies and validation rules | DTOs with `class-validator`, matching the Zod schemas                                 |
| Error shape                         | Default exception filter output, plus a custom exception that adds `code`             |
| Bearer token                        | JWT with Passport, `JwtAuthGuard` on `/auth/me`, `/auth/logout` and `/todos/*`        |
| Ownership                           | Read the user id from the token, query by `userId`, return `404` when nothing matches |
| Documentation                       | Swagger (`@nestjs/swagger`), checked against this contract                            |
