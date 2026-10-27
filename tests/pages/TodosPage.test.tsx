import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { server } from "@/mocks/server";
import { TodosPage } from "@/pages/TodosPage";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

describe("TodosPage", () => {
  it("shows a clear error heading and tab title when the account cannot be loaded", async () => {
    tokenStorage.set("mock.some-token");
    server.use(http.get("/api/auth/me", () => HttpResponse.json({}, { status: 500 })));

    renderWithProviders(<TodosPage />, { route: "/todos" });

    expect(
      await screen.findByRole("heading", { level: 1, name: messages.home.loadFailedTitle }),
    ).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(messages.errors.server);
    expect(document.title).toBe(messages.app.pageTitle(messages.home.loadFailedTitle));
  });
});
