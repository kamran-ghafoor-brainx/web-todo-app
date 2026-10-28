import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http as mswHttp, HttpResponse } from "msw";
import { authApi } from "@/features/auth";
import { TodoList } from "@/features/todos/components/TodoList";
import { todosApi } from "@/features/todos/todosApi";
import { fetchTodos } from "@/features/todos/todosThunks";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { server } from "@/mocks/server";
import { renderWithProviders } from "@tests/utils/renderWithProviders";

const FIRST = "Plan the week";

async function renderDemoList() {
  const { accessToken } = await authApi.login({
    email: MAGIC_EMAILS.demo,
    password: MAGIC_PASSWORD,
  });
  tokenStorage.set(accessToken);
  const result = renderWithProviders(<TodoList />, { route: "/todos" });
  await result.store.dispatch(fetchTodos());
  await screen.findByRole("checkbox", { name: FIRST });
  const firstId = result.store.getState().todos.items[0]?.id ?? "";
  return { ...result, firstId };
}

const checkbox = (title = FIRST) => screen.getByRole("checkbox", { name: title });
const button = (label: (title: string) => string, title = FIRST) =>
  screen.getByRole("button", { name: label(title) });
const toasts = () => screen.getByRole("region", { name: messages.toast.region });

describe("toggling a todo (T-C11)", () => {
  it("ticks it after the server confirms, with the controls disabled meanwhile (EC-53)", async () => {
    const { user } = await renderDemoList();

    const click = user.click(checkbox());
    await waitFor(() => expect(checkbox()).toBeDisabled());
    await click;

    await waitFor(() => expect(checkbox()).toBeChecked());
    expect(checkbox()).toBeEnabled();
  });

  it("leaves the item unchanged and shows an error when the server fails (EC-48)", async () => {
    server.use(mswHttp.patch("/api/todos/:id", () => HttpResponse.json({}, { status: 500 })));
    const { user } = await renderDemoList();

    await user.click(checkbox());

    expect(await within(toasts()).findByText(messages.errors.server)).toBeVisible();
    expect(checkbox()).not.toBeChecked();
  });

  it("removes the item and says so when it was deleted elsewhere", async () => {
    const { user, firstId } = await renderDemoList();
    await todosApi.remove(firstId);

    await user.click(checkbox());

    expect(await within(toasts()).findByText(messages.todos.alreadyGone)).toBeVisible();
    expect(screen.queryByRole("checkbox", { name: FIRST })).not.toBeInTheDocument();
  });
});

