import type { ReactNode } from "react";
import { AlertCircleIcon, CheckCircleIcon, InfoIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const VARIANTS = {
  error: {
    role: "alert",
    Icon: AlertCircleIcon,
    iconClass: "text-danger",
    boxClass: "border-danger bg-danger-subtle",
  },
  success: {
    role: "status",
    Icon: CheckCircleIcon,
    iconClass: "text-success",
    boxClass: "border-success bg-success-subtle",
  },
  info: {
    role: "status",
    Icon: InfoIcon,
    iconClass: "text-primary",
    boxClass: "border-primary bg-primary-subtle",
  },
} as const;

type AlertProps = {
  variant: keyof typeof VARIANTS;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function Alert({ variant, title, children, action, className }: AlertProps) {
  const { role, Icon, iconClass, boxClass } = VARIANTS[variant];

  return (
    <div
      role={role}
      className={cn("flex gap-3 rounded-card border p-4 text-sm text-fg", boxClass, className)}
    >
      <Icon className={cn("mt-0.5 shrink-0", iconClass)} />

      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="break-words">{children}</div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
