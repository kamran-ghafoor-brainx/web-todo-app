import { Link, type LinkProps } from "react-router";
import { cn } from "@/lib/cn";

export function TextLink({ className, ...rest }: LinkProps) {
  return (
    <Link
      {...rest}
      className={cn(
        "rounded-sm font-medium text-primary underline underline-offset-4",
        "hover:text-primary-hover hover:decoration-2",
        className,
      )}
    />
  );
}
