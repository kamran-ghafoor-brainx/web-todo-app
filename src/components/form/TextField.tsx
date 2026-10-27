import type { ComponentProps } from "react";
import { fieldClasses } from "@/components/form/fieldStyles";
import { FormField } from "@/components/form/FormField";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, id, className, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <input {...inputProps} {...control} className={fieldClasses({ invalid: Boolean(error) })} />
      )}
    </FormField>
  );
}
