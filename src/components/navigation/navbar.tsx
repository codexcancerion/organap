"use client";

// OrGanap Navbar — receives hydrated user from Server Component layout
// When authenticated, pairs left contextual breadcrumbs beside branding with a right command search bar, notifications, and theme switch.
import type { AuthUser } from "@/types";

import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Button, Drawer, useOverlayState } from "@heroui/react";
import {
  Menu,
  CalendarCheck2,
  Users,
  LogIn,
  UserPlus,
  Bell,
} from "lucide-react";
import clsx from "clsx";

import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Logo } from "@/components/ui/logo";

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
  const drawerState = useOverlayState({ defaultOpen: false });

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
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div
        className={clsx(
          "flex h-16 items-center justify-between gap-4 px-4 sm:px-6",
          user ? "w-full" : "container mx-auto max-w-7xl",
        )}
      >
        <div className={clsx("flex items-center min-w-0", user ? "gap-3 flex-1" : "gap-8")}>
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

        <div className="flex items-center gap-2 shrink-0">
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
