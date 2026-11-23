// Browser-side mutations for Organizations (FR-01, FR-02).
import type { ServiceResult } from "@/types";
import type { OrganizationFormValues } from "../types";

import { createClient } from "@/utils/supabase/client";

const ASSET_BUCKET = "organap-assets";

/**
 * Generates a clean URL-safe organization slug behind the scenes from name or acronym.
 */
export function generateOrganizationSlug(name: string, acronym?: string): string {
  const source = name.trim() || acronym?.trim() || "organization";
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `org-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Uploads a cropped, compressed organization logo Blob to the public `organap-assets` bucket.
 */
export async function uploadOrganizationLogo(
  blob: Blob,
  nameOrAcronym: string
): Promise<ServiceResult<{ publicUrl: string }>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const safePrefix = generateOrganizationSlug(nameOrAcronym, "org").slice(0, 32);
  const ext = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp";
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const filePath = `organizations/logos/${safePrefix}-${Date.now()}-${randomSuffix}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || "image/webp",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { success: false, data: null, error: { message: uploadError.message } };
  }

  const { data: publicUrlData } = supabase.storage
    .from(ASSET_BUCKET)
    .getPublicUrl(filePath);

  return {
    success: true,
    data: { publicUrl: publicUrlData.publicUrl },
    error: null,
  };
}

/**
 * Create a new student organization.
 * Restricted to superusers, staff, or users with organizations.create permission.
 */
export async function createOrganization(
  values: OrganizationFormValues
): Promise<ServiceResult<{ organizationId: string }>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  // WHY: Slugs are hidden from creation/settings UIs to reduce friction; retry with a
  // short suffix if similarly named organizations collide on organizations_slug_key.
  const initialSlug =
    values.slug?.trim().toLowerCase() || generateOrganizationSlug(values.name, values.acronym);

  const attemptCreate = async (slugToUse: string) =>
    supabase.rpc("create_organization", {
      p_name: values.name.trim(),
      p_acronym: values.acronym.trim().toUpperCase(),
      p_slug: slugToUse,
      p_category: values.category.trim(),
      p_description: values.description?.trim() || undefined,
      p_logo_url: values.logoUrl?.trim() || undefined,
      p_governor_id: values.governorId || undefined,
      p_adviser_id: values.adviserId || undefined,
      p_caller_id: userAuth.user.id,
    });

  let { data, error } = await attemptCreate(initialSlug);

  if (error && !values.slug && /organizations_slug_key|duplicate key/i.test(error.message)) {
    const fallbackSlug = `${initialSlug}-${Math.random().toString(36).slice(2, 6)}`;

    ({ data, error } = await attemptCreate(fallbackSlug));
  }

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  const res = data as { success: boolean; organization_id: string };

  return { success: true, data: { organizationId: res.organization_id }, error: null };
}

/**
 * Update an organization's profile info (name, acronym, category, description, logo).
 */
export async function updateOrganizationInfo(
  organizationId: string,
  values: Partial<OrganizationFormValues>
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  // INVARIANT: Prefer the existing organization slug on edits so bookmarks and asset
  // references remain stable when admins rename an organization or acronym.
  const resolvedSlug =
    values.slug?.trim().toLowerCase() ||
    generateOrganizationSlug(values.name ?? "", values.acronym);

  const { error } = await supabase.rpc("update_organization_info", {
    p_org_id: organizationId,
    p_name: values.name?.trim() ?? "",
    p_acronym: values.acronym?.trim().toUpperCase() ?? "",
    p_slug: resolvedSlug,
    p_category: values.category?.trim() ?? "academic",
    p_description: values.description?.trim() || undefined,
    p_logo_url: values.logoUrl?.trim() || undefined,
    p_is_active: values.isActive ?? true,
    p_caller_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Update organization leaders (Governor and Faculty Adviser).
 * Business rule enforced by procedure: current leaders cannot change themselves unless caller is admin.
 */
export async function updateOrganizationLeaders(
  organizationId: string,
  governorId: string | null,
  adviserId: string | null
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const { error } = await supabase.rpc("update_organization_leaders", {
    p_org_id: organizationId,
    p_governor_id: (governorId || null) as unknown as string,
    p_adviser_id: (adviserId || null) as unknown as string,
    p_caller_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Delete an organization (restricted to users with canDeleteOrganizations).
 */
export async function deleteOrganization(
  organizationId: string
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const { error } = await supabase.rpc("delete_organization", {
    p_org_id: organizationId,
    p_caller_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Update an organization member's position.
 */
export async function updateMemberPosition(
  memberId: string,
  position: string
): Promise<ServiceResult<{ position: string }>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const { data, error } = await supabase.rpc("update_member_position", {
    p_member_id: memberId,
    p_position: position.trim(),
    p_user_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  const res = data as { success: boolean; position: string };

  return { success: true, data: { position: res.position }, error: null };
}

/**
 * Add a member to the organization roster.
 */
export async function addOrganizationMember(
  organizationId: string,
  userId: string,
  position: string,
  isOfficer: boolean = false,
  isAdviser: boolean = false
): Promise<ServiceResult<{ memberId: string }>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const { data, error } = await supabase.rpc("add_organization_member", {
    p_org_id: organizationId,
    p_user_id: userId,
    p_position: position.trim() || "Member",
    p_is_officer: isOfficer,
    p_is_adviser: isAdviser,
    p_caller_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  const res = data as { success: boolean; member_id: string };

  return { success: true, data: { memberId: res.member_id }, error: null };
}

/**
 * Remove a member from the organization roster.
 * Business rule: Cannot remove a member who is currently Governor or Adviser.
 */
export async function removeOrganizationMember(
  memberId: string
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { data: userAuth } = await supabase.auth.getUser();

  if (!userAuth.user) {
    return { success: false, data: null, error: { message: "Authentication required." } };
  }

  const { error } = await supabase.rpc("remove_organization_member", {
    p_member_id: memberId,
    p_caller_id: userAuth.user.id,
  });

  if (error) {
    return { success: false, data: null, error: { message: error.message } };
  }

  return { success: true, data: undefined, error: null };
}
