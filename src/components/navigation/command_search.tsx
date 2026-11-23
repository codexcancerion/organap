"use client";

import type { GlobalSearchResponse } from "@/app/api/search/route";
import type { AuthUser } from "@/types";
import type { LucideIcon } from "lucide-react";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  EmptyState,
  Kbd,
  Modal,
  SearchField,
  Separator,
  Spinner,
} from "@heroui/react";
import clsx from "clsx";
import {
  Bell,
  Building2,
  CalendarCheck2,
  CalendarRange,
  CheckCircle2,
  CornerDownLeft,
  FilePlus,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Paperclip,
  Search,
  Settings,
  ShieldAlert,
  Ticket,
  User,
  Users,
} from "lucide-react";

import { ProposalStatusChip } from "@/components/ui/proposal_status_chip";

export type CommandItem = {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  section: "Quick Actions" | "Navigation" | "Events" | "Organizations" | "Venues";
  icon: LucideIcon;
  keywords?: string;
  status?: string;
  badgeLabel?: string;
};

const subscribeNoop = () => () => {};

function getIsMacClient(): boolean {
  if (typeof navigator === "undefined") return false;

  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

function getIsMacServer(): boolean {
  return false;
}

/**
 * Returns permission-gated Quick Actions and Navigation entries mirroring Sidebar
 * and Dashboard role rules.
 */
export function getNavCommandItems(user: AuthUser): CommandItem[] {
  const hasPerm = (code: string) => user.isSuperuser || user.permissions.includes(code);
  const hasAnyPerm = (codes: string[]) => codes.some((code) => hasPerm(code));

  const canCreateProposals = hasPerm("proposals.create");
  const canManageAttendance =
    user.isSuperuser ||
    user.isStaff ||
    hasAnyPerm(["attendance.verify", "attendance.view", "reports.view", "reports.export"]);
  const canViewAttachments = hasPerm("attachments.view");
  const canViewSemesters = hasPerm("semesters.view");
  const canViewDepartments = hasPerm("departments.view");
  const canViewPrograms = hasPerm("programs.view");
  const canManageUsers = user.isSuperuser || user.isStaff || hasAnyPerm(["users.view", "users.manage"]);
  const canManageGroups = user.isSuperuser || user.isStaff || hasAnyPerm(["groups.view", "groups.manage"]);

  const items: CommandItem[] = [];

  if (canCreateProposals) {
    items.push({
      id: "action-new-proposal",
      label: "Draft New Proposal",
      subtitle: "Create a student organization event proposal",
      href: "/events/new",
      section: "Quick Actions",
      icon: FilePlus,
      keywords: "create proposal event new draft",
      badgeLabel: "Create",
    });
  }

  items.push(
    {
      id: "nav-dashboard",
      label: "Dashboard",
      subtitle: "Role dashboard and action queues",
      href: "/dashboard",
      section: "Navigation",
      icon: LayoutDashboard,
      keywords: "overview dashboard home kpi summary",
    },
    {
      id: "nav-notifications",
      label: "Notifications",
      subtitle: "Proposal updates and campus alerts",
      href: "/notifications",
      section: "Navigation",
      icon: Bell,
      keywords: "alerts inbox messages",
    },
    {
      id: "nav-events",
      label: "Events",
      subtitle: "Campus events catalog and calendar",
      href: "/events",
      section: "Navigation",
      icon: CalendarCheck2,
      keywords: "proposals calendar activities",
    },
    {
      id: "nav-registrations",
      label: "My Passes",
      subtitle: "Digital QR tickets and passcodes",
      href: "/registrations",
      section: "Navigation",
      icon: Ticket,
      keywords: "tickets qr registrations passes",
    },
  );

  if (canManageAttendance) {
    items.push({
      id: "nav-attendance",
      label: "Attendance",
      subtitle: "Check-in desk and CSV audit exports",
      href: "/attendance",
      section: "Navigation",
      icon: CheckCircle2,
      keywords: "check-in scanner csv export reports",
    });
  }

  items.push(
    {
      id: "nav-organizations",
      label: "Organizations",
      subtitle: "Recognized campus student organizations",
      href: "/organizations",
      section: "Navigation",
      icon: Users,
      keywords: "orgs roster officers advisers",
    },
    {
      id: "nav-venues",
      label: "Venues",
      subtitle: "Campus halls and facility schedules",
      href: "/venues",
      section: "Navigation",
      icon: Building2,
      keywords: "rooms halls facilities",
    },
  );

  if (canViewAttachments) {
    items.push({
      id: "nav-attachments",
      label: "Attachments",
      subtitle: "Institutional requirement templates",
      href: "/attachments",
      section: "Navigation",
      icon: Paperclip,
      keywords: "requirements files templates",
    });
  }

  if (canViewSemesters) {
    items.push({
      id: "nav-semesters",
      label: "Semesters",
      subtitle: "Academic term dates and registry",
      href: "/semesters",
      section: "Navigation",
      icon: CalendarRange,
      keywords: "academic terms dates",
    });
  }

  if (canViewDepartments) {
    items.push({
      id: "nav-departments",
      label: "Departments",
      subtitle: "Schools and academic departments",
      href: "/departments",
      section: "Navigation",
      icon: Landmark,
      keywords: "colleges schools academic",
    });
  }

  if (canViewPrograms) {
    items.push({
      id: "nav-programs",
      label: "Programs",
      subtitle: "Academic degree programs",
      href: "/programs",
      section: "Navigation",
      icon: GraduationCap,
      keywords: "courses degrees academic",
    });
  }

  if (canManageUsers) {
    items.push({
      id: "nav-users",
      label: "Users",
      subtitle: "Institutional accounts and status",
      href: "/admin/users",
      section: "Navigation",
      icon: Users,
      keywords: "accounts admin directory",
    });
  }

  if (canManageGroups) {
    items.push({
      id: "nav-groups",
      label: "Groups",
      subtitle: "Dynamic roles and permissions",
      href: "/admin/groups",
      section: "Navigation",
      icon: ShieldAlert,
      keywords: "rbac roles permissions admin",
    });
  }

  items.push(
    {
      id: "nav-profile",
      label: "Profile",
      subtitle: "Personal identity and memberships",
      href: "/profile",
      section: "Navigation",
      icon: User,
      keywords: "account school id avatar",
    },
    {
      id: "nav-settings",
      label: "Settings",
      subtitle: "Workspace preferences and options",
      href: "/settings",
      section: "Navigation",
      icon: Settings,
      keywords: "preferences theme sidebar",
    },
  );

  return items;
}

const EMPTY_SEARCH_RESPONSE: GlobalSearchResponse = {
  events: [],
  organizations: [],
  venues: [],
};

const SECTION_ORDER: Array<CommandItem["section"]> = [
  "Quick Actions",
  "Navigation",
  "Events",
  "Organizations",
  "Venues",
];

/**
 * Right-aligned command search trigger and Ctrl/Cmd+K modal palette inside Navbar.
 */
export function CommandSearch({ user }: { user: AuthUser }) {
  const router = useRouter();
  const isMac = React.useSyncExternalStore(subscribeNoop, getIsMacClient, getIsMacServer);
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [remoteResults, setRemoteResults] =
    React.useState<GlobalSearchResponse>(EMPTY_SEARCH_RESPONSE);

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);

    if (!open) {
      setQuery("");
      setActiveIndex(0);
      setIsLoading(false);
      setRemoteResults(EMPTY_SEARCH_RESPONSE);
    }
  }, []);

  const handleQueryChange = React.useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setActiveIndex(0);
    const trimmed = nextQuery.trim();

    if (trimmed.length < 2) {
      setIsLoading(false);
      setRemoteResults(EMPTY_SEARCH_RESPONSE);
    } else {
      setIsLoading(true);
    }
  }, []);

  // Global Cmd/Ctrl+K keyboard shortcut toggles the command search palette.
  React.useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handleOpenChange(!isOpen);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [handleOpenChange, isOpen]);

  // Debounced RLS-aware remote search query for events, organizations, and venues.
  React.useEffect(() => {
    const trimmed = query.trim();

    if (!isOpen || trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          setRemoteResults(EMPTY_SEARCH_RESPONSE);

          return;
        }

        const data = (await res.json()) as Partial<GlobalSearchResponse>;

        setRemoteResults({
          events: data.events ?? [],
          organizations: data.organizations ?? [],
          venues: data.venues ?? [],
        });
      } catch {
        if (!controller.signal.aborted) {
          setRemoteResults(EMPTY_SEARCH_RESPONSE);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, query]);

  const staticItems = React.useMemo(() => getNavCommandItems(user), [user]);
  const normalizedQuery = query.trim().toLowerCase();

  const { groupedSections, flattenedItems, indexById } = React.useMemo(() => {
    const filteredStatic = normalizedQuery
      ? staticItems.filter((item) => {
          const haystack = `${item.label} ${item.subtitle ?? ""} ${item.keywords ?? ""}`.toLowerCase();

          return haystack.includes(normalizedQuery);
        })
      : staticItems;

    const remoteItems: CommandItem[] =
      normalizedQuery.length >= 2
        ? [
            ...remoteResults.events.map((hit) => ({
              id: `event-${hit.id}`,
              label: hit.title,
              subtitle: hit.subtitle,
              href: hit.href,
              section: "Events" as const,
              icon: CalendarCheck2,
              status: hit.status,
            })),
            ...remoteResults.organizations.map((hit) => ({
              id: `org-${hit.id}`,
              label: hit.title,
              subtitle: hit.subtitle,
              href: hit.href,
              section: "Organizations" as const,
              icon: Users,
            })),
            ...remoteResults.venues.map((hit) => ({
              id: `venue-${hit.id}`,
              label: hit.title,
              subtitle: hit.subtitle,
              href: hit.href,
              section: "Venues" as const,
              icon: Building2,
            })),
          ]
        : [];

    const combined = [...filteredStatic, ...remoteItems];
    const sections = SECTION_ORDER.map((section) => ({
      section,
      items: combined.filter((item) => item.section === section),
    })).filter((group) => group.items.length > 0);
    const flat = sections.flatMap((group) => group.items);
    const ids = new Map<string, number>();

    flat.forEach((item, idx) => {
      ids.set(item.id, idx);
    });

    return { groupedSections: sections, flattenedItems: flat, indexById: ids };
  }, [normalizedQuery, remoteResults, staticItems]);

  const safeActiveIndex =
    flattenedItems.length > 0 ? Math.min(activeIndex, flattenedItems.length - 1) : -1;

  const navigateToItem = React.useCallback(
    (item: CommandItem) => {
      handleOpenChange(false);
      router.push(item.href);
    },
    [handleOpenChange, router],
  );

  const handleArrowNavigation = (event: React.KeyboardEvent<HTMLElement>) => {
    if (flattenedItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flattenedItems.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flattenedItems.length) % flattenedItems.length);
    }
  };

  const handleSearchSubmit = () => {
    const targetItem = flattenedItems[safeActiveIndex >= 0 ? safeActiveIndex : 0];

    if (targetItem) {
      navigateToItem(targetItem);
    }
  };

  return (
    <>
      {/* Desktop right-aligned search bar trigger */}
      <Button
        aria-label="Open command search"
        className="hidden sm:inline-flex w-52 lg:w-64 justify-between gap-2 px-3 text-muted hover:text-foreground border border-border/50"
        size="sm"
        variant="tertiary"
        onPress={() => handleOpenChange(true)}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Search className="shrink-0" size={14} />
          <span className="text-xs font-normal truncate">Search OrGanap...</span>
        </span>
        <Kbd className="shrink-0" variant="light">
          <Kbd.Abbr keyValue={isMac ? "command" : "ctrl"} />
          <Kbd.Content>K</Kbd.Content>
        </Kbd>
      </Button>

      {/* Mobile icon search trigger */}
      <Button
        isIconOnly
        aria-label="Open command search"
        className="sm:hidden text-muted hover:text-foreground"
        size="sm"
        variant="ghost"
        onPress={() => handleOpenChange(true)}
      >
        <Search size={18} />
      </Button>

      <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Modal.Backdrop variant="blur">
          <Modal.Container placement="top" size="md">
            <Modal.Dialog
              aria-label="Command Search"
              className="p-0 overflow-hidden bg-surface border border-border/50"
            >
              <div
                className="flex flex-col w-full"
                onKeyDown={(event) => {
                  if (!(event.target instanceof HTMLInputElement)) {
                    handleArrowNavigation(event);
                  }
                }}
              >
                <div className="p-3 border-b border-border/30">
                  <SearchField
                    aria-label="Search commands, events, organizations, or venues"
                    className="w-full"
                    name="command-search"
                    value={query}
                    onChange={handleQueryChange}
                    onKeyDown={handleArrowNavigation}
                    onSubmit={handleSearchSubmit}
                  >
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input
                        autoFocus
                        placeholder="Search routes, events, orgs, or venues..."
                      />
                      {isLoading ? (
                        <Spinner className="mr-2" size="sm" />
                      ) : (
                        <SearchField.ClearButton />
                      )}
                    </SearchField.Group>
                  </SearchField>
                </div>

                <div className="max-h-96 overflow-y-auto p-2 flex flex-col gap-3">
                  {groupedSections.length === 0 ? (
                    <div className="py-10 px-4">
                      <EmptyState className="flex flex-col items-center text-center gap-1.5">
                        <Search className="text-muted/60" size={24} />
                        <p className="text-sm font-medium text-foreground">
                          {isLoading ? "Searching campus records..." : "No matching results"}
                        </p>
                        <p className="text-xs text-muted">
                          {normalizedQuery.length < 2
                            ? "Type at least 2 characters to search events, organizations, and venues."
                            : "Try another event title, organization acronym, or route name."}
                        </p>
                      </EmptyState>
                    </div>
                  ) : (
                    groupedSections.map((group) => (
                      <div key={group.section} className="flex flex-col gap-1">
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                          {group.section}
                        </span>
                        <div className="flex flex-col gap-0.5" role="listbox">
                          {group.items.map((item) => {
                            const itemIndex = indexById.get(item.id) ?? 0;
                            const isSelected = itemIndex === safeActiveIndex;
                            const Icon = item.icon;

                            return (
                              <button
                                key={item.id}
                                aria-selected={isSelected}
                                className={clsx(
                                  "flex items-center justify-between gap-3 w-full px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer",
                                  isSelected
                                    ? "bg-accent/15 text-foreground"
                                    : "text-foreground/90 hover:bg-default/15",
                                )}
                                role="option"
                                type="button"
                                onClick={() => navigateToItem(item)}
                                onMouseEnter={() => setActiveIndex(itemIndex)}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={clsx(
                                      "p-1.5 rounded-lg shrink-0",
                                      isSelected
                                        ? "bg-accent/20 text-accent"
                                        : "bg-default/20 text-muted",
                                    )}
                                  >
                                    <Icon size={15} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {item.label}
                                    </div>
                                    {item.subtitle ? (
                                      <div className="text-xs text-muted truncate">
                                        {item.subtitle}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {item.status ? (
                                    <ProposalStatusChip status={item.status} />
                                  ) : item.badgeLabel ? (
                                    <Chip color="accent" size="sm" variant="soft">
                                      {item.badgeLabel}
                                    </Chip>
                                  ) : null}
                                  {isSelected ? (
                                    <CornerDownLeft className="text-muted" size={14} />
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Separator />
                <div className="px-3 py-2 flex items-center justify-between text-[11px] text-muted bg-surface/60">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Kbd variant="light">
                        <Kbd.Abbr keyValue="up" />
                      </Kbd>
                      <Kbd variant="light">
                        <Kbd.Abbr keyValue="down" />
                      </Kbd>
                      <span>Navigate</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Kbd variant="light">
                        <Kbd.Abbr keyValue="enter" />
                      </Kbd>
                      <span>Open</span>
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1">
                    <Kbd variant="light">
                      <Kbd.Content>Esc</Kbd.Content>
                    </Kbd>
                    <span>Close</span>
                  </span>
                </div>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
