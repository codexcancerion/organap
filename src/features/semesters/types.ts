// Feature types for Academic Semesters in OrGanap.

export type SemesterStatus = "active" | "upcoming" | "completed";

export type Semester = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
};

export type SemesterFormValues = {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
};

export type SemesterPermissions = {
  canView: boolean;
  canCreate: boolean;
  canChange: boolean;
  canDelete: boolean;
};

export type SemesterValidationResult =
  | { isValid: true; error: null }
  | { isValid: false; error: string };
