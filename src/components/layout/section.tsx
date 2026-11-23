import React from "react";
import clsx from "clsx";

export type SectionProps = {
  /** Optional section heading */
  title?: React.ReactNode;
  /** Optional leading icon displayed inline with the section title */
  icon?: React.ReactNode;
  /** Optional single count/status badge displayed inline with the title */
  badge?: React.ReactNode;
  /** Optional concise subtitle below the section heading */
  description?: React.ReactNode;
  /** Optional action controls aligned to the end/right of the section header */
  actions?: React.ReactNode;
  /** Adds a subtle top divider border above the section */
  bordered?: boolean;
  /** Semantic heading level ("h2" default, or "h3" for nested subsections) */
  as?: "h2" | "h3";
  /** Layout variant: "stack" (default inside authenticated shell) or "container" (outer full-bleed wrapper) */
  variant?: "stack" | "container";
  children: React.ReactNode;
  className?: string;
  id?: string;
};

/**
 * Standard Section layout primitive across OrGanap.
 * Provides uniform section headings, optional icon/badge/subtitle,
 * right-aligned section controls, and consistent vertical rhythm.
 */
export function Section({
  title,
  icon,
  badge,
  description,
  actions,
  bordered = false,
  as = "h2",
  variant = "stack",
  children,
  className,
  id,
}: SectionProps) {
  const HeadingTag = as;
  const hasHeader = Boolean(title || description || actions);

  const headerContent = hasHeader ? (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="flex flex-col gap-0.5 min-w-0">
        {title ? (
          <div className="flex items-center gap-2 flex-wrap">
            {icon ? <span className="shrink-0 flex items-center">{icon}</span> : null}
            {typeof title === "string" ? (
              <HeadingTag
                className={clsx(
                  "font-bold text-foreground tracking-tight",
                  as === "h3" ? "text-sm sm:text-base" : "text-base sm:text-lg"
                )}
              >
                {title}
              </HeadingTag>
            ) : (
              title
            )}
            {badge}
          </div>
        ) : null}

        {description ? (
          typeof description === "string" ? (
            <p className="text-xs text-muted leading-relaxed">{description}</p>
          ) : (
            <div className="text-xs text-muted leading-relaxed">{description}</div>
          )
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:ml-auto">
          {actions}
        </div>
      ) : null}
    </div>
  ) : null;

  if (variant === "container") {
    return (
      <section className={clsx("w-full py-8 md:py-12", className)} id={id}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-4">
          {headerContent}
          {children}
        </div>
      </section>
    );
  }

  return (
    <section
      className={clsx(
        "flex flex-col gap-4 w-full",
        bordered && "pt-6 border-t border-border/30",
        className
      )}
      id={id}
    >
      {headerContent}
      {children}
    </section>
  );
}
