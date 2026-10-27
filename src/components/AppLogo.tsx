import { cn } from "@/lib/cn";
import { messages } from "@/lib/messages";

type AppLogoProps = {
  className?: string;
};

export function AppLogo({ className }: AppLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-lg font-semibold text-fg", className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M9 16.5l4.5 4.5L23 11.5"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-on-primary"
        />
      </svg>
      {messages.app.name}
    </span>
  );
}
