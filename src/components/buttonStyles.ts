import { cn } from "@/lib/cn";

const BASE =
  "inline-flex min-h-touch items-center justify-center gap-2 rounded-control border px-4 " +
  "text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTS = {
  primary: "border-transparent bg-primary text-on-primary not-disabled:hover:bg-primary-hover",
  secondary: "border-border-strong bg-surface text-fg not-disabled:hover:bg-surface-muted",
  danger: "border-transparent bg-danger text-on-danger not-disabled:hover:bg-danger-hover",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export function buttonClasses({
  variant = "primary",
  fullWidth = false,
}: {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}): string {
  return cn(BASE, VARIANTS[variant], fullWidth && "w-full");
}
