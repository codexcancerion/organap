// Server-side data queries for Academic Departments.
import type { DepartmentDetail, DepartmentListItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type DepartmentRow = {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  programs: {
    id: string;
    name: string;
    code: string;
    department_id?: string;
    created_at?: string;
    updated_at?: string;
  }[];
};

/**
 * Fetch all academic departments along with their linked programs (when readable).
 */
export const getDepartments = cache(async (): Promise<DepartmentListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select(`
      id,
      name,
      code,
      created_at,
      updated_at,
      programs (id, name, code)
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch departments:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as DepartmentRow[];

  return rows.map((row) => {
    const programs = [...(row.programs ?? [])].sort((a, b) =>
      a.code.localeCompare(b.code),
    );

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      programsCount: programs.length,
      programs: programs.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
      })),
    };
  });
});

/**
 * Fetch a single department and its full list of contained programs.
 */
export const getDepartmentById = cache(
  async (id: string): Promise<DepartmentDetail | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("departments")
      .select(`
        id,
        name,
        code,
        created_at,
        updated_at,
        programs (id, department_id, name, code, created_at, updated_at)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    const row = data as unknown as DepartmentRow;

    const programs = [...(row.programs ?? [])]
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((p) => ({
        id: p.id,
        departmentId: p.department_id ?? row.id,
        name: p.name,
        code: p.code,
        createdAt: p.created_at ?? row.created_at,
        updatedAt: p.updated_at ?? row.updated_at,
      }));

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      programs,
    };
  },
);
