# Todo App with Authentication: Project Plan

| | |
|---|---|
| **Project** | Frontend Practice Task: Authentication + Todo module |
| **Deliverable** | One reviewed pull request, plus a mock-mode demo deployment |
| **Stack** | React, TypeScript (strict), Vite, Redux Toolkit, React Router, React Hook Form, Zod, Tailwind CSS, MSW, Vitest |
| **Status** | Planning complete, ready to build |
| **Plan date** | 13 October 2026 |
| **Estimated effort** | About 9 to 11 working days at a learner's pace (see section 15) |

---

## How to use this document

1. **Work top to bottom.** Sections 1 to 14 explain *what* and *why*. Section 15 is the build plan, with phases 0 to 9.
2. **Each phase has an exit criteria list.** Don't start the next phase until the current one passes.
3. **IDs are stable.** `FR-*` functional requirement, `NFR-*` non-functional requirement, `EC-*` edge case, `T-*` test, `D-*` decision, `R-*` risk. Use them in commit messages, PR descriptions and test names.
4. **Tick the checkboxes** (`- [ ]` becomes `- [x]`) as you go. The checked-off file is a good progress log for your senior.
5. **If something here conflicts with your senior's instruction, your senior wins.** Update this file and the decision log (section 2) so the plan stays truthful.

---

## Table of contents

