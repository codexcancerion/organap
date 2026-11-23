// Server-side data queries for Dynamic Event Attachment Types.
import type { AttachmentType } from "@/types/domain";
import type { AttachmentTypeItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type AttachmentTypeRow = {
  id: string;
  name: string;
  code: string;
  category: string | null;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  template_file_name: string | null;
  template_file_path: string | null;
  template_file_url: string | null;
  created_at: string;
  updated_at: string;
  event_attachments?: { id: string }[];
};

/**
 * Fetch all configured event attachment types with submission counts.
 */
export const getAttachmentTypes = cache(async (): Promise<AttachmentTypeItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attachment_types")
    .select(`
      id,
      name,
      code,
      category,
      description,
      is_required,
      is_active,
      template_file_name,
      template_file_path,
      template_file_url,
      created_at,
      updated_at,
      event_attachments (id)
    `)
    .order("is_required", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch attachment types:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as AttachmentTypeRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    description: row.description,
    isRequired: row.is_required,
    isActive: row.is_active,
    templateFileName: row.template_file_name,
    templateFilePath: row.template_file_path,
    templateFileUrl: row.template_file_url,
    submissionsCount: (row.event_attachments ?? []).length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
});

/**
 * Fetch active attachment requirement types for event proposal forms.
 */
export const getActiveAttachmentTypes = cache(async (): Promise<AttachmentType[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attachment_types")
    .select(
      "id, name, code, category, description, is_required, is_active, template_file_name, template_file_path, template_file_url, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("is_required", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch active attachment types:", error.message);

    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    description: row.description,
    isRequired: row.is_required,
    isActive: row.is_active,
    templateFileName: row.template_file_name,
    templateFilePath: row.template_file_path,
    templateFileUrl: row.template_file_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
});
