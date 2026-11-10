// Browser-side mutations for Groups and Permissions feature.
import type {
  CreateGroupInput,
  ToggleGroupPermissionInput,
  UpdateGroupInput,
} from "@/features/groups/types";

import { isProtectedSystemGroup } from "@/features/groups/types";
import { createClient } from "@/utils/supabase/client";

export type ServiceResult<T = void> =
  | { success: true; data?: T; error: null }
  | { success: false; data?: null; error: { message: string } };

/**
 * Create a new dynamic group.
 */
export async function createGroup(input: CreateGroupInput): Promise<ServiceResult<{ id: string }>> {
  const supabase = createClient();
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    return { success: false, data: null, error: { message: "Group name is required." } };
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name: trimmedName,
      description: input.description?.trim() || null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: { id: data.id }, error: null };
}

/**
 * Update an existing group's name and description.
 */
export async function updateGroup(input: UpdateGroupInput): Promise<ServiceResult> {
  const supabase = createClient();
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    return { success: false, data: null, error: { message: "Group name is required." } };
  }

  const { error } = await supabase
    .from("groups")
    .update({
      name: trimmedName,
      description: input.description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.groupId);

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, error: null };
}

/**
 * Delete a custom group. Protected system groups cannot be deleted.
 */
export async function deleteGroup(groupId: string, groupName: string): Promise<ServiceResult> {
  if (isProtectedSystemGroup(groupName)) {
    return {
      success: false,
      data: null,
      error: { message: `System group "${groupName}" is protected and cannot be deleted.` },
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, error: null };
}

/**
 * Toggle a single permission for a group (grant or revoke).
 */
export async function toggleGroupPermission(input: ToggleGroupPermissionInput): Promise<ServiceResult> {
  const supabase = createClient();

  if (input.grant) {
    const { error } = await supabase
      .from("group_permissions")
      .insert({
        group_id: input.groupId,
        permission_id: input.permissionId,
      })
      .select();

    if (error && error.code !== "23505") { // Ignore unique violation if already granted
      return { success: false, data: null, error: { message: error.message } };
    }
  } else {
    const { error } = await supabase
      .from("group_permissions")
      .delete()
      .eq("group_id", input.groupId)
      .eq("permission_id", input.permissionId);

    if (error) {
      return { success: false, data: null, error: { message: error.message } };
    }
  }

  return { success: true, error: null };
}

/**
 * Batch assign permissions to a group.
 */
export async function updateGroupPermissionsBatch(
  groupId: string,
  permissionIds: string[],
): Promise<ServiceResult> {
  const supabase = createClient();

  // 1. Delete current group permissions
  const { error: deleteError } = await supabase
    .from("group_permissions")
    .delete()
    .eq("group_id", groupId);

  if (deleteError) {
    return { success: false, data: null, error: { message: deleteError.message } };
  }

  // 2. Insert new permission list if any
  if (permissionIds.length > 0) {
    const rows = permissionIds.map((pid) => ({
      group_id: groupId,
      permission_id: pid,
    }));

    const { error: insertError } = await supabase
      .from("group_permissions")
      .insert(rows);

    if (insertError) {
      return { success: false, data: null, error: { message: insertError.message } };
    }
  }

  return { success: true, error: null };
}
