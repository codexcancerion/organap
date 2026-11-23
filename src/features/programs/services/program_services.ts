// Browser-side mutations and validation helpers for Academic Programs.
import type { ServiceResult } from "@/types";
import type { ProgramFormValues, ProgramValidationResult } from "../types";

import { createClient } from "@/utils/supabase/client";
import { mapSupabaseMutationError } from "@/utils/supabase/errors";

/**
 * Validate program fields before submission (each program belongs to exactly 1 department).
 */
export function validateProgramInput(
  values: ProgramFormValues,
): ProgramValidationResult {
  if (values.name.trim().length < 2) {
    return { isValid: false, error: "Program name must be at least 2 characters." };
  }

  if (values.code.trim().length < 1) {
    return { isValid: false, error: "Program code (acronym) is required." };
  }

  if (!values.departmentId.trim()) {
    return {
      isValid: false,
      error: "Each program must belong to a single department.",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Create a new academic program (`programs.create`).
 */
export async function createProgram(
  values: ProgramFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateProgramInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  const { error } = await supabase.from("programs").insert({
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    department_id: values.departmentId,
  });

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "programs",
          uniqueMessage: "A program with this name or code already exists.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Update an existing academic program (`programs.change`).
 */
export async function updateProgram(
  programId: string,
  values: ProgramFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateProgramInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("programs")
    .update({
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      department_id: values.departmentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", programId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "programs",
          uniqueMessage: "A program with this name or code already exists.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Delete an academic program (`programs.delete`).
 */
export async function deleteProgram(
  programId: string,
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { error } = await supabase.from("programs").delete().eq("id", programId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "programs",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}
