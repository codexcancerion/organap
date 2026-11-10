import React from "react";
import clsx from "clsx";

export type PageHeaderProps = {
  /** The primary page title */
  title: React.ReactNode;
  /** Optional badge/chip displayed inline with the title */
  badge?: React.ReactNode;
  /** Optional subtitle or description text */
  description?: React.ReactNode;
  /** Optional action buttons or controls aligned to the end/right */
  actions?: React.ReactNode;
  /** Optional class name overrides */
  className?: string;
};

/**
 * Standard cardless PageHeader layout component across OrGanap.
 * Provides consistent typography, badge alignment, subtitle, and action buttons.
 */
export function PageHeader({
  title,
  badge,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full pt-1 pb-1",
        className
      )}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {typeof title === "string" ? (
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          ) : (
            title
          )}
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 sm:ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
