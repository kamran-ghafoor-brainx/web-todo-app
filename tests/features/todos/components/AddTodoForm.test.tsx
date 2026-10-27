import { screen } from "@testing-library/react";
import { http as mswHttp, HttpResponse } from "msw";
import { authApi } from "@/features/auth";
import { AddTodoForm } from "@/features/todos/components/AddTodoForm";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { server } from "@/mocks/server";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

async function renderAsDemo() {
  const { accessToken } = await authApi.login({
    email: MAGIC_EMAILS.demo,
    password: MAGIC_PASSWORD,
  });
  tokenStorage.set(accessToken);
  return renderWithProviders(<AddTodoForm />, { route: "/todos" });
}

const titleInput = () => screen.getByRole("textbox", { name: messages.todoForm.title });
const addButton = () => screen.getByRole("button", { name: messages.todoForm.add });

describe("AddTodoForm (T-C10)", () => {
  it("is a labelled section", async () => {
    await renderAsDemo();
    expect(screen.getByRole("region", { name: messages.todoForm.addHeading })).toBeVisible();
  });

  it("saves the todo, puts it at the top of the list and clears the form", async () => {
    const { user, store } = await renderAsDemo();

    await user.type(titleInput(), "Water the plants");
    await user.type(screen.getByLabelText(messages.todoForm.dueDate), "2026-11-02");
    await user.click(addButton());

    expect(await screen.findByRole("button", { name: messages.todoForm.add })).toBeEnabled();
    expect(titleInput()).toHaveValue("");
    expect(store.getState().todos.items[0]).toMatchObject({
      title: "Water the plants",
      description: null,
      dueDate: "2026-11-02",
      isCompleted: false,
    });
  });

  it("keeps the input and shows the server error when saving fails ([fail] title)", async () => {
    const { user, store } = await renderAsDemo();

    await user.click(titleInput());
    await user.paste("Break it [fail]");
    await user.click(addButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.errors.server);
    expect(titleInput()).toHaveValue("Break it [fail]");
    expect(store.getState().todos.items).toEqual([]);
  });

  it("keeps the input when offline (EC-52)", async () => {
    server.use(mswHttp.post("/api/todos", () => HttpResponse.error()));
    const { user } = await renderAsDemo();

    await user.type(titleInput(), "Buy milk");
    await user.click(addButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.errors.network);
    expect(titleInput()).toHaveValue("Buy milk");
  });
});
