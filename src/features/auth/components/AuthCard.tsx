import { useEffect, useRef, type ReactNode } from "react";
import { Card } from "@/components/Card";
import { cn } from "@/lib/cn";

const ICON_TONES = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success",
  danger: "bg-danger-subtle text-danger",
} as const;

type AuthCardProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  iconTone?: keyof typeof ICON_TONES;
  autoFocusTitle?: boolean;
};

export function AuthCard({
  title,
  description,
  children,
  footer,
  icon,
  iconTone = "primary",
  autoFocusTitle = false,
}: AuthCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocusTitle) titleRef.current?.focus();
  }, [autoFocusTitle]);

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <div className="mb-6 space-y-2">
          {icon && (
            <div
              className={cn(
                "mb-4 flex size-12 items-center justify-center rounded-full",
                ICON_TONES[iconTone],
              )}
            >
              {icon}
            </div>
          )}
          <h1
            ref={titleRef}
            tabIndex={autoFocusTitle ? -1 : undefined}
            className={autoFocusTitle ? "outline-none" : undefined}
          >
            {title}
          </h1>
          {description && <p className="text-fg-muted">{description}</p>}
        </div>
        {children}
      </Card>

      {footer && <div className="text-center text-sm text-fg-muted">{footer}</div>}
    </div>
  );
}
