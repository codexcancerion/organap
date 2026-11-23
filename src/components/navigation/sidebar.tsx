"use client";

// Dynamic navigation sidebar for OrGanap (Django-style RBAC).
import type { LucideIcon } from "lucide-react";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import { Avatar, Chip } from "@heroui/react";
import {
  LayoutDashboard,
  CalendarCheck2,
  CalendarRange,
  Users,
  CheckCircle2,
  Building2,
  Landmark,
  GraduationCap,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Ticket,
  Bell,
  Paperclip,
} from "lucide-react";
import clsx from "clsx";

import { useAuth } from "@/contexts/auth_context";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match: string;
  badge?: number;
};

function initialsFor(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();

    return name.slice(0, 2).toUpperCase();
  }
  if (!email) return "?";
  const [local] = email.split("@");

  return (local || "U").slice(0, 2).toUpperCase();
}

function SidebarNavLink({
  item,
  pathname,
  isCollapsed,
}: {
  item: NavItem;
  pathname: string;
  isCollapsed: boolean;
}) {
  const isActive = pathname === item.match || pathname.startsWith(item.match + "/");
  const Icon = item.icon;

  return (
    <NextLink
      className={clsx(
        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
        isActive
          ? "bg-accent/15 text-accent font-semibold"
          : "text-muted hover:text-foreground hover:bg-default/15",
        isCollapsed && "justify-center px-0",
      )}
      href={item.href}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className="shrink-0" size={16} />
      {!isCollapsed ? (
        <span className="truncate flex-1">{item.label}</span>
      ) : null}
      {!isCollapsed && item.badge && item.badge > 0 ? (
        <Chip className="text-[10px] px-1.5 h-5" color="accent" size="sm" variant="soft">
          {item.badge > 99 ? "99+" : item.badge}
        </Chip>
      ) : null}
    </NextLink>
  );
}

