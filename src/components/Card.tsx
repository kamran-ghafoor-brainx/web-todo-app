import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

const PADDING = {
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

type CardProps = ComponentProps<"div"> & {
  padding?: keyof typeof PADDING;
};

export function Card({ padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-card border border-border bg-surface shadow-card",
        PADDING[padding],
        className,
      )}
    />
  );
}
