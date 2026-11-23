// Feature types for Academic Programs in OrGanap.
import type { DepartmentSummary, Program } from "@/types/domain";

export type ProgramListItem = Program & {
  department: DepartmentSummary;
};

export type ProgramFormValues = {
  name: string;
  code: string;
  departmentId: string;
};

export type ProgramPermissions = {
  canView: boolean;
  canCreate: boolean;
  canChange: boolean;
  canDelete: boolean;
  canViewDepartments: boolean;
};

export type ProgramValidationResult =
  | { isValid: true; error: null }
  | { isValid: false; error: string };
