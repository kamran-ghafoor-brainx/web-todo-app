import { useState, type ComponentProps } from "react";
import { fieldClasses } from "@/components/form/fieldStyles";
import { FormField } from "@/components/form/FormField";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

type PasswordFieldProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
  hint?: string;
  error?: string;
};

export function PasswordField({
  label,
  hint,
  error,
  id,
  className,
  disabled,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <div className="relative">
          <input
            {...inputProps}
            {...control}
            type={visible ? "text" : "password"}
            disabled={disabled}
            className={cn(fieldClasses({ invalid: Boolean(error) }), "pr-12")}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            disabled={disabled}
            aria-label={messages.fields.showPassword}
            aria-pressed={visible}
            aria-controls={control.id}
            className="absolute inset-y-0 right-0 flex w-touch items-center justify-center rounded-r-control text-fg-muted enabled:hover:text-fg disabled:cursor-not-allowed"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      )}
    </FormField>
  );
}
