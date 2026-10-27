import { screen } from "@testing-library/react";
import { http as mswHttp, HttpResponse } from "msw";
import { authApi } from "@/features/auth";
import { initialAuthState } from "@/features/auth/authSlice";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { server } from "@/mocks/server";
import { TodosPage } from "@/pages/TodosPage";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

async function renderAsDemo() {
  const { accessToken, user } = await authApi.login({
    email: MAGIC_EMAILS.demo,
    password: MAGIC_PASSWORD,
  });
  tokenStorage.set(accessToken);
  return renderWithProviders(<TodosPage />, {
    route: "/todos",
    preloadedState: { auth: { ...initialAuthState, status: "authenticated", user } },
  });
}

describe("TodosPage (D1)", () => {
  it("has the page heading and tab title", async () => {
    await renderAsDemo();

    expect(screen.getByRole("heading", { level: 1, name: messages.todosPage.title })).toBeVisible();
    expect(document.title).toBe(messages.app.pageTitle(messages.todosPage.title));
  });

  it("loads the user's todos and lists them newest first", async () => {
    await renderAsDemo();

    expect(screen.getByRole("img", { name: messages.todosPage.loading })).toBeInTheDocument();
    expect(await screen.findByText("Plan the week")).toBeVisible();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "Plan the week",
      "Buy groceries",
      "Renew library books",
      "Call the dentist",
      "Read chapter 4",
    ]);
  });

  it("shows a readable error when the list cannot load", async () => {
    server.use(mswHttp.get("/api/todos", () => HttpResponse.json({}, { status: 500 })));
    await renderAsDemo();

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.errors.server);
  });
});
