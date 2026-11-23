"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Breadcrumbs, Separator } from "@heroui/react";
import clsx from "clsx";

export type NavBreadcrumbItem = {
  label: string;
  href?: string;
};

const GENERIC_TITLES = new Set([
  "OrGanap",
  "Campus Events",
  "Campus Event",
  "Campus Venue",
  "Attendance Desk",
  "Organization",
  "Department",
  "Program",
  "Overview",
  "Dashboard",
  "Events",
  "Organizations",
  "Venues",
  "Departments",
  "Programs",
  "Edit Proposal",
  "Draft Event Proposal",
]);

const STATIC_ROUTE_BREADCRUMBS: Record<string, NavBreadcrumbItem[]> = {
  "/dashboard": [{ label: "Dashboard" }],
  "/notifications": [{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }],
  "/events": [{ label: "Dashboard", href: "/dashboard" }, { label: "Events" }],
  "/events/new": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Events", href: "/events" },
    { label: "New Proposal" },
  ],
  "/registrations": [{ label: "Dashboard", href: "/dashboard" }, { label: "My Passes" }],
  "/attendance": [{ label: "Dashboard", href: "/dashboard" }, { label: "Attendance" }],
  "/organizations": [{ label: "Dashboard", href: "/dashboard" }, { label: "Organizations" }],
  "/venues": [{ label: "Dashboard", href: "/dashboard" }, { label: "Venues" }],
  "/attachments": [{ label: "Dashboard", href: "/dashboard" }, { label: "Attachments" }],
  "/semesters": [{ label: "Dashboard", href: "/dashboard" }, { label: "Semesters" }],
  "/departments": [{ label: "Dashboard", href: "/dashboard" }, { label: "Departments" }],
  "/programs": [{ label: "Dashboard", href: "/dashboard" }, { label: "Programs" }],
  "/admin/users": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Administration" },
    { label: "Users" },
  ],
  "/admin/groups": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Administration" },
    { label: "Groups" },
  ],
  "/profile": [{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }],
  "/settings": [{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }],
  "/privacy": [{ label: "Dashboard", href: "/dashboard" }, { label: "Privacy Policy" }],
  "/terms": [{ label: "Dashboard", href: "/dashboard" }, { label: "Terms of Service" }],
};

function formatSegmentLabel(segment: string): string {
  return segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Normalizes Next.js document titles into clean entity labels for dynamic breadcrumb trails.
 */
export function extractCleanDocumentTitle(rawTitle: string): string | null {
  let cleaned = rawTitle.trim();

  if (!cleaned) return null;

  // Strip repeated root layout suffix and route section suffixes.
  cleaned = cleaned.replace(/(?:\s*·\s*OrGanap)+$/i, "").trim();
  cleaned = cleaned
    .replace(/\s*\|\s*(?:Campus Events|Organizations|Programs|Departments|Venues|OrGanap)$/i, "")
    .trim();
  cleaned = cleaned.replace(/^Attendance Desk:\s*/i, "").trim();

  if (!cleaned || GENERIC_TITLES.has(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Checks whether a pathname resolves to an entity detail route whose label
 * is refined from the live page metadata title.
 */
export function isDynamicBreadcrumbRoute(pathname: string): boolean {
  if (
    pathname === "/events/new" ||
    pathname === "/events" ||
    pathname === "/attendance" ||
    pathname === "/organizations" ||
    pathname === "/venues" ||
    pathname === "/departments" ||
    pathname === "/programs"
  ) {
    return false;
  }

  return (
    /^\/events\/[^/]+(?:\/edit)?$/.test(pathname) ||
    /^\/attendance\/[^/]+$/.test(pathname) ||
    /^\/organizations\/[^/]+$/.test(pathname) ||
    /^\/venues\/[^/]+$/.test(pathname) ||
    /^\/departments\/[^/]+$/.test(pathname) ||
    /^\/programs\/[^/]+$/.test(pathname)
  );
}

/**
 * Resolves a normalized App Router pathname and optional resolved entity title
 * into structured breadcrumb items rooted at Dashboard.
 */
export function resolveNavBreadcrumbs(
  pathname: string,
  dynamicLabel?: string | null,
): NavBreadcrumbItem[] {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  const staticMatch = STATIC_ROUTE_BREADCRUMBS[normalized];

  if (staticMatch) {
    return staticMatch;
  }

  const eventEditMatch = normalized.match(/^\/events\/([^/]+)\/edit$/);

  if (eventEditMatch) {
    const id = eventEditMatch[1];

    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/events" },
      { label: dynamicLabel || "Event Details", href: `/events/${id}` },
      { label: "Edit Proposal" },
    ];
  }

  if (/^\/events\/[^/]+$/.test(normalized)) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/events" },
      { label: dynamicLabel || "Event Details" },
    ];
  }

  if (/^\/attendance\/[^/]+$/.test(normalized)) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Attendance", href: "/attendance" },
      { label: dynamicLabel || "Check-In Desk" },
    ];
  }

  if (/^\/organizations\/[^/]+$/.test(normalized)) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Organizations", href: "/organizations" },
      { label: dynamicLabel || "Organization" },
    ];
  }

  if (/^\/venues\/[^/]+$/.test(normalized)) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Venues", href: "/venues" },
      { label: dynamicLabel || "Venue" },
    ];
  }

  if (/^\/departments\/[^/]+$/.test(normalized)) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Departments", href: "/departments" },
      { label: dynamicLabel || "Department" },
    ];
  }

  if (/^\/programs\/[^/]+$/.test(normalized)) {
    return [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Programs", href: "/programs" },
      { label: dynamicLabel || "Program" },
    ];
  }

  const segments = normalized.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Dashboard" }];
  }

  return [
    { label: "Dashboard", href: "/dashboard" },
    ...segments.map((segment, index) => ({
      label: formatSegmentLabel(segment),
      href: index < segments.length - 1 ? `/${segments.slice(0, index + 1).join("/")}` : undefined,
    })),
  ];
}

