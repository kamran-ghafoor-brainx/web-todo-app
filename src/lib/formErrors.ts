import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { getErrorMessage } from "@/lib/getErrorMessage";
import { messages } from "@/lib/messages";

export type SubmitHandler<Values> = (values: Values) => Promise<void>;

export type FieldSubmitError<Field extends string = string> = {
  kind: "field-error";
  field: Field;
  message: string;
};

export function fieldError<Field extends string>(
  field: Field,
  message: string,
): FieldSubmitError<Field> {
  return { kind: "field-error", field, message };
}

function isFieldSubmitError(value: unknown): value is FieldSubmitError {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "field-error"
  );
}

export function showSubmitError<Values extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<Values>,
  fields: readonly Path<Values>[],
): void {
  if (isFieldSubmitError(error)) {
    const field = fields.find((name) => name === error.field);
    if (field) {
      setError(field, { message: error.message }, { shouldFocus: true });
      return;
    }
    setError("root.server", { message: error.message });
    return;
  }

  setError("root.server", {
    message: typeof error === "string" ? error : messages.errors.server,
  });
}

export async function withUserFacingError<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    throw getErrorMessage(error);
  }
}
