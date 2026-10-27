import type { ComponentProps } from "react";
import { buttonClasses, type ButtonVariant } from "@/components/buttonStyles";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/cn";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
};

export function Button({
  variant = "primary",
  fullWidth = false,
  loading = false,
  loadingText,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, fullWidth }), className)}
    >
      {loading && <Spinner size="sm" />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
