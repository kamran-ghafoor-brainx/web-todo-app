import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { initialTodosState } from "@/features/todos/todosSlice";
import { messages } from "@/lib/messages";
import { TOKEN_STORAGE_KEY, tokenStorage } from "@/lib/tokenStorage";
import { MAGIC_EMAILS, MAGIC_PASSWORD } from "@/mocks/config";
import { renderApp } from "@tests/utils/renderApp";

vi.setConfig({ testTimeout: 15_000 });

type User = ReturnType<typeof renderApp>["user"];

const DEMO_TITLES = [
  "Plan the week",
  "Buy groceries",
  "Renew library books",
  "Call the dentist",
  "Read chapter 4",
];

async function logIn(user: User, email: string) {
  await user.type(await screen.findByLabelText(messages.fields.email), email);
  await user.type(screen.getByLabelText(messages.fields.password), MAGIC_PASSWORD);
  await user.click(screen.getByRole("button", { name: messages.login.submit }));
  await screen.findByRole("heading", { level: 1, name: messages.todosPage.title });
}

const toasts = () => screen.getByRole("region", { name: messages.toast.region });

describe("todos journey (T-I02)", () => {
  it("logs in, then creates, edits, toggles and deletes a todo", async () => {
    const { user } = renderApp("/login");
    await logIn(user, MAGIC_EMAILS.demo);
    await screen.findByRole("checkbox", { name: "Plan the week" });

    await user.type(screen.getByRole("textbox", { name: messages.todoForm.title }), "Water plants");
    await user.click(screen.getByRole("button", { name: messages.todoForm.add }));
    expect(await screen.findByRole("checkbox", { name: "Water plants" })).not.toBeChecked();
    expect(within(toasts()).getByText(messages.todos.added)).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: messages.todoItem.editLabel("Water plants") }),
    );
    const title = within(screen.getByRole("dialog")).getByRole("textbox", {
      name: messages.todoForm.title,
    });
    await user.type(title, " daily");
    await user.click(screen.getByRole("button", { name: messages.todoItem.save }));
    expect(await screen.findByRole("checkbox", { name: "Water plants daily" })).toBeVisible();

    await user.click(screen.getByRole("checkbox", { name: "Water plants daily" }));
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: "Water plants daily" })).toBeChecked(),
    );

    await user.click(
      screen.getByRole("button", { name: messages.todoItem.deleteLabel("Water plants daily") }),
    );
    await user.click(screen.getByRole("button", { name: messages.todoItem.deleteConfirm }));
    await waitFor(() =>
      expect(
        screen.queryByRole("checkbox", { name: "Water plants daily" }),
      ).not.toBeInTheDocument(),
    );
    expect(within(toasts()).getByText(messages.todos.deleted)).toBeVisible();
  });
});

describe("two users on one browser (T-I05, EC-58)", () => {
  it("shows user B none of user A's todos after A logs out", async () => {
    const { user, store, path } = renderApp("/login");

    await logIn(user, MAGIC_EMAILS.demo);
    await screen.findByRole("checkbox", { name: "Plan the week" });
    await user.click(screen.getByRole("button", { name: messages.session.logout }));
    expect(await screen.findByText(messages.auth.loggedOut)).toBeVisible();
    expect(store.getState().todos).toEqual(initialTodosState);

    await logIn(user, MAGIC_EMAILS.shortlived);

    expect(
      await screen.findByRole("heading", { name: messages.todoList.emptyTitle }),
    ).toBeVisible();
    expect(screen.getByRole("banner")).toHaveTextContent("Short Lived");
    for (const title of DEMO_TITLES) {
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    }
    expect(store.getState().todos.items).toEqual([]);
    expect(path()).toBe("/todos");
  });
});

describe("logout in another tab (T-I07, EC-27)", () => {
  it("logs this tab out with a notice and clears its todos", async () => {
    const { user, store, path } = renderApp("/login");
    await logIn(user, MAGIC_EMAILS.demo);
    await screen.findByRole("checkbox", { name: "Plan the week" });

    act(() => {
      tokenStorage.clear();
      fireEvent(
        window,
        new StorageEvent("storage", {
          key: TOKEN_STORAGE_KEY,
          newValue: null,
          storageArea: localStorage,
        }),
      );
    });

    expect(await screen.findByText(messages.auth.loggedOut)).toBeVisible();
    expect(path()).toBe("/login");
    expect(store.getState().todos).toEqual(initialTodosState);
  });
});
