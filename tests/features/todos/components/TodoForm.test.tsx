import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoForm } from "@/features/todos/components/TodoForm";
import type { TodoFormValues } from "@/features/todos/todoSchemas";
import { fieldError } from "@/lib/formErrors";
import { messages } from "@/lib/messages";

type Props = Partial<Parameters<typeof TodoForm>[0]>;

function renderForm(props: Props = {}) {
  const onSubmit = vi.fn<(values: TodoFormValues) => Promise<void>>().mockResolvedValue();
  const user = userEvent.setup();
  render(<TodoForm onSubmit={onSubmit} submitLabel="Save" submittingLabel="Saving…" {...props} />);
  return { user, onSubmit: props.onSubmit ?? onSubmit };
}

const titleInput = () => screen.getByRole("textbox", { name: messages.todoForm.title });
const descriptionInput = () => screen.getByRole("textbox", { name: messages.todoForm.description });
const dueDateInput = () => screen.getByLabelText(messages.todoForm.dueDate);
const saveButton = () => screen.getByRole("button", { name: "Save" });

describe("TodoForm (T-C10)", () => {
  it("has a title, a description and an optional due date", () => {
    renderForm();

    expect(titleInput()).toBeVisible();
    expect(descriptionInput()).toBeVisible();
    expect(dueDateInput()).toHaveAttribute("type", "date");
  });

  it("asks for a title and does not submit when it is empty or only spaces (EC-40)", async () => {
    const { user, onSubmit } = renderForm();

    await user.type(titleInput(), "   ");
    await user.click(saveButton());

    expect(titleInput()).toHaveAccessibleDescription(messages.validation.titleRequired);
    expect(titleInput()).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a title over 100 characters (EC-41)", async () => {
    const { user, onSubmit } = renderForm();

    await user.click(titleInput());
    await user.paste("t".repeat(101));
    await user.click(saveButton());

    expect(await screen.findByText(messages.validation.titleTooLong)).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("counts the description characters as you type", async () => {
    const { user } = renderForm();
    expect(descriptionInput()).toHaveAccessibleDescription(
      messages.todoForm.descriptionCount(0, 500),
    );

    await user.type(descriptionInput(), "Two litres");

    expect(descriptionInput()).toHaveAccessibleDescription(
      messages.todoForm.descriptionCount(10, 500),
    );
  });

  it("counts like the limit does, ignoring spaces at the start and end", async () => {
    const { user } = renderForm();

    await user.type(descriptionInput(), "  Two litres  ");

    expect(descriptionInput()).toHaveAccessibleDescription(
      messages.todoForm.descriptionCount(10, 500),
    );
  });

  it("submits trimmed values, with empty strings for the optional fields", async () => {
    const { user, onSubmit } = renderForm();

    await user.type(titleInput(), "  Buy milk  ");
    await user.click(saveButton());

    expect(onSubmit).toHaveBeenCalledWith({ title: "Buy milk", description: "", dueDate: "" });
  });

  it("submits a chosen due date", async () => {
    const { user, onSubmit } = renderForm();

    await user.type(titleInput(), "Pay rent");
    await user.type(dueDateInput(), "2026-11-01");
    await user.click(saveButton());

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Pay rent",
      description: "",
      dueDate: "2026-11-01",
    });
  });

  it("disables the button while saving", async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { user } = renderForm({ onSubmit });

    await user.type(titleInput(), "Buy milk");
    await user.click(saveButton());

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    finish();
    expect(await screen.findByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("keeps what was typed and shows the error when saving fails (EC-52)", async () => {
    const onSubmit = vi.fn().mockRejectedValue(messages.errors.network);
    const { user } = renderForm({ onSubmit, resetOnSuccess: true });

    await user.type(titleInput(), "Buy milk");
    await user.type(descriptionInput(), "Two litres");
    await user.click(saveButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.errors.network);
    expect(titleInput()).toHaveValue("Buy milk");
    expect(descriptionInput()).toHaveValue("Two litres");
  });

  it("shows a field error from the server under that field", async () => {
    const onSubmit = vi.fn().mockRejectedValue(fieldError("title", "Title is taken."));
    const { user } = renderForm({ onSubmit });

    await user.type(titleInput(), "Buy milk");
    await user.click(saveButton());

    expect(await screen.findByText("Title is taken.")).toBeVisible();
    expect(titleInput()).toHaveAttribute("aria-invalid", "true");
  });

  it("clears and refocuses the title after a successful save when asked to", async () => {
    const { user } = renderForm({ resetOnSuccess: true });

    await user.type(titleInput(), "Buy milk");
    await user.type(descriptionInput(), "Two litres");
    await user.click(saveButton());

    expect(titleInput()).toHaveValue("");
    expect(descriptionInput()).toHaveValue("");
    expect(titleInput()).toHaveFocus();
  });

  it("keeps the values after saving when not asked to clear (edit form)", async () => {
    const { user } = renderForm({
      defaultValues: { title: "Buy milk", description: "", dueDate: "" },
    });

    await user.click(saveButton());

    expect(titleInput()).toHaveValue("Buy milk");
  });
});
