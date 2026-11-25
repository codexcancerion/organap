"use client";

import type { NotificationItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  SearchField,
  toast,
} from "@heroui/react";
import {
  CheckCheck,
  Clock,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { CatalogFilterDropdown } from "@/components/ui/catalog_filter_dropdown";

import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification_services";

export type NotificationListProps = {
  notifications: NotificationItem[];
};

type NotificationTab = "all" | "unread";

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<NotificationTab>("all");
  const [isPending, startTransition] = React.useTransition();

  const items = React.useMemo(() => {
    return notifications.map((n) => ({
      ...n,
      isRead: n.isRead || readIds.has(n.id),
    }));
  }, [notifications, readIds]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter((n) => {
      if (tab === "unread" && n.isRead) return false;
      if (!q) return true;

      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    });
  }, [items, search, tab]);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      setReadIds((prev) => new Set(prev).add(id));
      const res = await markNotificationAsRead(id);

      if (!res.success) {
        toast.danger(res.error.message);
      } else {
        router.refresh();
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      setReadIds(new Set(notifications.map((n) => n.id)));
      const res = await markAllNotificationsAsRead();

      if (!res.success) {
        toast.danger(res.error.message);
      } else {
        toast.success("All notifications marked as read");
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search notifications"
          className="w-full md:w-80"
          name="notification-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search notifications…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <div className="flex flex-wrap items-center gap-2.5">
          <CatalogFilterDropdown
            className="w-full sm:w-56"
            filters={[
              {
                id: "status",
                label: "Status",
                ariaLabel: "Filter notifications",
                value: tab,
                onChange: (val) => setTab(val as NotificationTab),
                options: [
                  { id: "all", label: `All Notifications (${items.length})` },
                  { id: "unread", label: `Unread Only (${unreadCount})` },
                ],
              },
            ]}
          />

          {unreadCount > 0 ? (
            <Button
              isDisabled={isPending}
              size="md"
              variant="secondary"
              onPress={handleMarkAllRead}
            >
              <CheckCheck size={14} />
              Mark all read
            </Button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border border-dashed border-border/60 bg-surface p-10 text-center items-center">
          <EmptyState className="flex flex-col items-center text-center gap-2">
            <Inbox className="text-muted size-10" />
            <h3 className="text-base font-semibold text-foreground">
              {items.length === 0
                ? "No Notifications Yet"
                : tab === "unread" && unreadCount === 0
                  ? "All Caught Up"
                  : "No Matching Notifications"}
            </h3>
            <p className="text-xs text-muted max-w-sm">
              {items.length === 0
                ? "You will receive notifications here regarding proposal reviews, event approvals, registration confirmations, and venue announcements."
                : tab === "unread" && unreadCount === 0
                  ? "You have read every notification in your inbox."
                  : "Try adjusting your search query."}
            </p>
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={`p-4 border transition-colors ${
                n.isRead
                  ? "border-border/30 bg-surface"
                  : "border-accent/40 bg-accent/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      n.isRead ? "bg-transparent" : "bg-accent animate-pulse"
                    }`}
                  />
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm ${
                          n.isRead
                            ? "font-medium text-foreground"
                            : "font-semibold text-foreground"
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead ? (
                        <Chip color="accent" size="sm" variant="soft">
                          New
                        </Chip>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted whitespace-pre-wrap">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                      {n.link ? (
                        <NextLink
                          className="text-accent hover:underline flex items-center gap-1 font-medium"
                          href={n.link}
                        >
                          View Details
                          <ExternalLink size={10} />
                        </NextLink>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!n.isRead ? (
                  <Button
                    className="text-xs shrink-0"
                    isDisabled={isPending}
                    size="sm"
                    variant="ghost"
                    onPress={() => handleMarkAsRead(n.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
