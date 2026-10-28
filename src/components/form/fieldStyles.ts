import { cn } from "@/lib/cn";

export function fieldClasses({ invalid }: { invalid: boolean }): string {
  return cn(
    "block min-h-touch w-full rounded-control border bg-surface px-3 py-2 text-base text-fg",
    "placeholder:text-fg-muted",
    "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-60",
    invalid ? "border-danger" : "border-border-strong",
  );
}
