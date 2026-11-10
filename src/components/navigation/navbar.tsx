"use client";

// OrGanap Navbar — receives hydrated user from Server Component layout
import type { AuthUser } from "@/types";

import * as React from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, Chip, Drawer, useOverlayState, Avatar } from "@heroui/react";
import {
  Menu,
  LayoutDashboard,
  FileText,
  CalendarCheck2,
  Users,
  CheckCircle2,
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Logo } from "@/components/ui/logo";
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

export const Navbar = ({ user }: { user: AuthUser | null }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const drawerState = useOverlayState({ defaultOpen: false });

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
      authOnly: true,
    },
    {
      label: "Events",
      href: "/events",
      icon: CalendarCheck2,
      active: pathname.startsWith("/events"),
      authOnly: false,
    },
    {
      label: "Proposals",
      href: "/proposals",
      icon: FileText,
      active: pathname.startsWith("/proposals"),
      authOnly: true,
    },
    {
      label: "Organizations",
      href: "/organizations",
      icon: Users,
      active: pathname.startsWith("/organizations"),
      authOnly: false,
    },
    {
      label: "Attendance",
      href: "/attendance",
      icon: CheckCircle2,
      active: pathname.startsWith("/attendance"),
      authOnly: true,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const visibleNavItems = navItems.filter((item) => (item.authOnly ? Boolean(user) : true));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden md:flex items-center gap-1">
            {visibleNavItems.map((item) => (
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
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitch />

          {user ? (
            <div className="hidden sm:flex items-center gap-3 pl-2">
              <NextLink
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-default/20 transition-colors"
                href="/profile"
              >
                <Avatar className="w-8 h-8 text-xs font-bold" variant="soft">
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
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground line-clamp-1">
                    {user.displayName || user.email.split("@")[0]}
                  </span>
                  <span className="text-[10px] text-muted capitalize">
                    {user.isSuperuser
                      ? "Superuser"
                      : user.groups?.[0] || (user.isStaff ? "Staff" : "Member")}
                  </span>
                </div>
              </NextLink>
              <Button
                aria-label="Sign out"
                size="sm"
                variant="ghost"
                onClick={handleSignOut}
              >
                <LogOut size={16} />
              </Button>
            </div>
          ) : (
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
          )}

          {/* Mobile hamburger menu toggle */}
          <Button
            aria-label="Toggle navigation menu"
            className="md:hidden"
            size="sm"
            variant="ghost"
            onClick={() => drawerState.toggle()}
          >
            <Menu size={20} />
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer state={drawerState}>
        <Drawer.Backdrop variant="blur">
          <Drawer.Content placement="right">
            <Drawer.Dialog
              aria-label={user ? "OrGanap Navigation" : "Navigation"}
              className="!w-full !max-w-full sm:!w-96 sm:!max-w-md !px-4 !py-5 bg-surface"
            >
              <Drawer.CloseTrigger />
              <Drawer.Header className="flex items-center justify-between border-b border-border/30 pb-3">
                <Logo />
              </Drawer.Header>

              <Drawer.Body className="py-4 flex flex-col gap-4">
                {user ? (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-default/15 border border-border/20">
                    <Avatar className="w-10 h-10 text-sm font-bold" variant="soft">
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
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {user.displayName || user.email.split("@")[0]}
                      </span>
                      <span className="text-xs text-muted">
                        {user.email}
                      </span>
                      <Chip className="mt-1" size="sm" variant="soft">
                        {user.isSuperuser
                          ? "SUPERUSER"
                          : (user.groups?.[0] || (user.isStaff ? "STAFF" : "MEMBER")).toUpperCase()}
                      </Chip>
                    </div>
                  </div>
                ) : null}

                <nav className="flex flex-col gap-1.5">
                  {visibleNavItems.map((item) => (
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
                {user ? (
                  <>
                    <NextLink
                      className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm text-muted hover:text-foreground"
                      href="/profile"
                      onClick={() => drawerState.close()}
                    >
                      <User size={18} />
                      Profile
                    </NextLink>
                    <NextLink
                      className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm text-muted hover:text-foreground"
                      href="/settings"
                      onClick={() => drawerState.close()}
                    >
                      <Settings size={18} />
                      Settings
                    </NextLink>
                    <Button
                      className="w-full mt-2"
                      variant="danger"
                      onClick={() => {
                        drawerState.close();
                        void handleSignOut();
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </Button>
                  </>
                ) : (
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
                )}
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </header>
  );
};
