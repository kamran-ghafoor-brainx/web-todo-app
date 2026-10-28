import { z } from "zod";
import {
  DESCRIPTION_MAX_LENGTH,
  emptyTodoFormValues,
  TITLE_MAX_LENGTH,
  todoFormSchema,
  toTodoFormValues,
  toTodoRequest,
  type TodoFormValues,
} from "@/features/todos/todoSchemas";
import type { Todo } from "@/features/todos/types";
import { messages } from "@/lib/messages";

const valid: TodoFormValues = { title: "Buy milk", description: "", dueDate: "" };

function fieldErrors(input: Partial<TodoFormValues>) {
  const result = todoFormSchema.safeParse({ ...valid, ...input });
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("todoFormSchema (T-U02)", () => {
  it("accepts a title alone, with an empty description and no due date", () => {
    expect(todoFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects the empty starting values, because the title is required", () => {
    expect(todoFormSchema.safeParse(emptyTodoFormValues).success).toBe(false);
  });

  it("trims the title and description before checking and sending them", () => {
    const result = todoFormSchema.parse({
      title: "  Buy milk  ",
      description: "  Two litres  ",
      dueDate: "",
    });
    expect(result).toEqual({ title: "Buy milk", description: "Two litres", dueDate: "" });
  });

  describe("title", () => {
    it("is required, and only spaces count as empty (EC-40)", () => {
      expect(fieldErrors({ title: "" }).title).toEqual([messages.validation.titleRequired]);
      expect(fieldErrors({ title: "    " }).title).toEqual([messages.validation.titleRequired]);
    });

    it(`allows ${TITLE_MAX_LENGTH} characters but not ${TITLE_MAX_LENGTH + 1} (EC-41)`, () => {
      expect(fieldErrors({ title: "t".repeat(TITLE_MAX_LENGTH) }).title).toBeUndefined();
      expect(fieldErrors({ title: "t".repeat(TITLE_MAX_LENGTH + 1) }).title).toEqual([
        messages.validation.titleTooLong,
      ]);
    });

    it("counts the length after trimming", () => {
      const padded = `  ${"t".repeat(TITLE_MAX_LENGTH)}  `;
      expect(fieldErrors({ title: padded }).title).toBeUndefined();
    });

    it("accepts emoji and right-to-left text", () => {
      expect(fieldErrors({ title: "🛒 Groceries" }).title).toBeUndefined();
      expect(fieldErrors({ title: "شراء الحليب" }).title).toBeUndefined();
    });
  });

  describe("description", () => {
    it("is optional", () => {
      expect(fieldErrors({ description: "" }).description).toBeUndefined();
    });

    it(`allows ${DESCRIPTION_MAX_LENGTH} characters but not ${DESCRIPTION_MAX_LENGTH + 1} (EC-41)`, () => {
      expect(
        fieldErrors({ description: "d".repeat(DESCRIPTION_MAX_LENGTH) }).description,
      ).toBeUndefined();
      expect(
        fieldErrors({ description: "d".repeat(DESCRIPTION_MAX_LENGTH + 1) }).description,
      ).toEqual([messages.validation.descriptionTooLong]);
    });
  });

  describe("due date", () => {
    it("is optional (an empty date input gives an empty string)", () => {
      expect(fieldErrors({ dueDate: "" }).dueDate).toBeUndefined();
    });

    it("accepts a real YYYY-MM-DD date, including 29 February in a leap year", () => {
      expect(fieldErrors({ dueDate: "2026-10-27" }).dueDate).toBeUndefined();
      expect(fieldErrors({ dueDate: "2028-02-29" }).dueDate).toBeUndefined();
    });

    it.each(["2026-02-29", "2026-04-31", "2026-13-01", "27/10/2026", "2026-1-5", "tomorrow"])(
      "rejects %s",
      (dueDate) => {
        expect(fieldErrors({ dueDate }).dueDate).toEqual([messages.validation.dueDateInvalid]);
      },
    );
  });
});

describe("form value conversion", () => {
  const todo: Todo = {
    id: "t1",
    title: "Buy milk",
    description: null,
    isCompleted: false,
    dueDate: null,
    createdAt: "2026-10-27T09:00:00.000Z",
    updatedAt: "2026-10-27T09:00:00.000Z",
  };

  it("turns empty description and due date into null for the API", () => {
    expect(toTodoRequest(valid)).toEqual({ title: "Buy milk", description: null, dueDate: null });
    expect(
      toTodoRequest({ title: "Buy milk", description: "Two litres", dueDate: "2026-11-01" }),
    ).toEqual({ title: "Buy milk", description: "Two litres", dueDate: "2026-11-01" });
  });

  it("fills the edit form from a saved todo, using empty strings for missing values", () => {
    expect(toTodoFormValues(todo)).toEqual(valid);
    expect(toTodoFormValues({ ...todo, description: "Two litres", dueDate: "2026-11-01" })).toEqual(
      { title: "Buy milk", description: "Two litres", dueDate: "2026-11-01" },
    );
  });

  it("round-trips: a saved todo, shown in the form and saved again, is unchanged", () => {
    const saved = { ...todo, description: "Two litres", dueDate: "2026-11-01" };
    expect(toTodoRequest(todoFormSchema.parse(toTodoFormValues(saved)))).toEqual({
      title: saved.title,
      description: saved.description,
      dueDate: saved.dueDate,
    });
  });
});
