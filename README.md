# Todo App with Authentication

A React + TypeScript single-page app where users sign up, verify their email, log in, recover a forgotten password, and manage their own todos. It runs against a **mock API (MSW)** that follows the same contract the future NestJS backend will implement, so the whole app works with no server and no email service.

This app is the base of a larger Task Manager (collaborators, deadlines, notifications). Those features are out of scope here, but the code is structured so they can be added without a rewrite.

> **Status:** authentication and the full todos feature are complete and tested (483 tests). Not yet done: general route guards, the CI workflow, a deployed demo, and a final accessibility audit. See [Project status](#project-status).

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Setting up on a new machine](#setting-up-on-a-new-machine)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [Trying the app: test accounts and magic inputs](#trying-the-app-test-accounts-and-magic-inputs)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [API contract](#api-contract)
- [Key decisions and trade-offs](#key-decisions-and-trade-offs)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Known limitations](#known-limitations)
- [Project status](#project-status)
- [Next steps](#next-steps)
- [Documents](#documents)

## Features

**Authentication**

- Sign up with name, email and password. A "Check your email" panel lets you resend the link, with a 60-second cooldown.
- Email verification through a link (with a mock mailbox at `/dev/mailbox`). It handles expired, invalid and already-used links.
- Log in, with clear messages for wrong credentials, an unverified email and rate limiting.
- Forgot password and reset password, using single-use, expiring links.
- The session is restored after a page refresh, without a flash of the login page. If the server is unreachable you get a retry screen, and you are not logged out.
- An expired session (a `401`) logs you out once, with one "Your session expired" message.
- Logout clears all app data. Logging out in another tab logs this tab out too.

**Todos**

- Create todos with a title (required), a description (optional, with a character counter) and a due date (optional).
- List, newest first, with loading, error-with-retry, first-time empty and "no matches" states.
- Tick a todo as done. While a todo is saving, its controls are disabled.
- Edit a todo in a dialog that reuses the create form.
- Delete a todo after a confirmation dialog that names it.
- All / Active / Completed filters with counts, stored in the URL (`?status=active`).
- An **Overdue** badge (text and colour) on unfinished todos that are past their due date.
- Toast messages for added, updated, deleted, "already gone" and failed actions.
- Every user sees only their own todos. Another user's todo returns `404`.

## Tech stack

| Concern              | Choice                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Build tool           | Vite 8                                                                  |
| UI                   | React 19, Tailwind CSS 4 (semantic design tokens), Roboto (self-hosted) |
| Language             | TypeScript 6, `strict` plus `noUncheckedIndexedAccess`, no `any`        |
| State                | Redux Toolkit 2 (`createSlice`, `createAsyncThunk`, `createSelector`)   |
| Routing              | React Router 8 (data router)                                            |
| Forms and validation | React Hook Form 7 with Zod 4                                            |
| Mock backend         | MSW 3: Service Worker in the browser, Node server in tests              |
| Tests                | Vitest 5, React Testing Library, user-event, jsdom                      |
| Code quality         | ESLint 10 (with accessibility and React hooks rules), Prettier          |

## Setting up on a new machine

### 1. Prerequisites

| Tool        | Version                                            | Check with       |
| ----------- | -------------------------------------------------- | ---------------- |
| **Node.js** | **22.22.2+ (22.x)**, **24.15+ (24.x)**, or **26+** | `node --version` |
| npm         | Comes with Node (10+)                              | `npm --version`  |
| Git         | Any recent version                                 | `git --version`  |

> **Node version matters.** Vite runs on Node 20.19+, but the test tools (Vitest 5 and jsdom 30) need **Node 22.22.2+ (on 22.x), 24.15+ (on 24.x), or 26+**. Node 23.x, 24.0–24.14 and 25.x are **not** supported. On Node 20, `npm test` crashes before running any test with `webidl.util.markAsUncloneable is not a function`.
>
> If you have several Node versions installed, make sure the right one comes first on your `PATH`. For example, Homebrew's `node@20` can shadow a newer `node`. With [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22` (or `nvm install 24`).

### 2. Get the code and install

```bash
git clone <repository-url> todo-task-app
cd todo-task-app
npm install
```

`npm install` uses the committed `package-lock.json`, so everyone gets the same versions. The mock API's service worker (`public/mockServiceWorker.js`) is already committed. You do not need to run `msw init`.

### 3. Create your environment file

```bash
cp .env.example .env
```

The defaults (`VITE_API_URL=/api`, `VITE_USE_MOCK=true`) run the app against the mock API. You do not need to change anything. See [Environment variables](#environment-variables).

### 4. Run the app

```bash
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5173>). Log in as **`demo@example.com` / `Passw0rd!`** to see five sample todos.

### 5. Verify everything works

```bash
npm run test:run   # all tests, once
npm run build      # type-check and production build
```

Both should pass on a fresh clone. For the full pre-push check, see [`npm run check`](#scripts).

### Troubleshooting

| Problem                                                 | Fix                                                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tests crash with `markAsUncloneable is not a function`  | Your Node version is not supported (for example Node 20, 23, 25 or an early 24). Switch to Node 22.22.2+, 24.15+ or 26+ (see Prerequisites).                                 |
| The app shows "Invalid environment variables"           | `.env` is missing or wrong. Run `cp .env.example .env`.                                                                                                                      |
| Every request fails with a network error in the browser | The mock service worker could not start (for example, service workers are blocked in a private window). Check the console, then use a normal window over `http://localhost`. |
| You want a clean slate of mock data                     | Open `/dev/mailbox` and click **Reset mock data**, or clear the site's `localStorage`.                                                                                       |

## Scripts

| Command                           | What it does                                                              |
| --------------------------------- | ------------------------------------------------------------------------- |
| `npm run dev`                     | Start the dev server with hot reload (mock API on)                        |
| `npm run build`                   | Type-check (`tsc -b`) and build for production into `dist/`               |
| `npm run build:demo`              | Build with `.env.demo` (mock mode), for a static demo deployment          |
| `npm run preview`                 | Serve the production build locally                                        |
| `npm test`                        | Run tests in watch mode                                                   |
| `npm run test:run`                | Run all tests once                                                        |
| `npm run coverage`                | Run tests with a coverage report                                          |
| `npm run lint`                    | ESLint, with zero warnings allowed                                        |
| `npm run typecheck`               | TypeScript only                                                           |
| `npm run format` / `format:check` | Format with Prettier, or check formatting                                 |
| `npm run check`                   | **Run before every push:** lint, typecheck, format check, tests and build |

## Environment variables

Everything prefixed with `VITE_` is bundled into the browser code, so **never put a secret in these files**. The values are validated with Zod at startup (`src/lib/env.ts`). A missing or invalid value stops the app with a clear message.

| Variable        | Example                           | Meaning                                                                                                         |
| --------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`  | `/api` or `http://localhost:3000` | Base URL of the API. A path or an absolute URL.                                                                 |
| `VITE_USE_MOCK` | `true` / `false`                  | `true` starts the MSW mock API in the browser before the app renders. `false` sends requests to `VITE_API_URL`. |

| File           | Committed            | Used for                        |
| -------------- | -------------------- | ------------------------------- |
| `.env.example` | Yes                  | The template you copy to `.env` |
| `.env`         | **No** (git-ignored) | Your local settings             |
| `.env.test`    | Yes                  | Tests (`vitest`)                |
| `.env.demo`    | Yes                  | `npm run build:demo`            |

**Mock mode vs live mode.** Switching to the real backend is a configuration change, not a code change: set `VITE_USE_MOCK=false` and point `VITE_API_URL` at the backend. The app code is the same in both modes. The mock code is loaded lazily, only when `VITE_USE_MOCK=true`. (The NestJS backend is not built yet, so live mode has nothing to talk to today.)

## Trying the app: test accounts and magic inputs

All mock data is stored in your browser's `localStorage`, so it survives a refresh.

| Email                    | Password         | Behaviour                                                                                                |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------- |
| `demo@example.com`       | `Passw0rd!`      | Verified, with 5 seeded todos (one overdue, one completed)                                               |
| `unverified@example.com` | `Passw0rd!`      | Login is refused with "Please verify your email"                                                         |
| `shortlived@example.com` | `Passw0rd!`      | Verified, with no todos. The session expires after **30 seconds**, so the next action logs you out once. |
| `locked@example.com`     | any              | Login always returns "Too many attempts" (`429`)                                                         |
| `slow@example.com`       | `Passw0rd!`      | Every request takes 3 seconds, to show the loading states                                                |
| any new email            | a valid password | Sign up, then verify through the mock mailbox                                                            |

**Mock mailbox (`/dev/mailbox`).** There is no real email. Signup, resend-verification and forgot-password "send" an email to the mailbox page instead. Open `/dev/mailbox`, click the link, and the flow continues. The page also has a **Reset mock data** button. It exists only in mock mode.

**Magic todo input.** A title containing **`[fail]`** makes create and edit return a server error (`500`), so you can see the error handling: the form keeps your input and shows the message.

**Other things to try**

- Refresh on `/todos?status=active`. You stay logged in and the filter is kept.
- Open two tabs, log out in one, and watch the other tab log out too.
- Turn the network off in DevTools. You get friendly messages, a Retry button, and your typed text is kept.

**Password rule:** 8 to 64 characters, with at least one letter and one number. Spaces are allowed.

## Project structure

Feature-based folders. Imports only go downward: `app → pages → features → components / hooks / lib`. Tests live in `tests/`, mirroring `src/`.

```text
src/
├── app/            # store (reset on session end), typed hooks, typed thunk creator,
│                   # sessionEnded event, session start-up listeners, router, layouts, Providers
├── pages/          # thin route screens (Login, Signup, VerifyEmail, ForgotPassword,
│                   # ResetPassword, Todos, NotFound, RouteError, DevMailbox)
├── features/
│   ├── auth/       # API, slice, thunks, selectors, schemas, forms, login notices
│   └── todos/      # API, slice, thunks, selectors, schemas, date helpers, filters,
│                   # components (TodoForm, TodoList, TodoItem, dialogs), hooks
├── components/     # shared UI with no business logic: Button, fields, Alert, Dialog,
│                   # ConfirmDialog, EmptyState, toast/
├── lib/            # http client, ApiError, error messages, token storage, env, paths, copy
├── mocks/          # MSW handlers (auth, todos, dev), mock db, seed data, mailbox
└── styles/         # design tokens (theme.css) and base styles
tests/              # unit, component and integration tests (same layout as src/)
docs/
└── api-contract.md # the API contract shared by the mock and the future backend
```

## Architecture notes

**State (Redux Toolkit).** Redux holds only shared state: the **auth session** (`status`, `user`, `bootstrapError`, `endReason`) and the **todos** (`items`, `status`, `error`, `pendingById`). Form state, dialog state and the active filter stay in components or the URL. Counts and filtered lists are computed with memoized selectors and hooks, never stored.

**One reset for privacy.** A single `sessionEnded` event is fired on logout, on a `401` for the current token, and when another tab logs out. The root reducer then resets **every** slice to its initial state, including slices added later. Answers to requests started before the session ended are ignored, so one user's data can never appear for the next user on the same browser.

**Server-first updates.** Creating, editing, ticking and deleting change the list only after the server confirms. A `404` on edit or delete means the todo is already gone: it is removed from the list and you are told. Changes confirmed while the list is still loading are re-applied when it arrives.

**API client (`src/lib/http.ts`).** One place builds URLs, sends and parses JSON, attaches the `Bearer` token, applies a 15-second timeout, and turns every failure into a typed `ApiError`. A `401` on a request that carried the current token ends the session **once**. Public endpoints (login, signup and so on) send no token, so a wrong password is never mistaken for an expired session. `getErrorMessage` turns any error into one user-facing sentence from `src/lib/messages.ts`.

**Session start-up.** `startSession` runs once at startup. It registers the `401` and cross-tab listeners, then asks `GET /auth/me` who the saved token belongs to. `AppLayout` protects `/todos`: it shows a spinner while checking, a retry screen if the server is unreachable, or redirects to `/login` with a "logged out" or "session expired" message.

**Dates.** Due dates are date-only strings (`YYYY-MM-DD`). They are parsed as local calendar dates, never with `new Date("YYYY-MM-DD")`, which shifts the day in some time zones.

## API contract

The REST contract (endpoints, request and response shapes, error format, validation rules, behaviour) is in **[docs/api-contract.md](docs/api-contract.md)**. The mock implements it today, and the NestJS backend will implement it next. Errors use NestJS's default shape plus a machine-readable `code` (for example `EMAIL_NOT_VERIFIED`).

## Key decisions and trade-offs

The full decision log, with the reasons and when to revisit each decision, is in [section 2 of the project plan](Todo-App-Project-Plan.md#2-decision-log). The most important ones:

- **The access token is stored in `localStorage` (temporary).** This is a temporary choice for the mock phase. Any script on the page can read `localStorage`, so an XSS bug could leak the token. The planned production approach is an **`httpOnly` cookie** issued by the backend. All token access goes through one module (`src/lib/tokenStorage.ts`), so the switch is a one-file change. When moving to cookies, add `SameSite` and CSRF protection. CSRF is not a concern while the token is sent in a `Bearer` header.
- **`createAsyncThunk`** for the session and todos. One-shot auth calls (signup, verify, forgot, reset) call the API directly from their pages.
- **MSW mock backend** that intercepts real network requests, so app code is identical in mock and live mode, and tests use the same handlers.
- **A mock mailbox** instead of real email, so every email flow can be completed locally.
- **Server-first updates** (no optimistic updates). Simpler, and the screen never shows something the server rejected.
- **Filters live in the URL**, not Redux, so refresh, Back and bookmarks keep them.
- **No general route guards yet.** `AppLayout` protects `/todos`. `/login` does not redirect users who are already logged in (see [Known limitations](#known-limitations)).
- **Mock passwords are salted SHA-256** so they never sit in `localStorage` as plain text. A real backend must use bcrypt or argon2.

## Testing

```bash
npm run test:run    # once
npm test            # watch mode
npm run coverage    # with coverage
```

**483 tests** across three levels. They use the real store, the real router and the MSW handlers rather than mocking our own modules:

| Level                   | Examples                                                                                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                    | Schemas and validation rules, date helpers (including time zones), `http` client and errors, `tokenStorage`, auth and todos slices and thunks, selectors, the filter hook, store reset                           |
| Component               | Form fields, Dialog and ConfirmDialog (focus trap, Escape, focus return), toasts, auth forms, TodoForm, TodoItem, TodoList states, filters, edit and delete flows                                                |
| Integration (whole app) | Sign up → verify → log in; forgot → reset password; session restore and expiry; log in → create, edit, tick, delete a todo; **two users on one browser see nothing of each other's data**; logout in another tab |
| Mock contract           | Every auth and todo endpoint: ownership (`404` for another user's todo), validation, ordering, `[fail]` input                                                                                                    |

Test IDs (such as `T-U10` and `T-I05`) and edge-case IDs (such as `EC-58`) in test names match the [project plan](Todo-App-Project-Plan.md).

## Accessibility

Target: **WCAG 2.2 AA**.

- Every flow works with the keyboard alone, with visible focus rings.
- Dialogs use the native `<dialog>`: focus is trapped inside, Escape closes, and focus returns to the control that opened them. If that control was deleted, focus moves to the list.
- Every input has a label. Errors are linked to their field with `aria-describedby`, and the first invalid field gets focus.
- Success and error messages are announced through live regions. Toasts pause while hovered or focused.
- Status uses text **and** colour (for example the "Overdue" badge).
- Semantic HTML (`header`, `main`, `nav`, `ul`, `form`), one `<h1>` per page, and `prefers-reduced-motion` is respected.
- Buttons and button-style links are at least 44 px tall. Inline text links (such as "Forgot password?") follow the size of the surrounding text. A todo's checkbox is smaller, but its whole title is clickable too, because the title is the checkbox's label. Layouts are designed mobile-first, from 320 px.

A full axe or Lighthouse audit and a manual screen-reader pass are still to do (see [Project status](#project-status)).

## Known limitations

- **No pagination.** Lists of a few hundred todos are fine. 1,000 renders correctly but without virtualization (A-06).
- **Last write wins** when the same todo is edited in two tabs (A-07).
- **No refresh token.** When the session expires (2 hours in the mock, 30 seconds for `shortlived@example.com`) you log in again (A-08).
- **Mock only.** There is no real backend or email delivery yet.
- **No general route guards.** `/login` and `/signup` stay reachable while logged in, and after login you always land on `/todos` rather than the page you first requested.
- **Login in another tab** is not followed by a tab that is already showing the login page (EC-28). Logout in another tab is handled.
- English only (A-09).

## Project status

| Area                                                                           | Status                                                          |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Foundation (TypeScript, lint, env, `http` client, UI kit, design tokens)       | Done                                                            |
| Mock API (auth, todos, mailbox, persistence)                                   | Done                                                            |
| Authentication (all flows, session restore, expiry, logout, cross-tab logout)  | Done, except general route guards and safe redirect after login |
| Todos (list, filters, create, edit, toggle, delete, states, toasts, isolation) | Done                                                            |
| Tests                                                                          | 483 passing                                                     |
| Accessibility audit (axe or Lighthouse, 200% zoom, screen reader)              | To do                                                           |
| CI workflow and deployed demo                                                  | To do                                                           |

**Note for contributors:** `npm run format:check` (and therefore `npm run check`) currently also scans the generated code-review records in `.code-reviews/records/`, which are not Prettier-formatted. Until `.code-reviews` is added to `.prettierignore`, run `npx prettier --check src tests docs` to check the code itself.

## Next steps

1. Route guards (`ProtectedRoute` and `PublicOnlyRoute`) and a safe redirect back to the requested page after login.
2. Hardening: an accessibility audit, a keyboard and screen-reader pass, and slow-network checks.
3. A GitHub Actions workflow running `npm run check`, and a deployed mock-mode demo.
4. The **NestJS backend** implementing [docs/api-contract.md](docs/api-contract.md), then switching the token to an `httpOnly` cookie.
5. Task Manager features: collaborators, deadlines and notifications.

## Documents

- [Project plan](Todo-App-Project-Plan.md): requirements, architecture, edge cases, test catalogue and build plan
- [Decision log](Todo-App-Project-Plan.md#2-decision-log): key decisions and trade-offs
- [API contract](docs/api-contract.md): the contract shared by the mock and the backend
