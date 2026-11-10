"use client";

// Dynamic navigation sidebar for OrGanap (Django-style RBAC).
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import { Avatar, Chip } from "@heroui/react";
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
  User,
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

  const primaryBadge = isSuperuser
    ? "Superuser"
    : user?.groups?.[0] || (isStaff ? "Staff" : "Member");

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
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Navigation
            </span>
            <Chip size="sm" variant="soft">
              {primaryBadge}
            </Chip>
          </div>
        ) : null}
        <button
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1.5 rounded-xl hover:bg-default/20 text-muted hover:text-foreground transition-colors mx-auto"
          type="button"
          onClick={handleToggle}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
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

        <div className="flex flex-col gap-2 pt-3 border-t border-border/30">
          <NextLink
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted hover:text-foreground hover:bg-default/15 transition-colors",
              isCollapsed && "justify-center px-0",
            )}
            href="/profile"
            title={isCollapsed ? "Profile" : undefined}
          >
            <User size={18} />
            {!isCollapsed ? <span>Profile</span> : null}
          </NextLink>
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

          {!isCollapsed && user ? (
            <div className="flex items-center justify-between p-2 mt-2 rounded-2xl bg-default/10 border border-border/20">
              <div className="flex items-center gap-2 overflow-hidden">
                <Avatar className="w-8 h-8 text-xs font-bold shrink-0" variant="soft">
                  {user.avatarUrl ? (
                    <Avatar.Image
                      alt={user.displayName ?? user.email}
                      className="object-cover"
                      src={user.avatarUrl}
                    />
                  ) : null}
                  <Avatar.Fallback>
                    {initialsFor(user.displayName, user.email)}
                  </Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-muted truncate">
                    {user.schoolId || user.email}
                  </span>
                </div>
              </div>
              <button
                aria-label="Sign out"
                className="p-1 text-muted hover:text-danger transition-colors cursor-pointer"
                type="button"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              aria-label="Sign out"
              className={clsx(
                "flex items-center gap-3 p-2 text-muted hover:text-danger rounded-xl hover:bg-default/15 transition-colors cursor-pointer",
                isCollapsed && "justify-center",
              )}
              type="button"
              onClick={handleSignOut}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
