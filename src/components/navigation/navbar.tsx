"use client";

// OrGanap Navbar — receives hydrated user from Server Component layout
// When authenticated, pairs left contextual breadcrumbs beside branding with a right command search bar, notifications, and theme switch.
import type { AuthUser } from "@/types";

import * as React from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Chip, Drawer, useOverlayState } from "@heroui/react";
import {
  Bell,
  Building2,
  CalendarCheck2,
  CalendarRange,
  CheckCircle2,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Paperclip,
  Settings,
  ShieldAlert,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Logo } from "@/components/ui/logo";
import { createClient } from "@/utils/supabase/client";

import { CommandSearch } from "./command_search";
import { NavBreadcrumbs } from "./nav_breadcrumbs";

export const Navbar = ({
  user,
  unreadCount = 0,
}: {
  user: AuthUser | null;
  unreadCount?: number;
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const drawerState = useOverlayState({ defaultOpen: false });

  const hasPerm = (code: string) =>
    Boolean(user?.isSuperuser || user?.permissions?.includes(code));

  const authMobileSections = React.useMemo(() => {
    if (!user) return [];

    const canManageAttendance =
      user.isSuperuser ||
      user.isStaff ||
      hasPerm("attendance.verify") ||
      hasPerm("attendance.view") ||
      hasPerm("reports.view") ||
      hasPerm("reports.export");

    const canManageUsers =
      user.isSuperuser ||
      user.isStaff ||
      hasPerm("users.view") ||
      hasPerm("users.manage");

    const canManageGroups =
      user.isSuperuser ||
      user.isStaff ||
      hasPerm("groups.view") ||
      hasPerm("groups.manage");

    const sections = [
      {
        title: "Overview",
        items: [
          { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
          {
            label: "Notifications",
            href: "/notifications",
            icon: Bell,
            badge: unreadCount,
          },
        ],
      },
      {
        title: "Events",
        items: [
          { label: "Events", href: "/events", icon: CalendarCheck2 },
          { label: "My Passes", href: "/registrations", icon: Ticket },
          ...(canManageAttendance
            ? [{ label: "Attendance", href: "/attendance", icon: CheckCircle2 }]
            : []),
        ],
      },
      {
        title: "Institution",
        items: [
          { label: "Organizations", href: "/organizations", icon: Users },
          { label: "Venues", href: "/venues", icon: Building2 },
          ...(hasPerm("attachments.view")
            ? [{ label: "Attachments", href: "/attachments", icon: Paperclip }]
            : []),
          ...(hasPerm("semesters.view")
            ? [{ label: "Semesters", href: "/semesters", icon: CalendarRange }]
            : []),
          ...(hasPerm("departments.view")
            ? [{ label: "Departments", href: "/departments", icon: Landmark }]
            : []),
          ...(hasPerm("programs.view")
            ? [{ label: "Programs", href: "/programs", icon: GraduationCap }]
            : []),
        ],
      },
    ];

    const adminItems = [
      ...(canManageUsers
        ? [{ label: "Users", href: "/admin/users", icon: Users }]
        : []),
      ...(canManageGroups
        ? [{ label: "Groups", href: "/admin/groups", icon: ShieldAlert }]
        : []),
    ];

    if (adminItems.length > 0) {
      sections.push({ title: "Administration", items: adminItems });
    }

    return sections;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, unreadCount]);

  const handleMobileSignOut = async () => {
    drawerState.close();
    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const publicNavItems = [
    {
      label: "Events",
      href: "/events",
      icon: CalendarCheck2,
      active: pathname.startsWith("/events"),
    },
    {
      label: "Organizations",
      href: "/organizations",
      icon: Users,
      active: pathname.startsWith("/organizations"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md">
      <div
        className={clsx(
          "flex h-16 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6",
          user ? "w-full" : "container mx-auto max-w-7xl",
        )}
      >
        <div className={clsx("flex items-center min-w-0", user ? "gap-2 sm:gap-3 flex-1" : "gap-8")}>
          {user ? (
            <Button
              isIconOnly
              aria-label="Open navigation menu"
              className="md:hidden shrink-0"
              size="sm"
              variant="ghost"
              onPress={() => drawerState.toggle()}
            >
              <Menu size={20} />
            </Button>
          ) : null}
          <Logo />
          {user && <NavBreadcrumbs />}
          {!user && (
            <nav className="hidden md:flex items-center gap-1">
              {publicNavItems.map((item) => (
                <NextLink
                  key={item.href}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
                    item.active
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-muted hover:text-foreground hover:bg-default/15",
                  )}
                  href={item.href}
                >
                  <item.icon size={16} />
                  {item.label}
                </NextLink>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user && <CommandSearch user={user} />}
          {user && (
            <NextLink
              aria-label={
                unreadCount > 0
                  ? `Notifications (${unreadCount} unread)`
                  : "Notifications"
              }
              className="p-2 text-muted hover:text-foreground hover:bg-default/15 rounded-xl transition-colors relative"
              href="/notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </NextLink>
          )}
          <ThemeSwitch />

          {!user && (
            <>
              <div className="hidden sm:flex items-center gap-2 pl-2">
                <NextLink href="/login">
                  <Button size="sm" variant="ghost">
                    <LogIn size={15} />
                    Sign In
                  </Button>
                </NextLink>
                <NextLink href="/register">
                  <Button size="sm" variant="primary">
                    <UserPlus size={15} />
                    Register
                  </Button>
                </NextLink>
              </div>

              {/* Mobile hamburger menu toggle for public pages */}
              <Button
                aria-label="Toggle navigation menu"
                className="md:hidden"
                size="sm"
                variant="ghost"
                onClick={() => drawerState.toggle()}
              >
                <Menu size={20} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Authenticated users on < md viewports) */}
      {user ? (
        <Drawer isOpen={drawerState.isOpen} onOpenChange={drawerState.setOpen}>
          <Drawer.Backdrop variant="blur">
            <Drawer.Content placement="left">
              <Drawer.Dialog
                aria-label="Workspace Navigation"
                className="!w-[85vw] !max-w-xs !px-4 !py-5 bg-surface flex flex-col"
              >
                <Drawer.CloseTrigger onPress={() => drawerState.close()} />
                <Drawer.Header className="flex items-center justify-between border-b border-border/30 pb-3">
                  <Logo />
                </Drawer.Header>

                <Drawer.Body className="py-4 flex flex-col gap-4 overflow-y-auto flex-1">
                  <NextLink
                    className="flex flex-col gap-0.5 p-3 rounded-2xl bg-default/10 hover:bg-default/20 transition-colors"
                    href="/profile"
                    onClick={() => drawerState.close()}
                  >
                    <span className="text-sm font-semibold text-foreground truncate">
                      {user.displayName || user.email}
                    </span>
                    <span className="text-xs text-muted truncate">
                      {user.schoolId || user.email}
                    </span>
                  </NextLink>

                  <nav className="flex flex-col gap-4">
                    {authMobileSections.map((section) => (
                      <div key={section.title} className="flex flex-col gap-1">
                        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                          {section.title}
                        </span>
                        {section.items.map((item) => {
                          const isActive =
                            pathname === item.href ||
                            pathname.startsWith(item.href + "/");
                          const Icon = item.icon;

                          return (
                            <NextLink
                              key={item.href}
                              className={clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                                isActive
                                  ? "bg-accent/15 text-accent font-semibold"
                                  : "text-muted hover:text-foreground hover:bg-default/15",
                              )}
                              href={item.href}
                              onClick={() => drawerState.close()}
                            >
                              <Icon className="shrink-0" size={17} />
                              <span className="truncate flex-1">{item.label}</span>
                              {"badge" in item && item.badge && item.badge > 0 ? (
                                <Chip color="accent" size="sm" variant="soft">
                                  {item.badge > 99 ? "99+" : item.badge}
                                </Chip>
                              ) : null}
                            </NextLink>
                          );
                        })}
                      </div>
                    ))}
                  </nav>
                </Drawer.Body>

                <Drawer.Footer className="flex flex-col gap-2 pt-3 border-t border-border/30 mt-auto">
                  <NextLink
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground hover:bg-default/15 transition-colors"
                    href="/settings"
                    onClick={() => drawerState.close()}
                  >
                    <Settings size={17} />
                    Settings
                  </NextLink>
                  <Button
                    className="w-full justify-start text-danger hover:bg-danger/10"
                    size="sm"
                    variant="ghost"
                    onPress={handleMobileSignOut}
                  >
                    <LogOut size={16} />
                    Sign Out
                  </Button>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      ) : null}

      {/* Mobile Drawer (Public visitors only) */}
      {!user && (
        <Drawer state={drawerState}>
          <Drawer.Backdrop variant="blur">
            <Drawer.Content placement="right">
              <Drawer.Dialog
                aria-label="Navigation"
                className="!w-full !max-w-full sm:!w-96 sm:!max-w-md !px-4 !py-5 bg-surface"
              >
                <Drawer.CloseTrigger />
                <Drawer.Header className="flex items-center justify-between border-b border-border/30 pb-3">
                  <Logo />
                </Drawer.Header>

                <Drawer.Body className="py-4 flex flex-col gap-4">
                  <nav className="flex flex-col gap-1.5">
                    {publicNavItems.map((item) => (
                      <NextLink
                        key={item.href}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                          item.active
                            ? "bg-accent/15 text-accent font-semibold"
                            : "text-muted hover:text-foreground hover:bg-default/15",
                        )}
                        href={item.href}
                        onClick={() => drawerState.close()}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </NextLink>
                    ))}
                  </nav>
                </Drawer.Body>

                <Drawer.Footer className="flex flex-col gap-2 pt-4 border-t border-border/30 mt-auto">
                  <div className="flex flex-col gap-2">
                    <NextLink href="/login" onClick={() => drawerState.close()}>
                      <Button className="w-full" variant="ghost">
                        Sign In
                      </Button>
                    </NextLink>
                    <NextLink href="/register" onClick={() => drawerState.close()}>
                      <Button className="w-full" variant="primary">
                        Create Account
                      </Button>
                    </NextLink>
                  </div>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      )}
    </header>
  );
};
