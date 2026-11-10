"use server";

import type { ServiceResult } from "@/types/domain";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<ServiceResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      data: null,
      error: { message: "Authentication required" },
    };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      data: null,
      error: { message: error.message },
    };
  }

  revalidatePath("/notifications");

  return { success: true, data: undefined, error: null };
}

/**
 * Mark all notifications as read for current user.
 */
export async function markAllNotificationsAsRead(): Promise<ServiceResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      data: null,
      error: { message: "Authentication required" },
    };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return {
      success: false,
      data: null,
      error: { message: error.message },
    };
  }

  revalidatePath("/notifications");

  return { success: true, data: undefined, error: null };
}
