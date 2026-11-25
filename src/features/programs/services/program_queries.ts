// Server-side data queries for Academic Programs.
import type { DepartmentSummary } from "@/types/domain";
import type { ProgramListItem } from "../types";

import { cache } from "react";

import {
  EMPTY_DEPARTMENT_METRICS,
  getDepartmentActivityMap,
} from "@/utils/department_activity";
import { createClient } from "@/utils/supabase/server";

type ProgramQueryRow = {
  id: string;
  department_id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
};

/**
 * Fetch all academic programs along with their single parent department.
 */
export const getPrograms = cache(async (): Promise<ProgramListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("programs")
    .select(`
      id,
      department_id,
      name,
      code,
      created_at,
      updated_at,
      department:department_id (id, name, code)
    `)
    .order("code", { ascending: true });

  if (error) {
    console.error("Failed to fetch programs:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as ProgramQueryRow[];
  const deptIds = Array.from(new Set(rows.map((r) => r.department_id).filter(Boolean)));
  const activityMap = await getDepartmentActivityMap(deptIds);

  return rows.map((row) => {
    const activity = activityMap.get(row.department_id);

    return {
      id: row.id,
      departmentId: row.department_id,
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      department: row.department ?? {
        id: row.department_id,
        name: "Unassigned Department",
        code: "DEPT",
      },
      activityMetrics: activity?.metrics ?? EMPTY_DEPARTMENT_METRICS,
      organizations: activity?.organizations ?? [],
    };
  });
});

/**
 * Fetch a single program along with its parent department.
 */
export const getProgramById = cache(
  async (id: string): Promise<ProgramListItem | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("programs")
      .select(`
        id,
        department_id,
        name,
        code,
        created_at,
        updated_at,
        department:department_id (id, name, code)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    const row = data as unknown as ProgramQueryRow;
    const activityMap = await getDepartmentActivityMap([row.department_id]);
    const activity = activityMap.get(row.department_id);

    return {
      id: row.id,
      departmentId: row.department_id,
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      department: row.department ?? {
        id: row.department_id,
        name: "Unassigned Department",
        code: "DEPT",
      },
      activityMetrics: activity?.metrics ?? EMPTY_DEPARTMENT_METRICS,
      organizations: activity?.organizations ?? [],
      recentEvents: activity?.recentEvents ?? [],
    };
  },
);

/**
 * Fetch department selector options for program filtering and assignment.
 */
export const getDepartmentOptions = cache(
  async (): Promise<DepartmentSummary[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("departments")
      .select("id, name, code")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch department options:", error.message);

      return [];
    }

    return data ?? [];
  },
);
