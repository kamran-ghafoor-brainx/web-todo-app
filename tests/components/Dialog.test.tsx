import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog } from "@/components/Dialog";

/** The browser turns Escape on a modal `<dialog>` into a `cancel` event; jsdom does not. */
function pressEscapeOn(dialog: HTMLElement) {
  fireEvent(dialog, new Event("cancel", { cancelable: true }));
}

function DialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      {open && (
        <Dialog title="Edit todo" description="Change the details." onClose={() => setOpen(false)}>
          <input aria-label="Title" />
        </Dialog>
      )}
    </>
  );
}

describe("Dialog (T-C02)", () => {
  it("opens as a modal named by its title and described by its description", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    const dialog = screen.getByRole("dialog", { name: "Edit todo" });
    expect(dialog).toHaveAttribute("open");
    expect(dialog).toHaveAccessibleDescription("Change the details.");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes on Escape and returns focus to the button that opened it", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    const opener = screen.getByRole("button", { name: "Open" });

    await user.click(opener);
    pressEscapeOn(screen.getByRole("dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("follows the browser when it closes the dialog by itself", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    fireEvent(screen.getByRole("dialog"), new Event("close"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

function ConfirmHarness({ loading = false }: { loading?: boolean }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState("none");
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Delete
      </button>
      <p>Result: {result}</p>
      {open && (
        <ConfirmDialog
          title='Delete "Buy milk"?'
          description="This can't be undone."
          confirmLabel="Delete todo"
          confirmingLabel="Deleting…"
          loading={loading}
          onConfirm={() => {
            setResult("confirmed");
            setOpen(false);
          }}
          onCancel={() => {
            setResult("cancelled");
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

describe("ConfirmDialog (T-C02)", () => {
  it("starts with focus on Cancel, so Enter never confirms by accident", async () => {
    const user = userEvent.setup();
    render(<ConfirmHarness />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("dialog", { name: 'Delete "Buy milk"?' })).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("confirms with the confirm button", async () => {
    const user = userEvent.setup();
    render(<ConfirmHarness />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Delete todo" }));

    expect(screen.getByText("Result: confirmed")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels with Cancel and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<ConfirmHarness />);
    const trigger = screen.getByRole("button", { name: "Delete" });

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Result: cancelled")).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("cancels on Escape", async () => {
    const user = userEvent.setup();
    render(<ConfirmHarness />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    pressEscapeOn(screen.getByRole("dialog"));

    expect(screen.getByText("Result: cancelled")).toBeInTheDocument();
  });

  it("reopens if the browser force-closes it while the action runs", async () => {
    const user = userEvent.setup();
    render(<ConfirmHarness loading />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    await act(async () => {
      dialog.close();
      fireEvent(dialog, new Event("close"));
    });

    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("Result: none")).toBeInTheDocument();
  });

  it("disables both buttons and ignores Escape while the action runs", async () => {
    const user = userEvent.setup();
    render(<ConfirmHarness loading />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    pressEscapeOn(screen.getByRole("dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
  });
});
