import type { ComponentProps } from "react";
import { fieldClasses } from "@/components/form/fieldStyles";
import { FormField } from "@/components/form/FormField";
import { cn } from "@/lib/cn";

type TextAreaProps = ComponentProps<"textarea"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextArea({
  label,
  hint,
  error,
  id,
  className,
  rows = 4,
  ...textAreaProps
}: TextAreaProps) {
  return (
    <FormField label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <textarea
          {...textAreaProps}
          {...control}
          rows={rows}
          className={cn(fieldClasses({ invalid: Boolean(error) }), "resize-y break-words")}
        />
      )}
    </FormField>
  );
}
