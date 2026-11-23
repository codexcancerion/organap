// Browser-side mutations and validation helpers for Academic Departments.
import type { ServiceResult } from "@/types";
import type { DepartmentFormValues, DepartmentValidationResult } from "../types";

import { createClient } from "@/utils/supabase/client";
import { mapSupabaseMutationError } from "@/utils/supabase/errors";

/**
 * Validate department form input before submission.
 */
export function validateDepartmentInput(
  values: DepartmentFormValues,
): DepartmentValidationResult {
  if (values.name.trim().length < 2) {
    return {
      isValid: false,
      error: "Department name must be at least 2 characters.",
    };
  }

  if (values.code.trim().length < 1) {
    return {
      isValid: false,
      error: "Department code (acronym) is required.",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Create a new academic department (`departments.create`).
 */
export async function createDepartment(
  values: DepartmentFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateDepartmentInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  const { error } = await supabase.from("departments").insert({
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
  });

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "departments",
          uniqueMessage: "A department with this name or code already exists.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Update an existing academic department (`departments.change`).
 */
export async function updateDepartment(
  departmentId: string,
  values: DepartmentFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateDepartmentInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("departments")
    .update({
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", departmentId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "departments",
          uniqueMessage: "A department with this name or code already exists.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Delete an academic department (`departments.delete`).
 */
export async function deleteDepartment(
  departmentId: string,
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", departmentId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "departments",
          foreignKeyDeleteMessage:
            "Cannot delete this department because it still contains linked programs. Remove or reassign those programs first.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}
