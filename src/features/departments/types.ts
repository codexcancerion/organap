// Feature types for Academic Departments in OrGanap.
import type {
  Department,
  DepartmentActivityMetrics,
  DepartmentEventSummary,
  DepartmentOrganizationSummary,
  Program,
} from "@/types/domain";

export type DepartmentProgramSummary = {
  id: string;
  name: string;
  code: string;
};

export type DepartmentListItem = Department & {
  programsCount: number;
  programs: DepartmentProgramSummary[];
  activityMetrics?: DepartmentActivityMetrics;
  organizations?: DepartmentOrganizationSummary[];
};

export type DepartmentDetail = Department & {
  programs: Program[];
  activityMetrics?: DepartmentActivityMetrics;
  organizations?: DepartmentOrganizationSummary[];
  recentEvents?: DepartmentEventSummary[];
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