export function Sidebar({ unreadCount = 0 }: { unreadCount?: number } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, isStaff, isSuperuser, hasPermission } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("organap-sidebar-collapsed");

    if (stored === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(true);
    }

    const handlePreferenceSync = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;

      if (typeof detail === "boolean") {
        setIsCollapsed(detail);
      }
    };

    window.addEventListener("organap:sidebar-collapse", handlePreferenceSync);

    return () => {
      window.removeEventListener("organap:sidebar-collapse", handlePreferenceSync);
    };
  }, []);

  const handleToggle = () => {
    const nextState = !isCollapsed;

    setIsCollapsed(nextState);
    localStorage.setItem("organap-sidebar-collapsed", String(nextState));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const canViewSemesters = isSuperuser || hasPermission("semesters.view");
  const canViewDepartments = isSuperuser || hasPermission("departments.view");
  const canViewPrograms = isSuperuser || hasPermission("programs.view");
  const canViewAttachments = isSuperuser || hasPermission("attachments.view");

  const canManageUsers = isSuperuser || isStaff || hasPermission("users.view") || hasPermission("users.manage");
  const canManageGroups = isSuperuser || isStaff || hasPermission("groups.view") || hasPermission("groups.manage");
  const canManageAttendance =
    isSuperuser ||
    isStaff ||
    hasPermission("attendance.verify") ||
    hasPermission("attendance.view") ||
    hasPermission("reports.view") ||
    hasPermission("reports.export");

  // Ungrouped top items: Dashboard, Notifications
  const topItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, match: "/dashboard" },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      match: "/notifications",
      badge: unreadCount,
    },
  ];

  // EVENTS: Events, My Passes, and permission-gated Attendance (unifies check-in desk & attendance audit reports)
  const eventsItems: NavItem[] = [
    { label: "Events", href: "/events", icon: CalendarCheck2, match: "/events" },
    { label: "My Passes", href: "/registrations", icon: Ticket, match: "/registrations" },
    ...(canManageAttendance
      ? [{ label: "Attendance", href: "/attendance", icon: CheckCircle2, match: "/attendance" }]
      : []),
  ];

  // INSTITUTION: Organizations, Venues, plus permission-gated Attachments, Semesters, Departments, Programs
  // WHY: Attachments live in Institution alongside Venues and Semesters rather than Events or Administration because attachment types act as shared institutional policy catalogs across event cycles.
  const institutionItems: NavItem[] = [
    { label: "Organizations", href: "/organizations", icon: Users, match: "/organizations" },
    { label: "Venues", href: "/venues", icon: Building2, match: "/venues" },
    ...(canViewAttachments
      ? [{ label: "Attachments", href: "/attachments", icon: Paperclip, match: "/attachments" }]
      : []),
    ...(canViewSemesters
      ? [{ label: "Semesters", href: "/semesters", icon: CalendarRange, match: "/semesters" }]
      : []),
    ...(canViewDepartments
      ? [{ label: "Departments", href: "/departments", icon: Landmark, match: "/departments" }]
      : []),
    ...(canViewPrograms
      ? [{ label: "Programs", href: "/programs", icon: GraduationCap, match: "/programs" }]
      : []),
  ];

  // ADMINISTRATION: Users, Groups (Settings lives once in the pinned utility footer; Reports is unified into Attendance)
  const adminItems: NavItem[] = [
    ...(canManageUsers
      ? [{ label: "Users", href: "/admin/users", icon: Users, match: "/admin/users" }]
      : []),
    ...(canManageGroups
      ? [{ label: "Groups", href: "/admin/groups", icon: ShieldAlert, match: "/admin/groups" }]
      : []),
  ];

  const settingsItem: NavItem = {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    match: "/settings",
  };

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col shrink-0 sticky top-20 h-[calc(100vh-6rem)] bg-surface border border-border/40 rounded-3xl overflow-hidden transition-all duration-300 shadow-sm",
        isCollapsed ? "w-16" : "w-60",
      )}
    >
      {/* ── User Header Block (Profile Action + Sign Out) ────── */}
      <div className="p-2.5 border-b border-border/30">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-1">
            <NextLink
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-default/15 transition-colors group flex-1 min-w-0"
              href="/profile"
              title="View Profile"
            >
              <Avatar className="w-8 h-8 text-[11px] font-bold shrink-0" variant="soft">
                {user?.avatarUrl ? (
                  <Avatar.Image
                    alt={user.displayName ?? user.email}
                    className="object-cover"
                    src={user.avatarUrl}
                  />
                ) : null}
                <Avatar.Fallback className="bg-primary/10 text-primary">
                  {initialsFor(user?.displayName, user?.email)}
                </Avatar.Fallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px] text-muted truncate">
                    {user?.schoolId || user?.email}
                  </span>
                  {isSuperuser ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 leading-none rounded bg-danger/10 text-danger border border-danger/20 shrink-0">
                      Superuser
                    </span>
                  ) : isStaff ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 leading-none rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                      Staff
                    </span>
                  ) : null}
                </div>
              </div>
            </NextLink>

            <button
              aria-label="Sign out"
              className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Sign Out"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <NextLink
              className="p-0.5 rounded-xl hover:bg-default/15 transition-colors flex items-center justify-center"
              href="/profile"
              title={user?.displayName || user?.email || "Profile"}
            >
              <Avatar className="w-8 h-8 text-[11px] font-bold shrink-0" variant="soft">
                {user?.avatarUrl ? (
                  <Avatar.Image
                    alt={user.displayName ?? user.email}
                    className="object-cover"
                    src={user.avatarUrl}
                  />
                ) : null}
                <Avatar.Fallback className="bg-primary/10 text-primary">
                  {initialsFor(user?.displayName, user?.email)}
                </Avatar.Fallback>
              </Avatar>
            </NextLink>

            <button
              aria-label="Sign out"
              className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

      <div
        className="flex flex-col justify-between flex-1 px-2 py-2 overflow-y-auto scrollbar-none no-scrollbar"
        data-scrollbar="none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex flex-col gap-0.5">
          {/* ── Top Core Items ── */}
          {topItems.map((item) => (
            <SidebarNavLink
              key={item.href}
              isCollapsed={isCollapsed}
              item={item}
              pathname={pathname}
            />
          ))}

          {/* ── EVENTS Group ── */}
          <div className="my-1 border-t border-border/25" />
          {!isCollapsed ? (
            <span className="px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted/80">
              Events
            </span>
          ) : null}
          {eventsItems.map((item) => (
            <SidebarNavLink
              key={item.href}
              isCollapsed={isCollapsed}
              item={item}
              pathname={pathname}
            />
          ))}

          {/* ── INSTITUTION Group ── */}
          <div className="my-1 border-t border-border/25" />
          {!isCollapsed ? (
            <span className="px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted/80">
              Institution
            </span>
          ) : null}
          {institutionItems.map((item) => (
            <SidebarNavLink
              key={item.href}
              isCollapsed={isCollapsed}
              item={item}
              pathname={pathname}
            />
          ))}

          {/* ── ADMINISTRATION Group ── */}
          {adminItems.length > 0 ? (
            <>
              <div className="my-1 border-t border-border/25" />
              {!isCollapsed ? (
                <span className="px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                  Administration
                </span>
              ) : null}
              {adminItems.map((item) => (
                <SidebarNavLink
                  key={item.href}
                  isCollapsed={isCollapsed}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </>
          ) : null}
        </div>

        <div className="pt-1.5 mt-1 border-t border-border/30">
          <SidebarNavLink
            isCollapsed={isCollapsed}
            item={settingsItem}
            pathname={pathname}
          />
        </div>
      </div>

      {/* ── Footer containing only the Collapser ──────────── */}
      <div className="px-2 py-1.5 border-t border-border/30 bg-surface/50 flex items-center justify-end">
        {!isCollapsed ? (
          <button
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-lg hover:bg-default/20 text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Collapse sidebar"
            type="button"
            onClick={handleToggle}
          >
            <PanelLeftClose size={16} />
          </button>
        ) : (
          <button
            aria-label="Expand sidebar"
            className="p-1.5 rounded-lg hover:bg-default/20 text-muted hover:text-foreground transition-colors cursor-pointer mx-auto"
            title="Expand sidebar"
            type="button"
            onClick={handleToggle}
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
