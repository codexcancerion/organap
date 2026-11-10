// Browser-side mutations for User Management.
import type { UpdateUserProfileInput } from "@/features/users/types";

import { createClient } from "@/utils/supabase/client";

export type ServiceResult<T = void> =
  | { success: true; data?: T; error: null }
  | { success: false; data?: null; error: { message: string } };

/**
 * Update a user profile's administrative flags and basic attributes.
 */
export async function updateUserProfile(
  input: UpdateUserProfileInput,
): Promise<ServiceResult> {
  const supabase = createClient();

  type ProfilePatch = {
    display_name?: string;
    school_id?: string | null;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    updated_at: string;
  };

  const patch: ProfilePatch = {
    updated_at: new Date().toISOString(),
  };

  if (input.displayName !== undefined) patch.display_name = input.displayName.trim();
  if (input.schoolId !== undefined) patch.school_id = input.schoolId?.trim() || null;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.isStaff !== undefined) patch.is_staff = input.isStaff;
  if (input.isSuperuser !== undefined) patch.is_superuser = input.isSuperuser;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", input.userId);

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, error: null };
}

/**
 * Assign a user to a dynamic group.
 */
export async function assignUserToGroup(
  userId: string,
  groupId: string,
): Promise<ServiceResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_groups")
    .insert({
      user_id: userId,
      group_id: groupId,
    })
    .select();

  if (error && error.code !== "23505") { // Ignore unique conflict
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, error: null };
}

/**
 * Remove a user from a dynamic group.
 */
export async function removeUserFromGroup(
  userId: string,
  groupId: string,
): Promise<ServiceResult> {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_groups")
    .delete()
    .eq("user_id", userId)
    .eq("group_id", groupId);

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, error: null };
}

/**
 * Quick toggle for user account active status.
 */
export async function toggleUserActive(
  userId: string,
  isActive: boolean,
): Promise<ServiceResult> {
  return updateUserProfile({ userId, isActive });
}

/**
 * Quick toggle for user staff status.
 */
export async function toggleUserStaff(
  userId: string,
  isStaff: boolean,
): Promise<ServiceResult> {
  return updateUserProfile({ userId, isStaff });
}
