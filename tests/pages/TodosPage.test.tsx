import { screen, within } from "@testing-library/react";
import { http as mswHttp, HttpResponse } from "msw";
import { authApi } from "@/features/auth";
import { initialAuthState } from "@/features/auth/authSlice";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { server } from "@/mocks/server";
import { TodosPage } from "@/pages/TodosPage";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

async function renderAsDemo(email: string = MAGIC_EMAILS.demo) {
  const { accessToken, user } = await authApi.login({ email, password: MAGIC_PASSWORD });
  tokenStorage.set(accessToken);
  return renderWithProviders(<TodosPage />, {
    route: "/todos",
    preloadedState: { auth: { ...initialAuthState, status: "authenticated", user } },
  });
}

describe("TodosPage (D1, D2, E1)", () => {
  it("has the page heading and tab title", async () => {
    await renderAsDemo();

    expect(screen.getByRole("heading", { level: 1, name: messages.todosPage.title })).toBeVisible();
    expect(document.title).toBe(messages.app.pageTitle(messages.todosPage.title));
  });

  it("loads the user's todos and lists them newest first", async () => {
    await renderAsDemo();

    expect(screen.getByRole("status")).toHaveTextContent(messages.todoList.loading);
    expect(await screen.findByText("Plan the week")).toBeVisible();
    const list = screen.getByRole("list", { name: messages.todoList.label });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      "Plan the week",
      "Buy groceries",
      "Renew library books",
      "Call the dentist",
      "Read chapter 4",
    ]);
  });

  it("shows the filters with counts once loaded, and filters the list by the URL", async () => {
    const { user } = await renderAsDemo();
    await screen.findByText("Plan the week");

    await user.click(screen.getByRole("link", { name: /^Completed/ }));

    const list = screen.getByRole("list", { name: messages.todoList.label });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Call the dentist"]);
    expect(screen.getByRole("link", { name: /^All/ })).toHaveTextContent("5");
  });

  it("adds a todo from the form to the top of the list", async () => {
    const { user } = await renderAsDemo();
    await screen.findByText("Plan the week");

    await user.type(screen.getByRole("textbox", { name: messages.todoForm.title }), "New one");
    await user.click(screen.getByRole("button", { name: messages.todoForm.add }));

    const list = screen.getByRole("list", { name: messages.todoList.label });
    expect(await within(list).findByText("New one")).toBeVisible();
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("New one");
  });

  it("moves a new user from 'Add your first todo' into the title field", async () => {
    const { user } = await renderAsDemo(MAGIC_EMAILS.shortlived);

    await user.click(await screen.findByRole("button", { name: messages.todoList.addFirst }));

    expect(screen.getByRole("textbox", { name: messages.todoForm.title })).toHaveFocus();
  });

  it("shows a readable error when the list cannot load", async () => {
    server.use(mswHttp.get("/api/todos", () => HttpResponse.json({}, { status: 500 })));
    await renderAsDemo();

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.errors.server);
  });
});
