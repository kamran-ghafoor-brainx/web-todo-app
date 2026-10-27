import { screen, waitFor } from "@testing-library/react";
import { http as mswHttp, HttpResponse } from "msw";
import { authApi } from "@/features/auth";
import { initialTodosState } from "@/features/todos/todosSlice";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { server } from "@/mocks/server";
import { renderApp } from "@tests/utils/renderApp";

async function storeDemoToken() {
  const { accessToken } = await authApi.login({
    email: MAGIC_EMAILS.demo,
    password: MAGIC_PASSWORD,
  });
  tokenStorage.set(accessToken);
}

describe("AppLayout (session check for /todos)", () => {
  it("shows a loading state while the session is checked, then the page with the user", async () => {
    await storeDemoToken();

    renderApp("/todos");

    expect(screen.getByRole("img", { name: messages.session.checking })).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 1, name: messages.todosPage.title }),
    ).toBeVisible();
    expect(screen.getByRole("banner")).toHaveTextContent("Demo User");
    expect(screen.getByRole("button", { name: messages.session.logout })).toBeVisible();
    expect(screen.queryByRole("heading", { name: messages.login.title })).not.toBeInTheDocument();
  });

  it("shows a retry screen when the server cannot be reached, without logging out (EC-24)", async () => {
    await storeDemoToken();
    server.use(mswHttp.get("/api/auth/me", () => HttpResponse.error()));
    const { user, path } = renderApp("/todos");

    expect(
      await screen.findByRole("heading", { name: messages.session.loadFailedTitle }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(messages.errors.network);
    expect(tokenStorage.get()).not.toBeNull();

    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: messages.session.retry }));

    expect(
      await screen.findByRole("heading", { level: 1, name: messages.todosPage.title }),
    ).toBeVisible();
    expect(path()).toBe("/todos");
  });

  it("logs out to /login with a notice, and clears the token and the todos", async () => {
    await storeDemoToken();
    const { user, path, store } = renderApp("/todos");
    await screen.findByText("Plan the week");

    await user.click(screen.getByRole("button", { name: messages.session.logout }));

    expect(await screen.findByText(messages.auth.loggedOut)).toBeVisible();
    expect(path()).toBe("/login");
    expect(tokenStorage.get()).toBeNull();
    expect(store.getState().todos).toEqual(initialTodosState);
  });

  it("sends the user to /login with 'session expired' when a request answers 401", async () => {
    await storeDemoToken();
    server.use(mswHttp.get("/api/todos", () => HttpResponse.json({}, { status: 401 })));
    const { path, store } = renderApp("/todos");

    expect(await screen.findByText(messages.auth.sessionExpired)).toBeVisible();
    await waitFor(() => expect(path()).toBe("/login"));
    expect(store.getState().todos).toEqual(initialTodosState);
  });
});