describe("editing a todo (T-C10)", () => {
  it("opens a dialog filled with the todo, saves, closes and returns focus to Edit", async () => {
    const { user } = await renderDemoList();

    await user.click(button(messages.todoItem.editLabel));
    const dialog = screen.getByRole("dialog", { name: messages.todoItem.editHeading });
    const title = within(dialog).getByRole("textbox", { name: messages.todoForm.title });
    expect(title).toHaveValue(FIRST);

    await user.clear(title);
    await user.type(title, "Plan next week");
    await user.click(within(dialog).getByRole("button", { name: messages.todoItem.save }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(checkbox("Plan next week")).toBeInTheDocument();
    expect(within(toasts()).getByText(messages.todos.updated)).toBeVisible();
    expect(button(messages.todoItem.editLabel, "Plan next week")).toHaveFocus();
  });

  it("keeps the dialog open with the typed values and the error when saving fails", async () => {
    const { user } = await renderDemoList();

    await user.click(button(messages.todoItem.editLabel));
    const dialog = screen.getByRole("dialog");
    const title = within(dialog).getByRole("textbox", { name: messages.todoForm.title });
    await user.clear(title);
    await user.paste("Broken [fail]");
    await user.click(within(dialog).getByRole("button", { name: messages.todoItem.save }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(messages.errors.server);
    expect(title).toHaveValue("Broken [fail]");
    expect(checkbox()).toBeInTheDocument();
  });

  it("closes and says the todo is gone when it was deleted meanwhile (EC-51)", async () => {
    const { user, firstId } = await renderDemoList();

    await user.click(button(messages.todoItem.editLabel));
    await todosApi.remove(firstId);
    await user.click(screen.getByRole("button", { name: messages.todoItem.save }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(within(toasts()).getByText(messages.todos.alreadyGone)).toBeVisible();
    expect(screen.queryByRole("checkbox", { name: FIRST })).not.toBeInTheDocument();
  });

  it("closes without saving on Cancel and on Escape", async () => {
    const { user } = await renderDemoList();

    await user.click(button(messages.todoItem.editLabel));
    await user.type(screen.getByRole("textbox", { name: messages.todoForm.title }), " edited");
    await user.click(screen.getByRole("button", { name: messages.dialog.cancel }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(button(messages.todoItem.editLabel));
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(checkbox()).toBeInTheDocument();
  });
});

describe("deleting a todo (T-C11)", () => {
  it("asks first, naming the todo; Cancel keeps it", async () => {
    const { user } = await renderDemoList();

    await user.click(button(messages.todoItem.deleteLabel));

    expect(
      screen.getByRole("dialog", { name: messages.todoItem.deleteTitle(FIRST) }),
    ).toHaveAccessibleDescription(messages.todoItem.deleteDescription);
    await user.click(screen.getByRole("button", { name: messages.dialog.cancel }));
    expect(checkbox()).toBeInTheDocument();
  });

  it("deletes after confirming, says so, and moves focus to the list area", async () => {
    const { user } = await renderDemoList();

    await user.click(button(messages.todoItem.deleteLabel));
    await user.click(screen.getByRole("button", { name: messages.todoItem.deleteConfirm }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("checkbox", { name: FIRST })).not.toBeInTheDocument();
    expect(within(toasts()).getByText(messages.todos.deleted)).toBeVisible();
    expect(document.activeElement).toContainElement(
      screen.getByRole("list", { name: messages.todoList.label }),
    );
  });

  it("keeps focus on the list area when the last visible todo is deleted", async () => {
    const { user, router } = await renderDemoList();
    await router.navigate("/todos?status=completed");
    const onlyCompleted = "Call the dentist";

    await user.click(button(messages.todoItem.deleteLabel, onlyCompleted));
    await user.click(screen.getByRole("button", { name: messages.todoItem.deleteConfirm }));

    const noMatches = await screen.findByRole("heading", { name: messages.todoList.noMatchTitle });
    await waitFor(() => expect(document.activeElement).toContainElement(noMatches));
  });

  it("says the todo is already gone when it was deleted elsewhere", async () => {
    const { user, firstId } = await renderDemoList();
    await todosApi.remove(firstId);

    await user.click(button(messages.todoItem.deleteLabel));
    await user.click(screen.getByRole("button", { name: messages.todoItem.deleteConfirm }));

    expect(await within(toasts()).findByText(messages.todos.alreadyGone)).toBeVisible();
    expect(screen.queryByRole("checkbox", { name: FIRST })).not.toBeInTheDocument();
  });

  it("keeps the todo and shows an error when deleting fails", async () => {
    server.use(mswHttp.delete("/api/todos/:id", () => HttpResponse.error()));
    const { user } = await renderDemoList();

    await user.click(button(messages.todoItem.deleteLabel));
    await user.click(screen.getByRole("button", { name: messages.todoItem.deleteConfirm }));

    expect(await within(toasts()).findByText(messages.errors.network)).toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(checkbox()).toBeInTheDocument();
  });

  it("shows no false error when Delete is confirmed twice quickly", async () => {
    const { user } = await renderDemoList();

    await user.click(button(messages.todoItem.deleteLabel));
    const confirm = screen.getByRole("button", { name: messages.todoItem.deleteConfirm });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(await within(toasts()).findByText(messages.todos.deleted)).toBeVisible();
    expect(within(toasts()).getAllByRole("listitem")).toHaveLength(1);
  });
});
