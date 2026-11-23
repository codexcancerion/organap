// Browser-side mutations for Campus Venues (venues.create, venues.change, venues.delete).
import type { ServiceResult } from "@/types";
import type { VenueFormValues, VenueValidationResult } from "../types";

import { createClient } from "@/utils/supabase/client";
import { mapSupabaseMutationError } from "@/utils/supabase/errors";

import { isValidVenueColor } from "../constants";

export function validateVenueInput(values: VenueFormValues): VenueValidationResult {
  if (!values.name || values.name.trim().length < 2) {
    return {
      isValid: false,
      error: "Venue name must be at least 2 characters.",
    };
  }

  if (!Number.isInteger(values.capacity) || values.capacity < 1 || values.capacity > 100000) {
    return {
      isValid: false,
      error: "Venue capacity must be a positive whole number (at least 1).",
    };
  }

  if (!values.icon || !values.icon.trim()) {
    return {
      isValid: false,
      error: "Please select a venue icon.",
    };
  }

  if (!isValidVenueColor(values.color)) {
    return {
      isValid: false,
      error: "Please select a valid preset color or hex value (#RRGGBB).",
    };
  }

  return { isValid: true };
}

/**
 * Create a new campus venue (`venues.create`).
 */
export async function createVenue(
  values: VenueFormValues,
): Promise<ServiceResult<{ id: string }>> {
  const validation = validateVenueInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: values.name.trim(),
      location: values.location?.trim() || null,
      capacity: values.capacity,
      is_active: values.isActive,
      icon: values.icon.trim(),
      color: values.color.trim().toLowerCase(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(
          error ?? { message: "Failed to create venue." },
          {
            entityLabel: "venues",
            uniqueMessage: `A venue named "${values.name.trim()}" already exists.`,
            checkConstraintMessage: "Venue capacity must be greater than zero and color must be valid.",
          },
        ),
      },
    };
  }

  return { success: true, data: { id: data.id }, error: null };
}

/**
 * Update an existing campus venue (`venues.change`).
 */
export async function updateVenue(
  venueId: string,
  values: VenueFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateVenueInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("venues")
    .update({
      name: values.name.trim(),
      location: values.location?.trim() || null,
      capacity: values.capacity,
      is_active: values.isActive,
      icon: values.icon.trim(),
      color: values.color.trim().toLowerCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", venueId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "venues",
          uniqueMessage: `Another venue named "${values.name.trim()}" already exists.`,
          checkConstraintMessage: "Venue capacity must be greater than zero and color must be valid.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Permanently delete a campus venue (`venues.delete`).
 * Blocked if referenced by any historical or active event proposals.
 */
export async function deleteVenue(venueId: string): Promise<ServiceResult<void>> {
  const supabase = createClient();

  const { error } = await supabase.from("venues").delete().eq("id", venueId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "venues",
          foreignKeyDeleteMessage:
            "This venue is linked to existing event proposals. Switch its status to Maintenance instead of deleting.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}
