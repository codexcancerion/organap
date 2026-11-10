"use client";

import type { NotificationItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Card,
  Button,
  toast,
} from "@heroui/react";
import {
  CheckCheck,
  ExternalLink,
  Inbox,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification_services";

export type NotificationListProps = {
  notifications: NotificationItem[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [isPending, startTransition] = React.useTransition();

  const items = React.useMemo(() => {
    return notifications.map((n) => ({
      ...n,
      isRead: n.isRead || readIds.has(n.id),
    }));
  }, [notifications, readIds]);

  const unreadCount = items.filter((n) => !n.isRead).length;

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
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs text-muted">
          {unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "All caught up"}
        </span>
        {unreadCount > 0 && (
          <Button
            isDisabled={isPending}
            size="sm"
            variant="ghost"
            onPress={handleMarkAllRead}
          >
            <CheckCheck size={14} />
            Mark all as read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="border border-divider bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/20 text-muted mb-4">
            <Inbox size={24} />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No notifications
          </h3>
          <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
            You will receive notifications here regarding proposal reviews, event approvals, registration confirmations, and venue announcements.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`p-4 border transition-colors ${
                n.isRead
                  ? "border-divider bg-card/50"
                  : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                      n.isRead ? "bg-transparent" : "bg-primary animate-pulse"
                    }`}
                  />
                  <div className="flex flex-col gap-1">
                    <h4
                      className={`text-sm ${
                        n.isRead
                          ? "font-medium text-foreground"
                          : "font-semibold text-foreground"
                      }`}
                    >
                      {n.title}
                    </h4>
                    <p className="text-xs text-muted whitespace-pre-wrap">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                      {n.link && (
                        <NextLink
                          className="text-primary hover:underline flex items-center gap-1 font-medium"
                          href={n.link}
                        >
                          View Details
                          <ExternalLink size={10} />
                        </NextLink>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <Button
                    className="text-xs shrink-0"
                    isDisabled={isPending}
                    size="sm"
                    variant="ghost"
                    onPress={() => handleMarkAsRead(n.id)}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
