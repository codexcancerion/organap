// Browser-side mutations and validation helpers for Academic Semesters.
import type { ServiceResult } from "@/types";
import type {
  SemesterFormValues,
  SemesterStatus,
  SemesterValidationResult,
} from "../types";

import { createClient } from "@/utils/supabase/client";
import { mapSupabaseMutationError } from "@/utils/supabase/errors";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate semester fields before submission.
 */
export function validateSemesterInput(
  values: SemesterFormValues,
): SemesterValidationResult {
  const trimmedName = values.name.trim();

  if (trimmedName.length < 2) {
    return { isValid: false, error: "Semester name must be at least 2 characters." };
  }

  if (!ISO_DATE_PATTERN.test(values.startDate)) {
    return { isValid: false, error: "Please provide a valid start date." };
  }

  if (!ISO_DATE_PATTERN.test(values.endDate)) {
    return { isValid: false, error: "Please provide a valid end date." };
  }

  if (values.endDate <= values.startDate) {
    return { isValid: false, error: "End date must be after the start date." };
  }

  return { isValid: true, error: null };
}

/**
 * Derive current term status from YYYY-MM-DD bounds relative to a reference date.
 */
export function getSemesterStatus(
  startDate: string,
  endDate: string,
  referenceIsoDate?: string,
): SemesterStatus {
  const today = referenceIsoDate ?? new Date().toISOString().slice(0, 10);

  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";

  return "active";
}

/**
 * Create a new academic semester (`semesters.create`).
 */
export async function createSemester(
  values: SemesterFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateSemesterInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  const { error } = await supabase.from("semesters").insert({
    name: values.name.trim(),
    description: values.description?.trim() || null,
    start_date: values.startDate,
    end_date: values.endDate,
  });

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "semesters",
          uniqueMessage: "A semester with this name already exists.",
          checkConstraintMessage: "End date must be after the start date.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Update an existing academic semester (`semesters.change`).
 */
export async function updateSemester(
  semesterId: string,
  values: SemesterFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateSemesterInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("semesters")
    .update({
      name: values.name.trim(),
      description: values.description?.trim() || null,
      start_date: values.startDate,
      end_date: values.endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", semesterId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "semesters",
          uniqueMessage: "A semester with this name already exists.",
          checkConstraintMessage: "End date must be after the start date.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Delete an academic semester (`semesters.delete`).
 */
export async function deleteSemester(
  semesterId: string,
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { error } = await supabase.from("semesters").delete().eq("id", semesterId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "semesters",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}
