// Feature types for Academic Departments in OrGanap.
import type { Department, Program } from "@/types/domain";

export type DepartmentProgramSummary = {
  id: string;
  name: string;
  code: string;
};

export type DepartmentListItem = Department & {
  programsCount: number;
  programs: DepartmentProgramSummary[];
};

export type DepartmentDetail = Department & {
  programs: Program[];
};

export type DepartmentFormValues = {
  name: string;
  code: string;
};

export type DepartmentPermissions = {
  canView: boolean;
  canCreate: boolean;
  canChange: boolean;
  canDelete: boolean;
  canViewPrograms: boolean;
};

export type DepartmentValidationResult =
  | { isValid: true; error: null }
  | { isValid: false; error: string };
