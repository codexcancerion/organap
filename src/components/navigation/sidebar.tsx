"use client";

// Dynamic navigation sidebar for OrGanap (Django-style RBAC).
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import { Avatar } from "@heroui/react";
import {
  LayoutDashboard,
  FileText,
  CalendarCheck2,
  Users,
  CheckCircle2,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
} from "lucide-react";
import clsx from "clsx";

import { useAuth } from "@/contexts/auth_context";

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

export function Sidebar() {
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

  const canManageVenues = isSuperuser || hasPermission("venues.view");
  const canViewReports = isSuperuser || hasPermission("reports.view");
  const canManageUsers = isSuperuser || hasPermission("users.view") || hasPermission("users.manage");
  const canManageGroups = isSuperuser || hasPermission("groups.view") || hasPermission("groups.manage");

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard, match: "/dashboard" },
    { label: "Proposals", href: "/proposals", icon: FileText, match: "/proposals" },
    { label: "Approved Events", href: "/events", icon: CalendarCheck2, match: "/events" },
    { label: "Organizations", href: "/organizations", icon: Users, match: "/organizations" },
    { label: "Attendance", href: "/attendance", icon: CheckCircle2, match: "/attendance" },
  ];

  const adminItems = [
    ...(canManageUsers
      ? [{ label: "User Directory", href: "/admin/users", icon: Users, match: "/admin/users" }]
      : []),
    ...(canManageGroups
      ? [{ label: "Groups & Perms", href: "/admin/groups", icon: ShieldAlert, match: "/admin/groups" }]
      : []),
    ...(canManageVenues
      ? [{ label: "Venues", href: "/admin/venues", icon: Building2, match: "/admin/venues" }]
      : []),
    ...(canViewReports
      ? [{ label: "Reports", href: "/admin/reports", icon: BarChart3, match: "/admin/reports" }]
      : []),
  ];

  return (
    <aside
      className={clsx(
        "hidden md:flex flex-col shrink-0 sticky top-20 h-[calc(100vh-6rem)] bg-surface border border-border/40 rounded-3xl overflow-hidden transition-all duration-300 shadow-sm",
        isCollapsed ? "w-18" : "w-64",
      )}
    >
      {/* ── User Header Block (Profile Action + Sign Out) ────── */}
      <div className="p-3 border-b border-border/30">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-1">
            <NextLink
              className="flex items-center gap-3 p-1 rounded-2xl hover:bg-default/15 transition-colors group flex-1 min-w-0"
              href="/profile"
              title="View Profile"
            >
              <Avatar className="w-9 h-9 text-xs font-bold shrink-0" variant="soft">
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
                <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-muted truncate">
                    {user?.schoolId || user?.email}
                  </span>
                  {isSuperuser ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-danger/10 text-danger border border-danger/20 shrink-0">
                      Superuser
                    </span>
                  ) : isStaff ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                      Staff
                    </span>
                  ) : null}
                </div>
              </div>
            </NextLink>

            <button
              aria-label="Sign out"
              className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Sign Out"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <NextLink
              className="p-1 rounded-2xl hover:bg-default/15 transition-colors flex items-center justify-center"
              href="/profile"
              title={user?.displayName || user?.email || "Profile"}
            >
              <Avatar className="w-9 h-9 text-xs font-bold shrink-0" variant="soft">
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
              className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
              type="button"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      <div
        className="flex flex-col justify-between flex-1 p-3 overflow-y-auto scrollbar-none no-scrollbar"
        data-scrollbar="none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.match || pathname.startsWith(item.match + "/");

            return (
              <NextLink
                key={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-muted hover:text-foreground hover:bg-default/15",
                  isCollapsed && "justify-center px-0",
                )}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                {!isCollapsed ? <span>{item.label}</span> : null}
              </NextLink>
            );
          })}

          {adminItems.length > 0 ? (
            <>
              <div className="my-2 border-t border-border/30" />
              {!isCollapsed ? (
                <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                  Administration
                </span>
              ) : null}
              {adminItems.map((item) => {
                const isActive = pathname.startsWith(item.match);

                return (
                  <NextLink
                    key={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent/15 text-accent font-semibold"
                        : "text-muted hover:text-foreground hover:bg-default/15",
                      isCollapsed && "justify-center px-0",
                    )}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon size={18} />
                    {!isCollapsed ? <span>{item.label}</span> : null}
                  </NextLink>
                );
              })}
            </>
          ) : null}
        </div>

        <div className="pt-2 border-t border-border/30">
          <NextLink
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-foreground hover:bg-default/15 transition-colors",
              isCollapsed && "justify-center px-0",
            )}
            href="/settings"
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings size={18} />
            {!isCollapsed ? <span>Settings</span> : null}
          </NextLink>
        </div>
      </div>

      {/* ── Footer containing only the Collapser ──────────── */}
      <div className="p-2 sm:p-3 border-t border-border/30 bg-surface/50 flex items-center justify-end">
        {!isCollapsed ? (
          <button
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-xl hover:bg-default/20 text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Collapse sidebar"
            type="button"
            onClick={handleToggle}
          >
            <PanelLeftClose size={17} />
          </button>
        ) : (
          <button
            aria-label="Expand sidebar"
            className="p-1.5 rounded-xl hover:bg-default/20 text-muted hover:text-foreground transition-colors cursor-pointer mx-auto"
            title="Expand sidebar"
            type="button"
            onClick={handleToggle}
          >
            <PanelLeftOpen size={17} />
          </button>
        )}
      </div>
    </aside>
  );
}
