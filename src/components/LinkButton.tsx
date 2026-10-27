import { Link, type LinkProps } from "react-router";
import { buttonClasses, type ButtonVariant } from "@/components/buttonStyles";
import { cn } from "@/lib/cn";

type LinkButtonProps = LinkProps & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function LinkButton({ variant, fullWidth, className, ...rest }: LinkButtonProps) {
  return <Link {...rest} className={cn(buttonClasses({ variant, fullWidth }), className)} />;
}
