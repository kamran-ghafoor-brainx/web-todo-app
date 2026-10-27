import { cn } from "@/lib/cn";

const SIZES = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
} as const;

type SpinnerProps = {
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
};

export function Spinner({ size = "md", label, className }: SpinnerProps) {
  const a11yProps = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("shrink-0 animate-spin", SIZES[size], className)}
      {...a11yProps}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
