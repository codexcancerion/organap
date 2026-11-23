// Server-side data queries for Academic Semesters.
import type { Semester } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetch all academic semesters ordered by start date descending.
 * Governed by PostgreSQL RLS (`semesters.view`).
 */
export const getSemesters = cache(async (): Promise<Semester[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("semesters")
    .select("id, name, description, start_date, end_date, created_at, updated_at")
    .order("start_date", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch semesters:", error.message);

    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
});