/**
 * Left contextual HeroUI Breadcrumbs trail displayed next to the OrGanap brand
 * in the authenticated header bar.
 */
export function NavBreadcrumbs() {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const [docTitleState, setDocTitleState] = React.useState<{
    pathname: string;
    label: string | null;
  }>({ pathname: "", label: null });

  const isDynamic = isDynamicBreadcrumbRoute(pathname);

  React.useEffect(() => {
    if (!isDynamic || typeof document === "undefined") {
      return;
    }

    const syncTitle = () => {
      setDocTitleState({
        pathname,
        label: extractCleanDocumentTitle(document.title),
      });
    };

    const rafId = window.requestAnimationFrame(syncTitle);
    const titleEl = document.querySelector("title");

    const titleObserver = new MutationObserver(() => {
      syncTitle();
    });

    if (titleEl) {
      titleObserver.observe(titleEl, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }

    const headObserver = new MutationObserver(() => {
      syncTitle();
    });

    headObserver.observe(document.head, { childList: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      titleObserver.disconnect();
      headObserver.disconnect();
    };
  }, [isDynamic, pathname]);

  const dynamicLabel =
    isDynamic && docTitleState.pathname === pathname ? docTitleState.label : null;
  const crumbs = React.useMemo(
    () => resolveNavBreadcrumbs(pathname, dynamicLabel),
    [pathname, dynamicLabel],
  );

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="hidden sm:flex items-center gap-3 min-w-0"
    >
      <Separator className="h-5 shrink-0" orientation="vertical" />
      <Breadcrumbs className="min-w-0">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const canNavigate = Boolean(crumb.href && !isLast);
          const navHref = canNavigate ? crumb.href : undefined;

          return (
            <Breadcrumbs.Item
              key={`${crumb.label}-${index}`}
              className={clsx(
                "text-xs sm:text-sm min-w-0",
                isLast ? "font-semibold text-foreground" : "text-muted",
              )}
              {...(navHref
                ? {
                    href: navHref,
                    onClick: (event) => {
                      if (
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey &&
                        event.button === 0
                      ) {
                        event.preventDefault();
                        router.push(navHref);
                      }
                    },
                  }
                : {})}
            >
              <span
                className={clsx(
                  "block truncate",
                  isLast ? "max-w-[180px] md:max-w-[260px]" : "max-w-[140px]",
                )}
              >
                {crumb.label}
              </span>
            </Breadcrumbs.Item>
          );
        })}
      </Breadcrumbs>
    </nav>
  );
}
