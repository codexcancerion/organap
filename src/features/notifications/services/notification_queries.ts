// Server-side data queries for In-App Notifications (FR-11).
import type { NotificationItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetch all notifications for the given user, ordered newest first.
 */
export const getUserNotifications = cache(async (
  userId: string,
  limit = 50
): Promise<NotificationItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, link, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch user notifications:", error.message);

    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
});

/**
 * Get count of unread notifications for a user.
 */
export const getUnreadNotificationCount = cache(async (
  userId: string
): Promise<number> => {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Failed to count unread notifications:", error.message);

    return 0;
  }

  return count ?? 0;
});
