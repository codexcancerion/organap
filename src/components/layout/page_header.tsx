import React from "react";
import NextLink from "next/link";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";

export type PageBreadcrumbItem = {
  /** Visible breadcrumb label */
  label: React.ReactNode;
  /** Destination route; omit on the active terminal item */
  href?: string;
};

export type PageHeaderProps = {
  /** Optional breadcrumb trail rendered above the main header row (standard on /id routes) */
  breadcrumbs?: PageBreadcrumbItem[];
  /** Optional leading visual (e.g., organization Avatar or entity icon) */
  media?: React.ReactNode;
  /** The primary page title */
  title: React.ReactNode;
  /** Single optional status or count chip displayed inline with the title (max 1 chip) */
  badge?: React.ReactNode;
  /** Optional subtitle or description text */
  description?: React.ReactNode;
  /** Optional compact inline metadata row displayed below description (never KPI boxes) */
  meta?: React.ReactNode;
  /** Action buttons or primary controls aligned to the rightmost edge (never KPIs) */
  actions?: React.ReactNode;
  /**
   * Controls how actions sit relative to the title block:
   * - "inline" (default): sits beside the title when space allows, wrapping cleanly below on narrow widths
   * - "stacked": renders actions in a dedicated full-width toolbar row below the title (ideal for detail pages with 3+ actions)
   */
  actionsLayout?: "inline" | "stacked";
  /** Optional class name overrides */
  className?: string;
};

/**
 * Standard cardless PageHeader layout component across OrGanap.
 * Provides consistent breadcrumbs, leading media, title, single-chip slot,
 * subtitle/metadata, and right-aligned action buttons.
 */
export function PageHeader({
  breadcrumbs,
  media,
  title,
  badge,
  description,
  meta,
  actions,
  actionsLayout = "inline",
  className,
}: PageHeaderProps) {
  return (
    <header className={clsx("flex flex-col gap-3 w-full pt-1 pb-1", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted flex-wrap"
        >
          {breadcrumbs.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === breadcrumbs.length - 1;

            return (
              <React.Fragment key={index}>
                {index > 0 ? (
                  <span aria-hidden="true" className="text-muted/60">
                    /
                  </span>
                ) : null}
                {item.href && (!isLast || breadcrumbs.length === 1) ? (
                  <NextLink
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors max-w-[200px] sm:max-w-xs"
                    href={item.href}
                  >
                    {isFirst ? (
                      <ArrowLeft aria-hidden="true" className="shrink-0" size={14} />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </NextLink>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="text-foreground font-medium truncate max-w-[200px] sm:max-w-sm"
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      ) : null}

      <div
        className={clsx(
          "flex w-full",
          actionsLayout === "stacked"
            ? "flex-col gap-4"
            : "flex-wrap items-start justify-between gap-x-6 gap-y-4",
        )}
      >
        <div
          className={clsx(
            "flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0",
            actionsLayout === "inline" && "flex-1 min-w-[min(100%,280px)]",
          )}
        >
          {media ? <div className="shrink-0">{media}</div> : null}

          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {typeof title === "string" ? (
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug break-words">
                  {title}
                </h1>
              ) : (
                title
              )}
              {badge}
            </div>

            {description ? (
              typeof description === "string" ? (
                <p className="text-xs sm:text-sm text-muted max-w-3xl leading-relaxed">
                  {description}
                </p>
              ) : (
                <div className="text-xs sm:text-sm text-muted max-w-3xl leading-relaxed">
                  {description}
                </div>
              )
            ) : null}

            {meta ? (
              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted pt-0.5">
                {meta}
              </div>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div
            className={clsx(
              "flex flex-wrap items-center gap-2 max-w-full",
              actionsLayout === "stacked"
                ? "pt-3 border-t border-border/25 w-full"
                : "sm:justify-end",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