1. [Overview and problem statement](#1-overview-and-problem-statement)
2. [Decision log](#2-decision-log)
3. [Scope](#3-scope)
4. [Requirements](#4-requirements)
5. [Constraints and assumptions](#5-constraints-and-assumptions)
6. [Tech stack and environment](#6-tech-stack-and-environment)
7. [Architecture](#7-architecture)
8. [API contract](#8-api-contract)
9. [Mock backend design](#9-mock-backend-design)
10. [UX specification](#10-ux-specification)
11. [Edge case catalogue](#11-edge-case-catalogue)
12. [Security checklist](#12-security-checklist)
13. [Testing strategy](#13-testing-strategy)
14. [Git workflow and PR process](#14-git-workflow-and-pr-process)
15. [Step-by-step build plan](#15-step-by-step-build-plan)
16. [Deployment](#16-deployment)
17. [Risk register](#17-risk-register)
18. [Definition of done](#18-definition-of-done)
19. [Appendices](#19-appendices)

---

## 1. Overview and problem statement

### 1.1 Problem statement

> Build a React + TypeScript single-page app where a user can **register, verify their email, log in, and recover a forgotten password**, and then **create, view, edit and delete only their own todos**. The backend does not exist yet, so the app talks to a **mock API that follows the contract the future NestJS backend will implement**. Deliver it as a clean, reviewable pull request before the backend days begin.

### 1.2 Context

- This is a graded practice task. The review rubric rewards: strict TypeScript (no `any`), reusable components and custom hooks, Redux slices, thunks and typed selectors, secure authentication handling, and complete documentation.
- This app is the **base of the final Task Manager** (collaborators, deadlines, notifications). Design for extension, but do not build those features now.
- You will build the real backend next. Every assumption the frontend makes about the API becomes a promise the backend must keep, so the API contract (section 8) is a first-class deliverable.

### 1.3 Goals

- Deliver every requirement in the task, correctly and accessibly.
- Demonstrate professional practice: strict typing, clean architecture, tests, documentation, small readable commits.
- Make the PR **easy to review and easy to run**, including a way to try the email flows without an email server.
- Make switching from the mock to the real backend a **configuration change**, not a rewrite.

### 1.4 Non-goals

- Collaboration, notifications, real email delivery, admin roles, social login, two-factor authentication.
- A real backend, database or deployment of a backend.
- Pixel-perfect design. Clean, accessible and consistent is enough.

### 1.5 Success criteria

| # | Criterion | How it is verified |
|---|---|---|
| S1 | All `Must` requirements pass their acceptance criteria | Section 4 table, manual QA runbook (Appendix D) |
| S2 | `npm run check` passes (lint, types, format, tests, build) with zero warnings | CI and local |
| S3 | No `any` in the codebase; `strict` TypeScript on | Lint rule plus code review |
| S4 | A reviewer can run the app and complete every flow in under 10 minutes using the README | README test accounts and mock mailbox |
| S5 | Another user's data is never visible, including after logout and login as someone else | `T-I05` |
| S6 | Accessibility: keyboard-only usable, no critical axe or Lighthouse issues | Section 13.6 |
| S7 | README, API contract and PR description are complete | Definition of done |

### 1.6 Stakeholders

| Who | Role |
|---|---|
| You | Developer |
| Senior developer | Reviewer, owner of the rubric |
| Your future self | Builds the NestJS backend against the contract in this plan |

---

## 2. Decision log

The senior's answers to the eight open questions were all "go with your own suggestion". Those suggestions, and the decisions derived from them, are recorded here. **Revisit a decision only if its "revisit when" trigger happens.**

| ID | Decision | Rationale | Revisit when |
|---|---|---|---|
| D-01 | **API contract: our own proposal** (section 8), using NestJS's default error shape plus a machine-readable `code` field | Zero rework when the NestJS backend is built | Senior supplies an official contract |
| D-02 | **`createAsyncThunk`** for async Redux logic. No Saga. | Simplest, built into Redux Toolkit, enough for this scope | Senior asks for Saga to be demonstrated |
| D-03 | **Access token in `localStorage`, behind one `tokenStorage` module**, documented as temporary | There is no backend, so `httpOnly` cookies are not possible. An isolated module makes the later migration a one-file change. | Backend exists, then migrate to `httpOnly` cookie |
| D-04 | **Tailwind CSS v4**, with hand-built accessible components | Lean, fast, no UI-kit lock-in | Senior asks for a component library |
| D-05 | **Dev-only mock mailbox** for verification and reset emails | No email server, and the reviewer must be able to finish the flows | Real email is added in the backend phase |
| D-06 | **Todo fields:** `title`, optional `description`, `isCompleted`, optional `dueDate` | Matches the requirement and leaves room for the final task's deadlines | Final task needs time-of-day deadlines |
| D-07 | **Tests: Vitest + React Testing Library + MSW**, a focused set (section 13) | Same toolchain as Vite, tests exercise the real API layer | Senior sets a coverage target |
| D-08 | **One PR**, a feature branch, **Conventional Commits** | Matches the task wording | Senior prefers two PRs (auth, then todos) |
| D-09 | **Redux holds only shared state:** the auth session and the todos. One-shot calls (signup, verify, resend, forgot, reset) call the API directly from their pages. | Redux style guide: do not put everything in Redux | Senior wants every call to be a thunk (small change) |
| D-10 | **React Router v7**, data router (`createBrowserRouter`), layout routes for guards | Current standard, matches the training | None |
| D-11 | **React Hook Form + Zod** for every form | Typed forms, one schema per form, server errors map onto fields | None |
| D-12 | **MSW v2** in the browser for the mock. Enabled only by `VITE_USE_MOCK`. The same handlers run in tests. | Intercepts at the network level, so app code is identical in mock and live mode | None |
| D-13 | **`dueDate` is a date-only string** (`YYYY-MM-DD`) | Avoids time zone shifts for a calendar date | Final task needs a time of day |
| D-14 | **Deploy the mock-mode build** as a static demo, so the reviewer can click a link | Faster review, proves the build works in production mode | Senior says a demo is not wanted |
| D-15 | **npm**, lockfile committed | Default tooling | Team standard is different |
| D-16 | **Access token is opaque to the frontend.** Never decode it to make decisions. | Authorization belongs to the server | None |
| D-17 | **`eslint-plugin-jsx-a11y-x`** (es-tooling fork) instead of `eslint-plugin-jsx-a11y`, on **ESLint 10** | The original plugin's last release (6.10.2, Oct 2024) only supports ESLint up to 9, and ESLint 9 is end-of-life. The fork is a drop-in with the same rules and supports ESLint 10. | The original plugin ships ESLint 10 support |
| D-18 | **Accept the current major versions** installed in Phase 1: TypeScript 6, Vite 8, Vitest 5, **React Router 8** (plan says v7), **MSW 3** (plan says v2), Zod 4 | Fresh project, no reason to start on older majors. The APIs the plan relies on (`createBrowserRouter`, `setupWorker`/`setupServer`, `HttpResponse`) still exist; verify details when Phase 2 and Phase 3 start. | An API used by the plan turns out to be removed |

---

## 3. Scope

### 3.1 MoSCoW

**Must have**
- Signup, email verification, login, forgot password, reset password, logout
- Session restore after refresh, route guards, 401 handling
- Todo create, list, edit, toggle complete, delete (with confirmation)
- Loading, error and empty states everywhere data is fetched
- Mock API with a mock mailbox, README, API contract, the PR

**Should have**
- Filter todos by All, Active, Completed (stored in the URL)
- Resend verification with a cooldown
- Return to the intended page after login (safe redirect)
- Overdue indicator on todos
- Toast and live-region messages
- Cross-tab logout (via the `storage` event)
- Request timeout and clear network error handling
- CI workflow and a demo deployment
- Responsive layout, accessibility audit

**Could have** (only if time remains, never at the cost of polish)
- Search, sort, optimistic updates, dark mode, pagination, Playwright end-to-end test, route-level code splitting

**Will not have (this PR)**
- Collaboration, notifications, real emails, admin features, `httpOnly` cookies (needs the backend)

---

## 4. Requirements

### 4.1 Functional requirements

**Authentication**

| ID | Requirement | Acceptance criteria | Priority |
|---|---|---|---|
| FR-A01 | **Signup** | Fields: name, email, password, confirm password. Client validation (section 8.5). Success shows a "Check your email" panel with the address and a Resend button. A `409` shows "email already registered" under the email field. | Must |
| FR-A02 | **Verify email** | `/verify-email?token=...` calls the API **once**. Distinct states: verifying, verified, already verified, invalid, expired, missing token. Each failure state offers a next step (request a new link). | Must |
| FR-A03 | **Resend verification** | Always shows a generic success message. A 60 second client cooldown. A `429` shows a wait message. | Should |
| FR-A04 | **Login** | Email and password. Wrong credentials give one generic message. An unverified account (`403`, code `EMAIL_NOT_VERIFIED`) shows a message with a Resend action and stores **no** token. Success stores the token, loads the user, and goes to the intended page or `/todos`. | Must |
| FR-A05 | **Session restore** | On app start with a stored token, `GET /auth/me` decides the session. While it runs the status is `unknown` and a splash screen shows. An invalid token is cleared. A network or server failure shows a retry screen and does **not** log the user out. | Must |
| FR-A06 | **Logout** | Calls `POST /auth/logout` (best effort), always clears the token and **all** Redux state, then goes to `/login`. | Must |
| FR-A07 | **Forgot password** | Email only. Always shows the same message, whether or not the email exists. A 60 second cooldown. | Must |
| FR-A08 | **Reset password** | `/reset-password?token=...`. New password plus confirmation. Success goes to `/login` with a success message. Invalid, expired and used tokens show a clear message and a link to request a new one. | Must |
| FR-A09 | **Route protection** | Protected routes redirect unauthenticated users to `/login` (remembering the destination). Public-only routes (`/login`, `/signup`, `/forgot-password`) redirect authenticated users to `/todos`. No flash of the wrong page while the status is `unknown`. | Must |
| FR-A10 | **Expired session** | A `401` on a request that carried a token ends the session **once**, shows "Your session expired. Please log in again.", and redirects to `/login`. A `401` from `/auth/login` is a wrong password, not an expired session. | Must |

**Todos**

| ID | Requirement | Acceptance criteria | Priority |
|---|---|---|---|
| FR-T01 | **List my todos** | Fetched after the session is authenticated. States: loading, error with Retry, empty (first-time) and filtered-empty. Newest first. | Must |
| FR-T02 | **Create** | Title required (1 to 100 characters, trimmed). Optional description (up to 500) and due date. The form clears on success. A failure keeps the user's input. | Must |
| FR-T03 | **Edit** | Edit title, description and due date in a dialog, reusing the create form. | Must |
| FR-T04 | **Toggle complete** | A checkbox. The control is disabled while its request is pending. | Must |
| FR-T05 | **Delete** | A confirmation dialog first. A `404` (already deleted) removes the item with an informative message. | Must |
| FR-T06 | **Filter** | All, Active, Completed, stored in `?status=`. An invalid value falls back to All. | Should |
| FR-T07 | **Ownership isolation** | The client never sends a user id. After logout or session end, the todos state is empty. Another user's todo ID gives a "not found" view. | Must |
| FR-T08 | **Overdue indicator** | An incomplete todo with a due date before today shows an "Overdue" badge. | Should |
| FR-T09 | **Per-item feedback** | While an item is being changed, its controls are disabled. A failed change shows an accessible message and leaves the item unchanged. | Must |

**Cross-cutting**

| ID | Requirement | Acceptance criteria | Priority |
|---|---|---|---|
| FR-X01 | **404 page** | Unknown routes show a friendly page with a link home | Must |
| FR-X02 | **Error boundary** | A render crash shows a fallback with a reload button, not a blank screen | Must |
| FR-X03 | **Messages** | Success and error messages are announced to screen readers | Should |
| FR-X04 | **Mock / live switch** | `VITE_USE_MOCK` and `VITE_API_URL` decide the backend. No code change needed. | Must |
| FR-X05 | **Mock mailbox** | In mock mode, `/dev/mailbox` lists sent emails with clickable links | Must |

### 4.2 Non-functional requirements

| ID | Area | Requirement |
|---|---|---|
| NFR-S1 | Security | No secrets in the repo. Tokens and passwords are never logged. See section 12. |
| NFR-S2 | Security | Generic messages for login, forgot password and resend. No account enumeration. |
| NFR-S3 | Security | Redirects after login only go to internal paths. |
| NFR-A1 | Accessibility | Target WCAG 2.2 AA. Everything works with the keyboard alone. Visible focus. Labels on every input. Errors linked to fields with `aria-describedby`. |
| NFR-A2 | Accessibility | Semantic HTML (`main`, `nav`, `form`, `button`, `ul`). One `<h1>` per page. Respect `prefers-reduced-motion`. |
| NFR-P1 | Performance | No unnecessary re-renders from selectors. Lighthouse performance 90 or higher on the demo build (a target, not a gate). |
| NFR-M1 | Maintainability | `strict` TypeScript. No `any`. Zero ESLint warnings. Components are small (roughly under 200 lines). Logic lives in hooks, slices and helpers. |
| NFR-M2 | Maintainability | All user-facing text is kept in one place (a `messages.ts`), ready for later translation. |
| NFR-R1 | Reliability | No unhandled promise rejections. A clean browser console in normal use. |
| NFR-C1 | Compatibility | Latest two versions of Chrome, Firefox, Safari and Edge. Works from 320 px wide. |
| NFR-D1 | Documentation | README, `docs/api-contract.md`, PR description. |

---

## 5. Constraints and assumptions

### 5.1 Constraints

| # | Constraint |
|---|---|
| C-01 | **No backend exists.** All data comes from the mock (MSW). |
| C-02 | **No email server.** Emails are simulated by the mock mailbox. |
| C-03 | Must use the training stack: React, TypeScript, Redux Toolkit, React Router, React Hook Form, and Zod or Yup. |
| C-04 | Node.js **20.19+ or 22.12+** (current Vite requirement). Check with `node -v`. |
| C-05 | One PR, submitted **before the backend days**. Confirm the deadline with your senior. |
| C-06 | `httpOnly` cookies cannot be tested in the mock phase (a service worker cannot set real `httpOnly` cookies), so the mock uses a bearer token. |
| C-07 | The mock database lives in the browser. It is per-browser and is not shared between users or devices. |

### 5.2 Assumptions (record any change in the README)

| # | Assumption |
|---|---|
| A-01 | The password rule is: 8 to 64 characters, at least one letter and one number, spaces allowed. (64 because bcrypt only uses the first 72 bytes. The backend will enforce the same rule.) |
| A-02 | Emails are compared case-insensitively and trimmed. |
| A-03 | A user must verify their email before logging in. |
| A-04 | Duplicate todo titles are allowed. |
| A-05 | A due date in the past is allowed on creation. |
| A-06 | The list is small enough (up to a few hundred todos) for no pagination. |
| A-07 | Last write wins when the same todo is edited in two tabs. This is a documented limitation. |
| A-08 | Access tokens expire. The mock uses 15 minutes, and 30 seconds for the `shortlived` test account. There is no refresh token in this PR. |
| A-09 | A single-language UI (English). |

---

## 6. Tech stack and environment

### 6.1 Stack

| Concern | Choice | Notes |
|---|---|---|
| Build tool | **Vite** + React + TypeScript template | Pick plain "TypeScript" (not the React Compiler variant). Confirm the installed versions with `npm ls`. |
| UI library | **React** (latest 19.x) | Function components and hooks only |
| Language | **TypeScript**, `strict` | Plus `noUncheckedIndexedAccess` (recommended) |
| State | **Redux Toolkit** + **React Redux** | `createAsyncThunk`, typed hooks, selectors in their own files |
| Routing | **React Router v7** | Import from `react-router`, `RouterProvider` from `react-router/dom` |
| Forms | **React Hook Form** + `@hookform/resolvers` | `zodResolver` |
| Validation | **Zod** | Current Zod uses `z.email()` and `{ error: "..." }`. Older tutorials show `z.string().email()` and `{ message: "..." }`. |
| Styling | **Tailwind CSS v4** | `@tailwindcss/vite` plugin, `@import "tailwindcss";`. No `tailwind.config.js` or PostCSS config needed. |
| Mock API | **MSW v2** | `msw/browser` in the app, `msw/node` in tests |
| Tests | **Vitest**, **React Testing Library**, `user-event`, `jest-dom`, `jsdom` | Coverage via `@vitest/coverage-v8` |
| Lint and format | **ESLint** (`typescript-eslint`, `react-hooks`, `jsx-a11y`) and **Prettier** | `prettier-plugin-tailwindcss` is optional (sorts class names) |
| CI | **GitHub Actions** | Section 16 |

### 6.2 Machine prerequisites

- Node.js 20.19+ or 22.12+ (`node -v`), npm (`npm -v`), Git
- Editor: VS Code with ESLint, Prettier and Tailwind CSS IntelliSense extensions
- Browser: Chrome or Edge with the **Redux DevTools** extension, plus Firefox for cross-browser checks

### 6.3 Install commands

```bash
npm create vite@latest todo-app -- --template react-ts   # answer prompts: no React Compiler, decline experimental options
cd todo-app
npm install

# runtime
npm install @reduxjs/toolkit react-redux react-router react-hook-form zod @hookform/resolvers
npm install tailwindcss @tailwindcss/vite

# development
npm install -D msw vitest jsdom @vitest/coverage-v8 \
  @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom \
  eslint-plugin-jsx-a11y prettier eslint-config-prettier @types/node
```

### 6.4 Environment variables

| Variable | Dev (mock) | Demo build | Live later | Meaning |
|---|---|---|---|---|
| `VITE_API_URL` | `/api` | `/api` | `http://localhost:3000` (NestJS default) | API base URL. In mock mode, MSW intercepts it. |
| `VITE_USE_MOCK` | `true` | `true` | `false` | Starts the MSW worker before rendering |

- Commit `.env.example` and `.env.demo` (they contain no secrets). **Never commit `.env` or `.env.local`.**
- Anything with the `VITE_` prefix is **shipped to the browser**. Never put a secret in it.
- Validate the variables at startup with a Zod schema (`src/lib/env.ts`) so a missing value fails fast with a clear message.

### 6.5 npm scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "build:demo": "tsc -b && vite build --mode demo",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc -b",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage",
    "check": "npm run lint && npm run typecheck && npm run format:check && npm run test:run && npm run build"
  }
}
```

`npm run check` is the **quality gate**. Run it before every push.

### 6.6 Configuration highlights

**`tsconfig.app.json`** (inside `compilerOptions`, keep the template's existing flags):

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "paths": { "@/*": ["./src/*"] },
  "types": ["vite/client", "vitest/globals"]
}
```

**`vite.config.ts`** (Vite, Tailwind, the `@/` alias and Vitest in one file):

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
  },
});
```

If TypeScript or Vitest complains about a version mismatch with your Vite version, update `vitest` and `@vitejs/plugin-react` to their latest versions.

---

## 7. Architecture

### 7.1 Folder structure (feature-based)

```
src/
├── app/
│   ├── store.ts                 # store + root reducer with reset-on-session-end
│   ├── hooks.ts                 # useAppDispatch, useAppSelector
│   ├── createAppAsyncThunk.ts   # pre-typed thunk creator
│   ├── actions.ts               # sessionEnded (shared event)
│   ├── router.tsx               # route tree
│   └── Providers.tsx            # StrictMode, Redux Provider, Toast provider
├── pages/                       # thin route-level screens
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── VerifyEmailPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── ResetPasswordPage.tsx
│   ├── TodosPage.tsx
│   ├── NotFoundPage.tsx
│   └── DevMailboxPage.tsx       # only routed in mock mode
├── features/
│   ├── auth/
│   │   ├── authApi.ts
│   │   ├── authSlice.ts
│   │   ├── authThunks.ts        # bootstrapSession, login, logout
│   │   ├── authSelectors.ts
│   │   ├── authSchemas.ts       # Zod schemas + inferred types
│   │   ├── tokenStorage.ts
│   │   ├── safeRedirect.ts
│   │   ├── types.ts
│   │   ├── components/          # LoginForm, SignupForm, ForgotForm, ResetForm,
│   │   │                        # CheckEmailPanel, ProtectedRoute, PublicOnlyRoute
│   │   ├── hooks/               # useResendCooldown, useAuthRedirect
│   │   └── index.ts
│   └── todos/
│       ├── todosApi.ts
│       ├── todosSlice.ts
│       ├── todosThunks.ts       # fetchTodos, createTodo, updateTodo, deleteTodo
│       ├── todosSelectors.ts
│       ├── todoSchemas.ts
│       ├── types.ts
│       ├── dates.ts             # parseDateOnly, isOverdue, formatDate
│       ├── components/          # TodoList, TodoItem, TodoForm, TodoFilters, EditTodoDialog
│       ├── hooks/               # useFilteredTodos
│       └── index.ts
├── components/                  # shared UI (no business logic)
│   ├── Button.tsx, TextField.tsx, PasswordField.tsx, TextArea.tsx
│   ├── Alert.tsx, Spinner.tsx, EmptyState.tsx, SplashScreen.tsx
│   ├── ConfirmDialog.tsx, Dialog.tsx
│   └── toast/                   # ToastProvider, useToast
├── hooks/                       # shared hooks (e.g. useDocumentTitle)
├── lib/
│   ├── http.ts                  # fetch wrapper
│   ├── ApiError.ts
│   ├── env.ts                   # Zod-validated env
│   ├── messages.ts              # all user-facing copy
│   └── paths.ts                 # route path constants
├── mocks/
│   ├── browser.ts               # setupWorker
│   ├── server.ts                # setupServer (tests)
│   ├── handlers/                # authHandlers.ts, todosHandlers.ts
│   ├── db.ts                    # in-memory db persisted to localStorage
│   ├── mailbox.ts
│   └── fixtures.ts              # seeded demo data
├── test/
│   ├── setup.ts
│   └── renderWithProviders.tsx
├── main.tsx
└── index.css                    # @import "tailwindcss";
public/
└── mockServiceWorker.js         # generated by `npx msw init public`
docs/
└── api-contract.md
```

### 7.2 Dependency rules

```
app/  ->  pages/  ->  features/  ->  components/, hooks/, lib/
```

- Imports only go **downward**. `lib/` and `components/` never import from `features/`.
- **Features never import each other's internals.** If two features need the same thing, move it down to a shared folder (or `app/` for shared Redux events).
- The accepted Redux exception: features import `useAppSelector`, `useAppDispatch`, `createAppAsyncThunk` and `sessionEnded` from `app/`, and use `import type { RootState }`.
- The store imports slice files directly (not through `index.ts`), so it does not pull in every component.
- Use `import type` for types. Use `@/` imports instead of long relative paths.

### 7.3 Route map

| Path | Access | Page | Notes |
|---|---|---|---|
| `/` | n/a | Redirect to `/todos` | |
| `/login` | Public only | LoginPage | Shows a success message passed through navigation state |
| `/signup` | Public only | SignupPage | Swaps to a "Check your email" panel after success |
| `/forgot-password` | Public only | ForgotPasswordPage | |
| `/verify-email?token=` | Anyone | VerifyEmailPage | Works while logged in or out |
| `/reset-password?token=` | Anyone | ResetPasswordPage | |
| `/todos` | **Protected** | TodosPage | `?status=` (all, active or completed) |
| `/dev/mailbox` | Anyone, **mock mode only** | DevMailboxPage | Not registered in the router unless `VITE_USE_MOCK` |
| `*` | n/a | NotFoundPage | |

Layouts: `AuthLayout` (centered card) for auth pages, `AppLayout` (header with user and Logout, `<main>`) for protected pages. Both render an `<Outlet />`. Add `errorElement` at the layout level.

### 7.4 Redux state design

**Auth slice**

| Field | Type | Meaning |
|---|---|---|
| `status` | `"unknown" \| "authenticated" \| "unauthenticated"` | Session state. Starts `unknown`. |
| `user` | `User \| null` | The logged-in user |
| `bootstrapError` | `string \| null` | Set when startup could not reach the server (shows the retry screen) |

Thunks: `bootstrapSession`, `login`, `logout`. Selectors: `selectAuthStatus`, `selectUser`, `selectIsAuthenticated`.

**Todos slice**

| Field | Type | Meaning |
|---|---|---|
| `items` | `Todo[]` | The user's todos |
| `status` | `"idle" \| "loading" \| "success" \| "error"` | List loading state |
| `error` | `string \| null` | List error message |
| `pendingById` | `Record<string, "updating" \| "deleting">` | Which items have a request in flight |

Thunks: `fetchTodos` (with a `condition` that skips the call if already loading), `createTodo`, `updateTodo`, `deleteTodo`. Selectors: `selectTodoItems`, `selectTodosStatus`, `selectTodosError`, `selectPendingById`, `selectTodoCounts`. Filtering by `?status=` lives in the `useFilteredTodos` hook (`useMemo`), because the filter belongs to the URL, not Redux.

**Reset on session end**

- `sessionEnded` is a plain action defined in `app/actions.ts` and **modelled as an event** ("the session ended"), not a setter.
- The root reducer is wrapped: when it sees `sessionEnded`, it calls the real reducer with `undefined` state. Every slice, including future ones, resets to its initial state. `RootState` is derived from the unwrapped reducer.
- Fired on: logout, a `401` on a token-carrying request, and a cross-tab logout.

**Rules**
- Pessimistic updates: wait for the server before changing the list (simple and safe).
- Keep the store serializable: ISO date strings and plain objects only.
- Do not store derived data (counts, filtered lists). Compute it with selectors or hooks.
- Form state and dialog open/close state stay in the components.

### 7.5 API client (`lib/http.ts`)

Responsibilities, in one place:

1. Build the URL from `VITE_API_URL`.
2. Send and parse JSON.
3. Attach `Authorization: Bearer <token>` when a token exists (read from `tokenStorage`).
4. Apply a request timeout (15 seconds, using an `AbortSignal`).
5. Convert every failure into a typed `ApiError { status, message, code?, details? }`:
   - non-2xx response, using the NestJS-style body (`message` may be a string or an array)
   - network failure or timeout, with `status: 0`
6. **Unauthorized handler:** call a registered callback on a `401` **only if the request carried a token** and **only once at a time**. The store registers this callback at startup (`setUnauthorizedHandler`), so `lib/` never imports from `app/`.
7. Never log request bodies, passwords or tokens.

Error-to-message mapping lives in one function (`getErrorMessage`), using the copy in `lib/messages.ts` (Appendix A).

### 7.6 `tokenStorage` module

| Function | Behavior |
|---|---|
| `get()` | Reads the token. Never throws. Returns `null` if storage is blocked. |
| `set(token)` | Saves the token. If `localStorage` is unavailable, falls back to in-memory and the session lasts until refresh. |
| `clear()` | Removes the token |
| `subscribe(listener)` | Listens for the `storage` event to sync login and logout across tabs. Returns an unsubscribe function. |

- Key name: `todo-app.accessToken`.
- Nothing else in the app touches `localStorage` for the token.
- **README must say:** "Token in `localStorage` is a temporary choice for the mock phase. It is readable by any script on the page, so an XSS bug could leak it. The planned production approach is an `httpOnly` cookie issued by the backend."

### 7.7 Session bootstrap sequence

1. `main.tsx` starts the mock worker first (mock mode), then renders the app.
2. The app dispatches `bootstrapSession`.
3. No token: status becomes `unauthenticated`.
4. Token present: call `GET /auth/me`.
   - `200`: status `authenticated`, store the user.
   - `401`: clear the token, status `unauthenticated`.
   - Network error or `5xx`: status stays `unknown`, set `bootstrapError`, show the retry screen.
5. Guards render `SplashScreen` while status is `unknown`.
6. `tokenStorage.subscribe` is registered once, so other tabs' login and logout events are handled.

### 7.8 Route guard behavior

| Status | `ProtectedRoute` | `PublicOnlyRoute` |
|---|---|---|
| `unknown` (loading) | Splash screen | Splash screen |
| `unknown` + `bootstrapError` | Retry screen | Retry screen |
| `unauthenticated` | Redirect to `/login`, with the current location in state | Show the page |
| `authenticated` | Show the page (`<Outlet />`) | Redirect to `/todos` |

After login, the destination is `state.from` if `safeRedirect()` accepts it (it must start with a single `/`, must not start with `//`, and must not be an auth page). Otherwise `/todos`.

### 7.9 Forms and validation

One Zod schema per form in `authSchemas.ts` and `todoSchemas.ts`. The password rule is defined **once** and reused. Each form uses React Hook Form with `zodResolver`, `defaultValues`, `noValidate` on the `<form>`, and `setError` for server errors.

Rules (client and mock server must agree):

| Field | Rule |
|---|---|
| `name` | Trimmed, 2 to 50 characters |
| `email` | Trimmed, lowercased, valid email, up to 254 characters |
| `password` | 8 to 64 characters, at least one letter and one number, **not trimmed** |
| `confirmPassword` | Must equal `password` (error shown on this field) |
| `title` | Trimmed, 1 to 100 characters |
| `description` | Optional, up to 500 characters |
| `dueDate` | Optional, `YYYY-MM-DD` |

### 7.10 Shared component inventory

| Component | Notes |
|---|---|
| `Button` | Variants (primary, secondary, danger), `loading` prop (disables and shows a spinner, sets `aria-busy`), defaults to `type="button"` |
| `TextField`, `TextArea` | Label, hint, error. `aria-invalid` and `aria-describedby`. Forwards the ref so it works with `register`. |
| `PasswordField` | Show/hide toggle (a real button with an accessible name) |
| `Alert` | Variants: error (`role="alert"`), success and info (`role="status"`) |
| `Spinner`, `SplashScreen`, `EmptyState` | Loading and empty views |
| `Dialog`, `ConfirmDialog` | Built on the native `<dialog>` and `showModal()`: focus trap, Esc to close, focus returns to the trigger |
| `ToastProvider` / `useToast` | Local React context (UI state, not Redux). An ARIA live region. Auto-dismiss after about 5 seconds. |

---

## 8. API contract

This is the contract the mock **and** the future NestJS backend implement. Keep a copy in `docs/api-contract.md`.

### 8.1 Conventions

- Base URL: `${VITE_API_URL}` (for example `/api` in mock mode).
- JSON in and out. Dates are ISO strings. `dueDate` is `YYYY-MM-DD`.
- Authenticated endpoints need `Authorization: Bearer <accessToken>`.
- The frontend **never** sends a user id.

### 8.2 Error format (the NestJS default, plus an optional `code`)

```json
{ "statusCode": 400, "message": ["email must be an email"], "error": "Bad Request" }
```

```json
{ "statusCode": 403, "message": "Email not verified", "error": "Forbidden", "code": "EMAIL_NOT_VERIFIED" }
```

`message` can be a string or a string array (validation). **The frontend branches on `code` and `statusCode`, never on message text.**

| `code` | Status | Meaning |
|---|---|---|
| `EMAIL_ALREADY_REGISTERED` | 409 | Signup with an existing email |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `EMAIL_NOT_VERIFIED` | 403 | Login before verifying |
| `TOKEN_INVALID` | 400 | Verification or reset token is malformed or unknown |
| `TOKEN_EXPIRED` | 400 | Token past its expiry |
| `EMAIL_ALREADY_VERIFIED` | 409 | Verifying an already verified account |
| `RATE_LIMITED` | 429 | Too many attempts (with a `Retry-After` header in seconds) |

### 8.3 Models

```ts
User { id: string; name: string; email: string; isEmailVerified: boolean }

Todo {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  dueDate: string | null      // "YYYY-MM-DD"
  createdAt: string           // ISO
  updatedAt: string           // ISO
}
```

### 8.4 Endpoints

**Authentication**

| Method and path | Request body | Success | Errors |
|---|---|---|---|
| `POST /auth/signup` | `{ name, email, password }` | `201` `{ message }` | `400` validation, `409 EMAIL_ALREADY_REGISTERED` |
| `POST /auth/verify-email` | `{ token }` | `200` `{ message }` | `400 TOKEN_INVALID` or `TOKEN_EXPIRED`, `409 EMAIL_ALREADY_VERIFIED` |
| `POST /auth/resend-verification` | `{ email }` | `200` `{ message }` (always generic) | `429 RATE_LIMITED` |
| `POST /auth/login` | `{ email, password }` | `200` `{ accessToken, user }` | `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED`, `429` |
| `GET /auth/me` | none | `200` `User` | `401` |
| `POST /auth/logout` | none | `204` | `401` (ignored by the client) |
| `POST /auth/forgot-password` | `{ email }` | `200` `{ message }` (always generic) | `429` |
| `POST /auth/reset-password` | `{ token, password }` | `200` `{ message }` | `400 TOKEN_INVALID` or `TOKEN_EXPIRED`, `400` validation |

**Todos** (all require authentication, all scoped to the token's user)

| Method and path | Request body | Success | Errors |
|---|---|---|---|
| `GET /todos` | none | `200` `Todo[]`, newest first | `401` |
| `POST /todos` | `{ title, description?, dueDate? }` | `201` `Todo` | `400`, `401` |
| `GET /todos/:id` | none | `200` `Todo` | `401`, `404` (**also** for another user's todo) |
| `PATCH /todos/:id` | any of `{ title, description, dueDate, isCompleted }` | `200` `Todo` | `400`, `401`, `404` |
| `DELETE /todos/:id` | none | `204` | `401`, `404` |

### 8.5 Behavior rules

- A user's todos are **only ever visible to that user.** Another user's id returns `404`, not `403`, so existence is not revealed.
- Forgot-password and resend-verification return `200` for **any** email.
- Verification and reset tokens are **single-use**. Verification tokens last 24 hours, reset tokens 1 hour.
- Email comparison is case-insensitive.
- The access token is **opaque** to the frontend.

### 8.6 Mapping to the NestJS backend (Day 5 handoff)

| Contract piece | NestJS implementation |
|---|---|
| Request bodies and validation rules | DTOs with `class-validator`, matching the Zod schemas |
| Error shape | Default exception filter output, plus a custom exception adding `code` |
| `Bearer` token | JWT with Passport, and `JwtAuthGuard` on `/auth/me`, `/auth/logout` and `/todos/*` |
| Ownership | Read the user id from the token, query by `userId`, return `404` when nothing matches |
| Documentation | Swagger (`@nestjs/swagger`), verified against this contract |

---

## 9. Mock backend design

### 9.1 Principles

- Handlers implement **exactly** the contract in section 8, including every error case.
- The mock enforces the same validation rules as the client. Do not trust the client in the mock either, because the point is to rehearse the real backend.
- It must feel real: latency, failures, expiring tokens, single-use tokens.

### 9.2 Structure

| File | Purpose |
|---|---|
| `mocks/db.ts` | In-memory users, todos, tokens and mailbox, saved to `localStorage` key `todo-app.mock-db`. Exposes `resetMockDb()`. |
| `mocks/handlers/authHandlers.ts` | All `/auth/*` handlers |
| `mocks/handlers/todosHandlers.ts` | All `/todos/*` handlers |
| `mocks/mailbox.ts` | Stores sent "emails": `{ id, to, subject, link, sentAt }` |
| `mocks/browser.ts` | `setupWorker(...handlers)` |
| `mocks/server.ts` | `setupServer(...handlers)` for Vitest |
| `public/mockServiceWorker.js` | Generated with `npx msw init public` and committed |

### 9.3 Enabling the mock

Start the worker **before** rendering, and only when `VITE_USE_MOCK` is `true`, using a dynamic import so mock code is not part of a real production bundle:

```ts
// main.tsx (the important part)
async function start() {
  if (env.VITE_USE_MOCK) {
    const { worker } = await import("@/mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  createRoot(document.getElementById("root")!).render(/* <Providers>...</Providers> */);
}
void start();
```

### 9.4 Mock behavior

| Behavior | Detail |
|---|---|
| Latency | Random 300 to 800 ms per request, so loading states are visible |
| Tokens | Opaque string tied to a user and an expiry. Accepted until it expires. Not a real JWT. |
| Email tokens | Random, single-use. 24 hours for verification, 1 hour for reset. |
| Rate limiting | More than 5 login attempts in one minute for an email returns `429` with `Retry-After`. Resend and forgot allow 1 request per 30 seconds per email. |
| Ownership | Todos are filtered by the user from the token. Another user's id returns `404`. |
| Persistence | Survives refresh. The mailbox page has a **Reset mock data** button. |

### 9.5 Magic test accounts (document these in the README)

| Email | Password | Behavior |
|---|---|---|
| `demo@example.com` | `Passw0rd!` | Verified, seeded with 5 todos |
| `unverified@example.com` | `Passw0rd!` | Login returns `403 EMAIL_NOT_VERIFIED` |
| `shortlived@example.com` | `Passw0rd!` | Verified, token expires in 30 seconds (tests expiry handling) |
| `locked@example.com` | any | Login always returns `429` |
| `slow@example.com` | `Passw0rd!` | Verified, every request takes 3 seconds |
| any new email | a valid password | Signup works, then verify through the mailbox |

**Magic todo input:** a title containing `[fail]` makes create and update return `500`, so you can see error handling.

### 9.6 Mock mailbox

- Signup, resend, and forgot-password add an entry to the mailbox instead of sending email. Each entry has a clickable link (`/verify-email?token=...` or `/reset-password?token=...`).
- `/dev/mailbox` lists entries, newest first. It exists **only** in mock mode.
- The reviewer's flow becomes: sign up, open `/dev/mailbox`, click the link, done.

### 9.7 Reuse in tests

Tests use the **same handlers** through `setupServer`. Reset the db and `localStorage` in `afterEach`. Override a single endpoint inside a test with `server.use(...)` to simulate failures.

---

## 10. UX specification

General rules for every page: one `<h1>`; labels on all inputs; errors linked with `aria-describedby`; a submit button that disables and shows a spinner while pending; the first invalid field receives focus after a failed submit; copy comes from `lib/messages.ts` (Appendix A).

### 10.1 Pages

**Signup** (`/signup`)
- Fields: name, email, password (with show/hide), confirm password. Link to Login.
- States: idle, submitting, field errors, `409` email error, **"Check your email" panel** (shows the address, a Resend button with a 60 s cooldown, a link to Login).

**Verify email** (`/verify-email`)
- Calls the API once on load. States: verifying (spinner), verified (button to Login), already verified (link to Login), expired or invalid (explains and offers "Send me a new link" with an email field), missing token (invalid link).

**Login** (`/login`)
- Fields: email, password (show/hide). Links to Signup and Forgot password.
- Shows a success message coming from navigation state (for example "Password updated. Please log in.").
- Errors: generic wrong-credentials alert, unverified alert with a Resend button, rate-limit alert, network alert.

**Forgot password** (`/forgot-password`)
- Field: email. After submit, always the same confirmation message. Resend cooldown 60 s.

**Reset password** (`/reset-password`)
- Fields: new password, confirm. States: form, invalid or expired token (explains, links to Forgot password), success (redirects to Login with a message).

**Todos** (`/todos`, protected)
- Header: app name, the user's name, **Log out**.
- Add form: title, optional description, optional due date, Add button.
- Filters: All, Active, Completed (with counts).
- List: each item shows a checkbox, title, description (truncated), due date, an **Overdue** badge, Edit and Delete buttons.
- States: loading (skeleton or spinner), error with Retry, empty (first-time call to action), filtered-empty (clear filter link).
- Edit opens a dialog with the same form. Delete opens a confirmation dialog that names the todo.

**Not found** and **Error fallback**: a message and a link home (or a reload button).

**Dev mailbox** (`/dev/mailbox`, mock mode only): a table of sent emails with links, and a **Reset mock data** button. Shows a banner saying "Development only".

### 10.2 Responsive and visual

- Mobile first, from 320 px. Content width is capped on large screens.
- A consistent spacing scale, one primary colour, and clearly visible focus rings.
- Touch targets of at least 44 px for buttons and checkboxes.
- Respect `prefers-reduced-motion`. Use colour **and** text for status (for example "Overdue", not only red).

### 10.3 Keyboard and screen reader

- Tab order follows visual order. Dialogs trap focus and return focus to the control that opened them. Escape closes dialogs.
- Success and error messages are announced through live regions.
- Icon-only buttons have an accessible name (`aria-label`).

---

## 11. Edge case catalogue

Each row should be handled and, where a test is listed, covered by it. Section 13 defines the test IDs.

### 11.1 Authentication and forms

| ID | Scenario | Expected behavior | Test |
|---|---|---|---|
| EC-01 | Double click on submit | One request. The button is disabled while pending. | T-C03, T-C05 |
| EC-02 | Email with spaces or capitals | Trimmed and lowercased before sending and comparing | T-U01 |
| EC-03 | Password with leading or trailing spaces | Kept as typed. Never trimmed. | T-U01 |
| EC-04 | Password and confirmation differ | Error on the confirm field | T-U01, T-C03 |
| EC-05 | Very long inputs (email over 254, name over 50, password over 64) | Validation error. Layout does not break. | T-U01 |
| EC-06 | Password manager autofill | Correct `autocomplete` values (`email`, `current-password`, `new-password`, `name`) | Manual M-02 |
| EC-07 | Signup with an existing email (`409`) | Error under the email field | T-C03 |
| EC-08 | Wrong password or unknown email | The same generic message for both | T-C05 |
| EC-09 | Login on an unverified account (`403 EMAIL_NOT_VERIFIED`) | Message plus Resend. No token stored. | T-C05 |
| EC-10 | Login rate-limited (`429`) | Message with the wait time | T-C05 |
| EC-11 | Resend clicked repeatedly | 60 s cooldown. A `429` is handled. | T-C04 |
| EC-12 | Verify link without a token | "Invalid link" state | T-C06 |
| EC-13 | Verify token expired, invalid, or already used | Distinct state for each, with a next step | T-C06 |
| EC-14 | Verify page effect runs twice (Strict Mode) | Only **one** API call. The token is single-use. | T-C06 |
| EC-15 | Verify link opened while logged in as someone else | Verification works. The current session is unchanged. | T-C06 |
| EC-16 | Forgot password for an unknown email | The same success message as for a known email | T-C07 |
| EC-17 | Reset token invalid, expired, or already used | Clear message and a link to request a new one | T-C08 |
| EC-18 | Reset succeeds | Redirect to Login with a success message | T-C08, T-I06 |
| EC-19 | Open redirect (`from` is `//evil.com` or an absolute URL) | Ignored. Goes to `/todos`. | T-U03 |
| EC-20 | Visiting `/login` while authenticated | Redirect to `/todos` | T-C09 |
| EC-21 | Visiting `/todos` while logged out | Redirect to `/login`, then back to `/todos` after login | T-C09, T-I01 |
| EC-22 | Refresh on `/todos` while logged in | Splash screen, then the page. **No flash of the login page.** | T-I03 |
| EC-23 | Stored token is invalid or expired at startup | Cleared. User is unauthenticated. | T-U08 |
| EC-24 | Server unreachable at startup | Retry screen. The user is **not** logged out. | T-U08 |
| EC-25 | Token expires mid-session | The first `401` ends the session once, shows one message, redirects. Parallel `401`s do not repeat it. | T-I04, T-U06 |
| EC-26 | `401` from `POST /auth/login` | Treated as wrong credentials, **not** as an expired session | T-U06 |
| EC-27 | Logout in tab A | Tab B logs out through the `storage` event | T-I07 |
| EC-28 | Login in tab A while tab B shows Login | Tab B redirects to `/todos` | T-I07 |
| EC-29 | Back button after logout | Protected content is not shown (state is cleared) | T-C09 |
| EC-30 | Logout request fails | Local session is still cleared | T-U08 |
| EC-31 | `localStorage` blocked or full | `tokenStorage` falls back to memory. The app still works. | T-U07 |
| EC-32 | Offline or network failure | Friendly message and a way to retry | T-U06 |
| EC-33 | Slow responses (3 s or more) | Loading indicators, no layout jump, no duplicate requests | Manual M-04 |
| EC-34 | Request timeout (15 s) | Treated as a network error | T-U06 |

### 11.2 Todos

| ID | Scenario | Expected behavior | Test |
|---|---|---|---|
| EC-40 | Empty or whitespace-only title | Validation error | T-U02, T-C10 |
| EC-41 | Title over 100 or description over 500 characters | Validation error (a character counter is helpful) | T-U02 |
| EC-42 | Duplicate titles | Allowed | n/a |
| EC-43 | Due date in the past | Allowed. If incomplete, shows **Overdue**. | T-U04, T-C11 |
| EC-44 | Date-only parsing across time zones | Parse `YYYY-MM-DD` manually. **Do not** use `new Date("YYYY-MM-DD")`, which is read as UTC and can shift the day. | T-U04 |
| EC-45 | Title contains `<script>` or HTML | Shown as plain text. Never use `dangerouslySetInnerHTML`. | T-C11 |
| EC-46 | A very long single word | Wraps or truncates. No horizontal overflow. | Manual M-03 |
| EC-47 | Emoji, accents, right-to-left text | Displayed correctly | Manual M-03 |
| EC-48 | Toggle fails (`500`) | The item stays unchanged. An error message is shown. | T-C11, T-U10 |
| EC-49 | Delete returns `404` (already deleted) | Item is removed from the list with an informative message | T-U10 |
| EC-50 | Update returns `404` | Item is removed and the user is told | T-U10 |
| EC-51 | Edit dialog open while the todo was deleted elsewhere | Submit handles the `404` gracefully | T-C10 |
| EC-52 | Create while offline | Error message. The form keeps the user's input. | T-C10 |
| EC-53 | Rapid toggling of the same item | Controls disabled while pending, so extra clicks are ignored | T-C11 |
| EC-54 | `?status=foo` | Falls back to All | T-U12 |
| EC-55 | A filter has no matches | "No todos match this filter" with a clear-filter link | T-C12 |
| EC-56 | A brand-new user with zero todos | Friendly empty state with a call to action | T-C12 |
| EC-57 | A very large list (1000 items) | Renders. Stable `key`s. No virtualization (documented). | Manual M-04 |
| EC-58 | User A logs out, user B logs in on the same browser | No trace of A's todos | T-I05 |
| EC-59 | Same todo edited in two tabs | Last write wins (documented limitation A-07) | n/a |
| EC-60 | Strict Mode runs the fetch effect twice | `condition` prevents a duplicate request | T-U10 |
| EC-61 | Direct URL to another user's todo | "Not found" view | T-I05 |

### 11.3 Cross-cutting

| ID | Scenario | Expected behavior | Test |
|---|---|---|---|
| EC-70 | Unknown route | 404 page with a link home | T-C13 |
| EC-71 | A component throws while rendering | Error boundary fallback with a reload button | T-C13 |
| EC-72 | Mobile keyboards | Correct input types (`email`) and `inputMode` | Manual M-02 |
| EC-73 | 320 px width and 200% zoom | No horizontal scrolling | Manual M-03 |
| EC-74 | `prefers-reduced-motion` | Animations are reduced | Manual M-03 |
| EC-75 | Mock code in a real production build | The mock is not started and not bundled unless the mode enables it | Manual M-05 |
| EC-76 | Missing or invalid environment variable | The app fails fast with a clear message | T-U05 |
| EC-77 | Reviewer in a different time zone | Date-only fields behave the same | T-U04 |

---

## 12. Security checklist

| ID | Item | Where checked |
|---|---|---|
| S-01 | Token handled **only** by `tokenStorage`. The `localStorage` trade-off is documented in the README. | Review |
| S-02 | No tokens, passwords or personal data in the console, error messages or logs | Review, `grep` for `console.` |
| S-03 | No `dangerouslySetInnerHTML`. User text is rendered as text. | Lint, review |
| S-04 | Generic messages for login, forgot password and resend (no account enumeration) | T-C05, T-C07 |
| S-05 | Post-login redirects accept internal paths only | T-U03 |
| S-06 | Tokens from email links are read into memory and not logged. No third-party scripts on the token pages. | Review |
| S-07 | `type="password"` fields, correct `autocomplete`, no prefill | Manual M-02 |
| S-08 | Client validation is for UX. The backend validates again (NestJS DTOs). | Handoff note |
| S-09 | CSRF is not a concern with a `Bearer` header. It **becomes** one when moving to cookies, so plan `SameSite` and CSRF protection then. | README |
| S-10 | `.env` and `.env.local` are not committed. No secrets in `VITE_` variables. | `git status`, review |
| S-11 | `npm audit` reviewed. Lockfile committed. No unnecessary dependencies. | Phase 7 |
| S-12 | All client state is cleared on logout and on a `401` | T-U09, T-I05 |
| S-13 | The client does not decode the access token to make authorization decisions | Review, D-16 |
| S-14 | When live: CORS allows only the frontend origin. Do not combine `*` with credentials. | Backend phase |
| S-15 | Rate limiting is a backend job. The client handles `429` politely. | T-C05 |

---

## 13. Testing strategy

### 13.1 Principles

- **Test behavior, not implementation.** Query the way a user would: by role, label and visible text. Avoid test IDs unless there is no accessible alternative.
- **Use the real stack where cheap:** real Redux store, real router, MSW for the network. Avoid mocking `fetch`, `axios` or your own modules.
- **Fail on unhandled requests** (`onUnhandledRequest: "error"`), so a missing handler is noticed immediately.
- **Each test is independent.** Reset the mock db, `localStorage` and handlers after every test.
- **Cover the edge cases that matter** (section 11), not every line.
- **No snapshot tests** for UI.

### 13.2 Test setup

- `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/mocks/server";
import { resetMockDb } from "@/mocks/db";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetMockDb();
  localStorage.clear();
});
afterAll(() => server.close());

// jsdom may not implement <dialog>; stub it if needed
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};
```

- **Store factory:** export `makeStore(preloadedState?)` from `app/store.ts` (and `export const store = makeStore()`), and derive `AppStore`, `RootState` and `AppDispatch` from it. Tests create a **fresh store per test**.
- `src/test/renderWithProviders.tsx`: renders a component inside a fresh store, a memory router (with a chosen initial URL) and the toast provider, and returns the store plus a `userEvent` instance. Optionally wrap in `StrictMode` (needed for `T-C06`).
- Use `vi.useFakeTimers()` for cooldown timers, and `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.

### 13.3 Test catalogue

**Unit tests** (fast, no UI)

| ID | What |
|---|---|
| T-U01 | Auth schemas: password rule, confirm mismatch, name and email rules, trimming and lowercasing (EC-02 to EC-05) |
| T-U02 | Todo schema: title, description and due date limits |
| T-U03 | `safeRedirect`: accepts `/todos`, rejects `//evil.com`, `https://x.com`, `/login` |
| T-U04 | Date helpers: parse date-only without time zone shift, `isOverdue`, formatting |
| T-U05 | `getErrorMessage` and `ApiError` mapping; env validation |
| T-U06 | `http` client: attaches token, maps errors, network failure, timeout, `401` handler only when a token was sent, not for `/auth/login`, only once at a time |
| T-U07 | `tokenStorage`: set, get, clear, blocked storage fallback, `storage` event subscription |
| T-U08 | Auth slice and thunks: bootstrap (success, `401`, network error), login, logout (even if the request fails) |
| T-U09 | Root reducer resets every slice on `sessionEnded` |
| T-U10 | Todos slice and thunks: fetch (and the `condition`), create, update, delete, `404` handling, `pendingById` |
| T-U11 | Selectors (counts, items) |
| T-U12 | `useFilteredTodos`: each filter, invalid `?status=` |

**Component tests** (React Testing Library + MSW)

| ID | What |
|---|---|
| T-C01 | `TextField` and `PasswordField`: label, error association, show/hide toggle |
| T-C02 | `Dialog` and `ConfirmDialog`: open, cancel, confirm, Escape, focus return |
| T-C03 | `SignupForm`: validation messages, `409` field error, success panel, disabled while pending |
| T-C04 | `CheckEmailPanel`: resend, cooldown (fake timers), `429` |
| T-C05 | `LoginForm`: validation, generic `401`, `403` resend action, `429`, success redirect |
| T-C06 | `VerifyEmailPage`: every state, and **one** call inside `StrictMode` |
| T-C07 | `ForgotPasswordPage`: the same message for known and unknown emails |
| T-C08 | `ResetPasswordPage`: invalid token, mismatch, success redirect |
| T-C09 | `ProtectedRoute` and `PublicOnlyRoute`: splash, redirect with `from`, allow, redirect away |
| T-C10 | `TodoForm` and `EditTodoDialog`: validation, submit, keeps input on failure |
| T-C11 | `TodoItem`: toggle, edit, delete confirm, overdue badge, text escaping, disabled while pending |
| T-C12 | `TodoList`: loading, error and retry, empty, filtered-empty |
| T-C13 | 404 page and error boundary |

**Integration tests** (whole app, real store and router, MSW)

| ID | What |
|---|---|
| T-I01 | Sign up, read the link from the mock mailbox, verify, log in, land on `/todos` |
| T-I02 | Log in, create, edit, toggle and delete a todo |
| T-I03 | Session restore after a reload (token in storage), with no login flash |
| T-I04 | Token expiry mid-session: one message, one redirect |
| T-I05 | Two users on one browser: no leakage after logout and login |
| T-I06 | Forgot password, read the link from the mailbox, reset, log in with the new password |
| T-I07 | Cross-tab logout and login (dispatch a `storage` event) |

**End-to-end (optional)**

| ID | What |
|---|---|
| T-E01 | Playwright: the happy path against the demo build |

### 13.4 Quality gates

| Gate | Target |
|---|---|
| ESLint | Zero errors and zero warnings (`--max-warnings 0`) |
| TypeScript | Zero errors, no `any` |
| Prettier | `format:check` passes |
| Tests | All pass. No skipped or `.only` tests. |
| Coverage (`npm run coverage`) | A target, not a gate: about 80% on `features/**` logic and schemas. Do not chase coverage on trivial UI. |
| Build | `npm run build` and `npm run build:demo` both succeed |
| Console | No warnings or errors in a normal session (also in Strict Mode) |

### 13.5 Manual QA

Run the full runbook in **Appendix D** before the PR: happy paths, error paths, refresh and back-button checks, two-user check, throttled network, offline, and keyboard-only. Cross-browser: Chrome, Firefox, plus Safari or Edge if available.

### 13.6 Accessibility testing

1. Complete every flow with the keyboard only.
2. Run the axe DevTools extension or Lighthouse on each page. Fix every critical or serious issue.
3. Check labels, error announcements and dialog focus handling with a screen reader (VoiceOver or NVDA), at least once.
4. Check colour contrast and the 200% zoom case.
5. Optional: add `jest-axe` or `vitest-axe` to the component tests for the main forms.

### 13.7 Performance check

- Run Lighthouse on `npm run preview` of the demo build. Target 90 or higher for performance and accessibility.
- Use the React DevTools Profiler to confirm a todo toggle does not re-render the whole page.

---

## 14. Git workflow and PR process

### 14.1 Branching

- Create `feature/todo-auth-frontend` from the main branch.
- Push early and often. Open a **draft PR** after Phase 2 so progress is visible.

### 14.2 Commit rules (Conventional Commits)

Format: `type(scope): imperative summary` (about 72 characters or fewer).

| Type | Use for |
|---|---|
| `feat` | New behavior |
| `fix` | A bug fix |
| `test` | Adding or changing tests |
| `docs` | README, contract, comments |
| `refactor` | Restructuring without changing behavior |
| `style` | Formatting only |
| `build` / `chore` / `ci` | Tooling, dependencies, CI |

- One logical change per commit. The build and tests should pass at every commit.
- Examples: `feat(auth): add signup form with check-email panel`, `fix(todos): ignore double toggle while pending`.
- Do not commit: `.env`, `node_modules`, `dist`, coverage output, editor files.

### 14.3 Planned commit sequence

1. `chore: scaffold Vite React TypeScript project`
2. `chore: configure strict TypeScript, ESLint, Prettier and scripts`
3. `build: add Tailwind CSS and base styles`
4. `build: add Vitest, Testing Library and test setup`
5. `feat(lib): add env validation, ApiError and http client`
6. `feat(app): add Redux store, typed hooks and session reset`
7. `feat(ui): add shared form and feedback components`
8. `feat(ui): add dialog, confirm dialog and toast provider`
9. `feat(app): add router, layouts and error boundary`
10. `feat(mocks): add MSW worker, mock db and mailbox`
11. `feat(mocks): add auth and todos handlers`
12. `feat(auth): add schemas, api, token storage and session slice`
13. `feat(auth): add signup flow`
14. `feat(auth): add email verification page`
15. `feat(auth): add login flow and safe redirect`
16. `feat(auth): add session bootstrap, route guards and logout`
17. `feat(auth): add forgot and reset password flows`
18. `feat(auth): handle expired sessions and cross-tab logout`
19. `feat(todos): add types, api, slice, thunks and selectors`
20. `feat(todos): add todos page with list and filters`
21. `feat(todos): add create, edit, toggle and delete`
22. `test: add unit tests for schemas, client and slices`
23. `test: add component tests for auth and todos`
24. `test: add integration flow tests`
25. `fix(a11y): address audit findings`
26. `ci: add GitHub Actions workflow`
27. `docs: add README and API contract`
28. `build: add demo mode and deployment config`

Write the tests for each feature **in the same phase as the feature**. The test commits above group them for readability. Fixup commits can be squashed before review.

### 14.4 Pull request

- Title: `feat: todo app with authentication (mock API)`.
- Use the template in **Appendix C**: summary, screenshots or GIFs, how to test (test accounts), decisions and trade-offs, out of scope, checklist, and the demo link.
- **Self-review your own diff** on GitHub, line by line, before requesting review.
- Keep the PR focused. If the diff is very large, ask your senior whether to split into auth and todos PRs.

### 14.5 During review

- Respond to every comment (fix it, or explain why not). Mark threads resolved only after the fix is pushed.
- Add follow-up commits rather than force-pushing, unless your senior asks for a clean history. Squash on merge if they prefer.
- Re-run `npm run check` after every round of changes.

---

## 15. Step-by-step build plan

### Overview

| Phase | Goal | Estimate |
|---|---|---|
| 0 | Kickoff and documentation | 0.5 day |
| 1 | Scaffold and tooling | 0.5 day |
| 2 | Foundation: lib, store, router, UI kit | 1 to 1.5 days |
| 3 | Mock backend | 1 day |
| 4 | Authentication feature | 2 to 2.5 days |
| 5 | Todos feature | 1.5 to 2 days |
| 6 | Hardening and accessibility | 0.5 to 1 day |
| 7 | Test completion and manual QA | 1 day |
| 8 | Documentation, CI and deployment | 1 day |
| 9 | Pull request and review | 0.5 day, plus review turnaround |
| | **Total** | **about 9 to 11 working days** |

The estimates assume a learner's pace. If your deadline is tighter, trim items from "Should have" and "Could have" (section 3), never the quality pass or the tests for authentication and ownership.

**For every phase:** write the tests for what you build in that phase, commit in small steps, and run `npm run check` before pushing.

---

### Phase 0: Kickoff and documentation (0.5 day)

**Goal:** everyone agrees on what is being built.

- [ ] Send this plan, or a summary of sections 2 to 4, to your senior. Confirm the deadline and whether one PR is acceptable.
- [ ] Create the GitHub repository. Add a short README placeholder. (README done, local git repo created; GitHub remote still to add)
- [x] Create the feature branch `feature/todo-auth-frontend`.
- [x] Create `docs/api-contract.md` from section 8 of this plan.
- [x] Copy the decision log (section 2) into the README, or link to it.

**Exit criteria:** the contract file exists, and your senior has seen the plan.

---

### Phase 1: Scaffold and tooling (0.5 day)

**Goal:** an empty app that builds, lints, type-checks and tests cleanly.

- [x] Check `node -v` (20.19+ or 22.12+). Install a newer Node if needed.
- [x] Scaffold with Vite (section 6.3). Choose plain TypeScript, not the React Compiler variant.
- [x] Run `npm install`, then `npm run dev`, and confirm the starter page opens.
- [x] Set up `.gitignore` (add `.env` and `.env.local`). Make the first commit.
- [x] Install runtime and development dependencies (section 6.3).
- [x] Configure TypeScript (section 6.6): strict flags, the `@/` alias, `vitest/globals` types.
- [x] Configure `vite.config.ts` with React, Tailwind and Vitest (section 6.6).
- [x] Add `@import "tailwindcss";` to `src/index.css` and confirm a Tailwind class works.
- [x] Add `eslint-plugin-jsx-a11y` to the ESLint config. Add Prettier, `eslint-config-prettier`, and a `.prettierrc`.
- [x] Add the npm scripts from section 6.5.
- [x] Create `.env.example` and `.env.demo`, and the Zod env validation module `src/lib/env.ts`.
- [x] Create `src/test/setup.ts` (section 13.2) with a single trivial test, to confirm Vitest runs.
- [x] Create the empty folder skeleton (section 7.1).
- [x] Delete the Vite starter content (logo, counter demo, `App.css`).

**Commits:** items 1 to 4 from section 14.3.

**Exit criteria:** `npm run check` passes on the empty app.

**Watch out for:** a Node version warning from Vite; a mismatched `vitest` and `vite` version; forgetting `@types/node` (needed for the alias config).

---

### Phase 2: Foundation (1 to 1.5 days)

**Goal:** everything the features will stand on.

**2.1 Library layer**
- [ ] `lib/ApiError.ts`: a typed error class with `status`, `message`, `code?`, `details?`.
- [ ] `lib/http.ts`: base URL, JSON handling, token header, timeout, error conversion, the `401` unauthorized handler (section 7.5).
- [ ] `lib/messages.ts`: all user-facing copy (Appendix A).
- [ ] `lib/paths.ts`: route path constants.
- [ ] `getErrorMessage` helper.
- [ ] **Tests:** T-U05, T-U06.

**2.2 Store**
- [ ] `app/actions.ts` with `sessionEnded`.
- [ ] `app/store.ts`: a `makeStore()` factory, the root reducer with reset-on-`sessionEnded`, and `RootState`, `AppDispatch`, `AppStore` types.
- [ ] `app/hooks.ts`: `useAppDispatch` and `useAppSelector` with `.withTypes`.
- [ ] `app/createAppAsyncThunk.ts` with `withTypes` (`state`, `dispatch`, `rejectValue: string`).
- [ ] Register the unauthorized handler from the store setup.
- [ ] **Tests:** T-U09.

**2.3 Router and layouts**
- [ ] `app/router.tsx` with all routes from section 7.3. Pages can be placeholders.
- [ ] `AuthLayout` and `AppLayout`, each with an `<Outlet />` and an `errorElement`.
- [ ] Stub `ProtectedRoute` and `PublicOnlyRoute`.
- [ ] `NotFoundPage` and an error boundary fallback.
- [ ] `app/Providers.tsx`: `StrictMode`, the Redux `Provider`, the toast provider.

**2.4 Shared UI kit** (section 7.10)
- [ ] `Button`, `TextField`, `TextArea`, `PasswordField`.
- [ ] `Alert`, `Spinner`, `SplashScreen`, `EmptyState`.
- [ ] `Dialog`, `ConfirmDialog`, `ToastProvider` and `useToast`.
- [ ] **Tests:** T-C01, T-C02.

**Commits:** items 5 to 9 from section 14.3. Open a **draft PR** at the end of this phase.

**Exit criteria:** you can navigate between placeholder pages, the UI kit renders correctly on a scratch page, and `npm run check` passes.

**Watch out for:** circular imports between `store.ts` and the slices (use `import type` for `RootState`); components that contain business logic; missing `forwardRef`-style ref support on inputs (needed for React Hook Form's `register`).

---

### Phase 3: Mock backend (1 day)

**Goal:** a believable backend that follows the contract exactly.

- [ ] Run `npx msw init public` and commit `public/mockServiceWorker.js`.
- [ ] `mocks/db.ts`: users, todos, tokens, mailbox, persistence to `localStorage`, `resetMockDb()`.
- [ ] Seed `demo@example.com` with five todos, and the other magic accounts (section 9.5).
- [ ] `mocks/mailbox.ts` and the `DevMailboxPage` (mock mode only).
- [ ] `mocks/handlers/authHandlers.ts`: all eight auth endpoints, every error from the contract, the NestJS-style error body with `code`, latency, rate limiting, single-use tokens, token expiry.
- [ ] `mocks/handlers/todosHandlers.ts`: all five todo endpoints, ownership by token, the `[fail]` magic title.
- [ ] Validate request bodies in the mock using the same rules as the client.
- [ ] `mocks/browser.ts` and `mocks/server.ts`.
- [ ] Gate the worker in `main.tsx` with a dynamic import behind `VITE_USE_MOCK` (section 9.3). Only register the `/dev/mailbox` route in mock mode.
- [ ] Update `docs/api-contract.md` if you changed anything.

**Commits:** items 10 and 11 from section 14.3.

**Exit criteria:** with `npm run dev`, every endpoint returns its documented success and error shapes in the browser's Network tab. You can complete a signup and see the email in `/dev/mailbox`.

**Watch out for:** forgetting that service worker scope needs `mockServiceWorker.js` at the site root; unhandled-request noise (use `bypass` in the browser and `error` in tests); making the mock more lenient than the real backend will be.

---

### Phase 4: Authentication feature (2 to 2.5 days)

**Goal:** all authentication flows, complete and secure. Build in this order, because each step depends on the last.

**4.1 Foundations**
- [ ] `authSchemas.ts`: login, signup, forgot, reset (the password rule defined once). **Tests:** T-U01.
- [ ] `types.ts`, `authApi.ts`, `tokenStorage.ts` (**Tests:** T-U07), `safeRedirect.ts` (**Tests:** T-U03).
- [ ] `authSlice.ts`, `authThunks.ts` (`bootstrapSession`, `login`, `logout`), `authSelectors.ts`. **Tests:** T-U08.

**4.2 Signup** (FR-A01, FR-A03)
- [ ] `SignupForm` with React Hook Form and `zodResolver`. A `409` becomes a field error.
- [ ] `CheckEmailPanel` with Resend and the cooldown hook `useResendCooldown`.
- [ ] **Tests:** T-C03, T-C04.

**4.3 Verify email** (FR-A02)
- [ ] `VerifyEmailPage` with all states. **Guard against the Strict Mode double call** (a ref flag), because the token is single-use.
- [ ] A "send me a new link" form for expired or invalid tokens.
- [ ] **Tests:** T-C06.

**4.4 Login** (FR-A04)
- [ ] `LoginForm`: generic error for `401`, resend action for `403 EMAIL_NOT_VERIFIED`, message for `429`.
- [ ] Redirect to the intended page through `safeRedirect`.
- [ ] Show the success message from navigation state.
- [ ] **Tests:** T-C05.

**4.5 Session, guards and logout** (FR-A05, FR-A06, FR-A09)
- [ ] Dispatch `bootstrapSession` at startup. Build `SplashScreen` and the bootstrap retry screen.
- [ ] Implement `ProtectedRoute` and `PublicOnlyRoute` (section 7.8). Check `AppLayout` shows the user and a **Log out** button.
- [ ] `logout` thunk: best-effort API call, always clear the token, dispatch `sessionEnded`, navigate to `/login`.
- [ ] **Tests:** T-C09, T-I03.

**4.6 Forgot and reset password** (FR-A07, FR-A08)
- [ ] `ForgotPasswordPage` with the always-generic message and a cooldown.
- [ ] `ResetPasswordPage` with token states. Success redirects to Login with a message.
- [ ] **Tests:** T-C07, T-C08, T-I06.

**4.7 Session expiry and cross-tab sync** (FR-A10)
- [ ] The unauthorized handler dispatches `sessionEnded` once, with a single message.
- [ ] `tokenStorage.subscribe` handles other tabs' login and logout.
- [ ] **Tests:** T-I04, T-I07, T-I01.

**Commits:** items 12 to 18 from section 14.3.

**Exit criteria:** every FR-A01 to FR-A10 acceptance criterion passes. All EC-01 to EC-34 items you can test are handled. `shortlived@example.com` logs out cleanly after 30 seconds.

**Best practices for every auth form**
- React Hook Form plus Zod, `noValidate`, `defaultValues`.
- Disable the submit button while pending. Show server errors on the right field with `setError`.
- Use `autoComplete`: `email`, `current-password`, `new-password`, `name`.
- Use generic messages where the contract says "always generic".
- Never log credentials or tokens. Never trim passwords.

**Watch out for:** treating a login `401` as an expired session; a flash of the login page on refresh; redirect loops between the guards; leaving the verify call without a Strict Mode guard.

---

### Phase 5: Todos feature (1.5 to 2 days)

**Goal:** a complete, polished todo module.

**5.1 Data layer**
- [ ] `types.ts`, `todoSchemas.ts`, `dates.ts` (**Tests:** T-U02, T-U04).
- [ ] `todosApi.ts`, `todosThunks.ts` with `condition` on `fetchTodos`, `todosSlice.ts` with `pendingById`, `todosSelectors.ts`. **Tests:** T-U10, T-U11.
- [ ] `useFilteredTodos` hook. **Tests:** T-U12.

**5.2 Page and list**
- [ ] `TodosPage`: header, add form, filters, list.
- [ ] `TodoFilters` (writes `?status=`), `TodoList` with loading, error, empty and filtered-empty states. **Tests:** T-C12.
- [ ] Fetch only when the session is `authenticated`.

**5.3 Create, edit, toggle, delete**
- [ ] `TodoForm` (create) and `EditTodoDialog` (edit) sharing one form. **Tests:** T-C10.
- [ ] `TodoItem`: checkbox toggle, edit button, delete button, overdue badge, controls disabled while pending. **Tests:** T-C11.
- [ ] `ConfirmDialog` for delete that names the todo.
- [ ] Toasts for success and for failures. Treat `404` on update or delete as "already gone".

**5.4 Isolation**
- [ ] Confirm todos reset on logout and on `401`. **Tests:** T-I05, T-I02.

**Commits:** items 19 to 21 from section 14.3.

**Exit criteria:** FR-T01 to FR-T09 pass. Two users, one after the other in the same browser, never see each other's todos.

**Watch out for:** deriving data in the store instead of in selectors; `key={index}`; a selector that builds a new array on every call; `new Date("YYYY-MM-DD")` time zone shifts; components growing past roughly 200 lines.

---

### Phase 6: Hardening and accessibility (0.5 to 1 day)

**Goal:** close the gaps between "works" and "ready for review".

- [ ] Walk through the edge case catalogue (section 11) row by row. Fix or document each one.
- [ ] Run the app in **Strict Mode** and check the console. No double side effects, no warnings.
- [ ] Keyboard-only pass through every flow. Check dialog focus handling.
- [ ] Run axe or Lighthouse on every page. Fix critical and serious issues.
- [ ] Check 320 px width, 200% zoom, and `prefers-reduced-motion`.
- [ ] Remove every `console.log`, commented-out code, unused file, unused export and unused dependency.
- [ ] Search for `any`, `as` and `@ts-ignore`. Justify or remove each one.
- [ ] Check that components are small and logic lives in hooks, slices and helpers.
- [ ] Run `npm audit` and review the result.

**Commits:** `fix(a11y): ...` and `refactor: ...` as needed.

**Exit criteria:** the security checklist (section 12) is fully ticked.

---

### Phase 7: Test completion and manual QA (1 day)

**Goal:** the test suite protects the behaviors that matter.

- [ ] Fill any gaps against the catalogue in section 13.3 (T-U, T-C, T-I).
- [ ] Run `npm run coverage` and look at the uncovered lines in `features/**`. Test what matters.
- [ ] Optional: add the Playwright happy-path test (T-E01).
- [ ] Run the full manual QA runbook (**Appendix D**), in Chrome and Firefox, plus Safari or Edge if possible.
- [ ] Check the throttled network and offline scenarios.
- [ ] Verify the production build: `npm run build`, `npm run preview`. Confirm the mock is **not** started or bundled (EC-75).

**Commits:** items 22 to 24 from section 14.3.

**Exit criteria:** all tests pass with no skipped tests, and the manual runbook is complete.

---

### Phase 8: Documentation, CI and deployment (1 day)

**Goal:** make the project easy to understand, check and try.

- [ ] Write the **README** (outline in Appendix B), with screenshots.
- [ ] Finalise `docs/api-contract.md`.
- [ ] Add the GitHub Actions workflow (section 16.2). Confirm it passes.
- [ ] Add the demo mode: `.env.demo`, the `build:demo` script, and the SPA fallback file for your host (section 16.3).
- [ ] Deploy the demo (section 16.4) and run the smoke test (section 16.5).
- [ ] Put the demo URL in the README and the PR description.

**Commits:** items 26 to 28 from section 14.3.

**Exit criteria:** CI is green, the demo is live, and a stranger could follow the README to run the project.

---

### Phase 9: Pull request and review (0.5 day)

**Goal:** a PR that is easy to approve.

- [ ] Rebase or squash fixup commits so the history reads clearly.
- [ ] Run `npm run check` one last time, and `npm run build:demo`.
- [ ] Open the PR using the template in **Appendix C**. Add screenshots or GIFs of each flow.
- [ ] **Self-review the diff** line by line on GitHub. Leave comments on anything non-obvious.
- [ ] Walk through the Definition of Done (section 18).
- [ ] Request review. Respond to every comment. Re-run `npm run check` after each round.

**Exit criteria:** the PR is approved.

---

## 16. Deployment

The task requires a PR, not a deployment. A **demo deployment of the mock-mode build** is recommended, because it lets your reviewer click a link instead of installing anything. It also proves the production build works.

### 16.1 Build modes

| Command | Mode | Mock | Use |
|---|---|---|---|
| `npm run dev` | development | on (`.env`) | Daily work |
| `npm run build` | production | **off** | The real build. Used when a backend exists. |
| `npm run build:demo` | `demo` | **on** (`.env.demo`) | Static demo for reviewers |

`.env.demo` contains only `VITE_API_URL=/api` and `VITE_USE_MOCK=true` (no secrets), so it is safe to commit.

### 16.2 CI workflow (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run format:check
      - run: npm run test:run
      - run: npm run build
```

Check for newer major versions of the actions when you create the file. Node 22 satisfies the Vite requirement.

### 16.3 Single-page app fallback (so refreshing `/todos` works)

A client-side router needs the host to serve `index.html` for every path. Add the file that matches your host:

| Host | File | Content |
|---|---|---|
| Netlify | `public/_redirects` | `/*    /index.html   200` |
| Vercel | `vercel.json` | `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` |
| Cloudflare Pages | none | Single-page apps work by default if there is no `404.html` |

### 16.4 Deploying the demo

1. Create a free account on Netlify, Vercel or Cloudflare Pages and import the GitHub repository.
2. Build command: `npm run build:demo`. Output directory: `dist`.
3. Set the Node version to 22 in the host settings.
4. Enable **deploy previews** for pull requests, so the PR gets its own demo link.
5. Put the URL in the README and the PR description.

Note for reviewers: the demo's data is stored in **their own browser**, so it is private to them and resets when they clear site data.

### 16.5 Smoke test after deploying

- [ ] The home page redirects to `/login`.
- [ ] Refreshing `/login` and `/todos` does not give a 404.
- [ ] Log in as `demo@example.com`, and see the five seeded todos.
- [ ] Sign up a new user, open `/dev/mailbox`, verify, and log in.
- [ ] Create, edit, complete and delete a todo.
- [ ] The browser console is clean.

### 16.6 Moving to the real backend later (Day 5 handoff)

1. Set `VITE_USE_MOCK=false` and `VITE_API_URL` to the NestJS address.
2. Enable **CORS** on the backend for the frontend origin only.
3. Compare real responses against `docs/api-contract.md`. In development, validating responses with Zod catches drift early.
4. Move the token from `localStorage` to an `httpOnly` cookie. This changes `tokenStorage` and the `http` client (`credentials: "include"`) and adds CSRF protection (S-09).
5. Keep the MSW handlers. They are still valuable for tests.
6. Replace `docs/api-contract.md` with the generated Swagger documentation, once it matches.

---

## 17. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Scope creep (search, dark mode, optimistic updates) | High | High | Stick to section 3. Add extras only after the quality pass. |
| R-02 | Authentication edge cases take longer than expected | High | Medium | Build flows in the order of Phase 4. Use the edge case catalogue as a checklist. |
| R-03 | The mock drifts from the future real API | Medium | High | One contract document, NestJS-style errors, validate in the mock |
| R-04 | Strict Mode double effects cause subtle bugs (especially verify) | Medium | Medium | Guard single-use calls. Test inside `StrictMode` (T-C06). |
| R-05 | The reviewer objects to `localStorage` for the token | Medium | Medium | Document it as temporary (D-03), keep it isolated, state the cookie migration plan |
| R-06 | The PR is too large to review | Medium | Medium | Logical commits, a clear PR description, offer to split |
| R-07 | Accessibility is left to the end | Medium | Medium | Build accessible primitives in Phase 2. Audit in Phase 6. |
| R-08 | jsdom does not support `<dialog>` fully | Medium | Low | Stub `showModal` and `close` in the test setup |
| R-09 | Tooling version mismatches (Vite, Vitest, plugins) | Medium | Low | Install latest compatible versions. Read warnings at install time. |
| R-10 | The deadline is shorter than the estimate | Medium | High | Trim "Should" and "Could" items. Keep the quality pass. |
| R-11 | Requirements are interpreted differently by the senior | Low | High | Share this plan early. Record every answer in the decision log. |
| R-12 | The mock accidentally ships in a production build | Low | Medium | Dynamic import behind the env flag, and check the build (EC-75) |

---

## 18. Definition of done

**Functionality**
- [ ] All `Must` requirements pass their acceptance criteria (section 4).
- [ ] The edge case catalogue (section 11) has been handled or documented.
- [ ] The manual QA runbook (Appendix D) is complete.

**Code quality**
- [ ] `strict` TypeScript. No `any`. No unjustified `as` or `@ts-ignore`.
- [ ] `npm run check` passes with zero warnings.
- [ ] No `console.log`, dead code, unused dependencies or commented-out code.
- [ ] Components are small. Logic lives in hooks, slices and helpers.
- [ ] Selectors are typed, in their own files, and memoized where needed.

**Security**
- [ ] The security checklist (section 12) is fully ticked.
- [ ] No secrets or `.env` files committed.

**Testing**
- [ ] The test catalogue is implemented (section 13.3). All tests pass. No skipped tests.
- [ ] Accessibility audit done with no critical issues.

**Documentation and delivery**
- [ ] README, `docs/api-contract.md` and the decision log are complete.
- [ ] CI is green. The demo is deployed and smoke-tested.
- [ ] Commit history is clean, using Conventional Commits.
- [ ] The PR description is complete (screenshots, test accounts, decisions, out of scope).
- [ ] You reviewed your own diff before requesting review.

---

## 19. Appendices

### Appendix A: Message copy deck (`lib/messages.ts`)

| Situation | Message |
|---|---|
| Wrong email or password | "Email or password is incorrect." |
| Email not verified | "Please verify your email before logging in." |
| Rate limited | "Too many attempts. Please try again in a minute." |
| Email already registered | "This email is already registered." |
| Check your email (signup) | "We sent a verification link to {email}. It may take a minute to arrive." |
| Resend sent | "If an account exists for that address, we sent a new link." |
| Verified | "Your email is verified. You can log in now." |
| Already verified | "This email is already verified." |
| Link invalid | "This link is not valid. Please request a new one." |
| Link expired | "This link has expired. Please request a new one." |
| Forgot password sent | "If an account exists for {email}, we sent a reset link." |
| Password updated | "Password updated. Please log in." |
| Session expired | "Your session expired. Please log in again." |
| Network error | "Can't reach the server. Check your connection and try again." |
| Server error | "Something went wrong on our side. Please try again." |
| Timeout | "The request took too long. Please try again." |
| Todo created | "Todo added." |
| Todo updated | "Todo updated." |
| Todo deleted | "Todo deleted." |
| Todo already gone | "That todo no longer exists." |
| Todo save failed | "Could not save your changes. Please try again." |
| No todos yet | "You have no todos yet. Add your first one above." |
| No matches | "No todos match this filter." |

### Appendix B: README outline

1. Title, one-line description, screenshots, **demo link**
2. Features
3. Tech stack
4. Prerequisites (Node version)
5. Getting started: install, run, build, test, the `check` script
6. Environment variables (table) and mock vs live mode
7. **Test accounts and magic inputs** (section 9.5), and how to use `/dev/mailbox`
8. Project structure (section 7.1) and architecture notes (state design, API client, guards)
9. API contract (link to `docs/api-contract.md`)
10. Key decisions and trade-offs (link to the decision log), including **why the token is in `localStorage` and the plan to move to an `httpOnly` cookie**
11. Testing: how to run, what is covered
12. Accessibility notes
13. Known limitations (A-06, A-07, no refresh token, mock only)
14. Next steps (the NestJS backend, collaboration, deadlines, notifications)

### Appendix C: Pull request template

```markdown
## Summary
What this PR delivers, in 3 to 5 lines.

## Demo
Link to the deployed demo (mock mode). Screenshots or GIFs of: signup and verification, login,
forgot and reset password, todo CRUD, error states.

## How to test
1. Open the demo (or run `npm install && npm run dev`).
2. Log in with `demo@example.com` / `Passw0rd!`.
3. Sign up with a new email, then open `/dev/mailbox` to verify.
4. Other test accounts: see README, section "Test accounts".

## Decisions and trade-offs
- Token in localStorage (temporary, isolated in `tokenStorage`). Plan: httpOnly cookie with the backend.
- createAsyncThunk for the session and todos. One-shot auth calls go straight to the API.
- MSW mock following a NestJS-style contract (docs/api-contract.md).

## Out of scope
Collaboration, notifications, real emails, httpOnly cookies, refresh tokens.

## Checklist
- [ ] `npm run check` passes
- [ ] No `any`, no console output, no dead code
- [ ] Tests added for new behavior
- [ ] README and API contract updated
- [ ] Accessibility checked (keyboard and axe)
- [ ] Self-reviewed the diff
```

### Appendix D: Manual QA runbook

Run in Chrome and Firefox (and Safari or Edge if possible). Tick each item.

**M-01: Happy paths**
- [ ] Sign up a new user, then verify through `/dev/mailbox`, then log in.
- [ ] Create, edit, complete, uncomplete and delete a todo.
- [ ] Filter All, Active, Completed. Refresh. The filter persists.
- [ ] Forgot password, reset through the mailbox, log in with the new password.
- [ ] Log out. Log in again.

**M-02: Forms**
- [ ] Every input has a visible label. Errors are announced and linked.
- [ ] Password managers fill the fields. Show/hide password works with the keyboard.
- [ ] Mobile keyboards show the right layout for email.
- [ ] Double-click submit sends one request.

**M-03: Layout and accessibility**
- [ ] 320 px, 768 px and 1280 px widths look right. No horizontal scrolling.
- [ ] 200% zoom is usable. `prefers-reduced-motion` is respected.
- [ ] Keyboard only: every flow completes. Dialogs trap focus and return it.
- [ ] A very long title and an emoji title display correctly.
- [ ] axe or Lighthouse shows no critical issues.

**M-04: Network and scale**
- [ ] Throttle to a slow connection: loading states appear, nothing duplicates.
- [ ] Go offline: friendly messages and retry work.
- [ ] `slow@example.com`: 3-second latency is handled.
- [ ] A list of 500 or more todos is usable.

**M-05: Security and sessions**
- [ ] `unverified@example.com` cannot log in and sees the resend option.
- [ ] `locked@example.com` shows the rate-limit message.
- [ ] `shortlived@example.com`: after 30 seconds the next action logs you out once, with one message.
- [ ] Log out in one tab: the other tab logs out.
- [ ] Log in as user A, log out, log in as user B: none of A's todos appear.
- [ ] Open `/todos` while logged out: redirected to `/login`, and back after login.
- [ ] `/login?` with a crafted redirect (`//evil.com`) never leaves the site.
- [ ] `npm run preview` of a normal `build`: the mock is not started.
- [ ] Browser console is clean throughout.

### Appendix E: Quick command reference

| Task | Command |
|---|---|
| Install dependencies | `npm install` |
| Start development (mock on) | `npm run dev` |
| Lint, type-check, format check, tests, build | `npm run check` |
| Run tests (watch) | `npm test` |
| Run tests once | `npm run test:run` |
| Coverage | `npm run coverage` |
| Format all files | `npm run format` |
| Production build | `npm run build` |
| Demo build (mock on) | `npm run build:demo` |
| Preview a build locally | `npm run preview` |
| Generate the MSW worker file | `npx msw init public` |
| Review dependencies for known issues | `npm audit` |
