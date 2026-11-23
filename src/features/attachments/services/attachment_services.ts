// Browser-side mutations and validation helpers for Dynamic Event Attachment Types.
import type { ServiceResult } from "@/types";
import type {
  AttachmentTypeFormValues,
  AttachmentValidationResult,
} from "../types";

import { createClient } from "@/utils/supabase/client";
import { mapSupabaseMutationError } from "@/utils/supabase/errors";
import { validateEventAttachmentFile } from "@/utils/supabase/event_attachments";

const CODE_PATTERN = /^[A-Z0-9_-]+$/;
const STORAGE_BUCKET = "organap-assets";

type UploadedTemplateResult = {
  fileName: string;
  filePath: string;
  fileUrl: string;
};

function sanitizeTemplateFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "template";
}

/**
 * Upload an optional template file to `organap-assets/events/templates/...`.
 */
async function uploadAttachmentTemplateFile(
  supabase: ReturnType<typeof createClient>,
  file: File,
): Promise<ServiceResult<UploadedTemplateResult>> {
  const fileError = validateEventAttachmentFile(file);

  if (fileError) {
    return { success: false, data: null, error: { message: fileError } };
  }

  const sanitized = sanitizeTemplateFileName(file.name);
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const filePath = `events/templates/${uniquePrefix}_${sanitized}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      data: null,
      error: { message: uploadError.message },
    };
  }

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return {
    success: true,
    data: {
      fileName: file.name,
      filePath,
      fileUrl: urlData.publicUrl,
    },
    error: null,
  };
}

/**
 * Normalize an attachment requirement code into uppercase snake/hyphen format.
 */
export function normalizeAttachmentCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "_");
}

/**
 * Validate attachment type input before persistence.
 */
export function validateAttachmentTypeInput(
  values: AttachmentTypeFormValues,
): AttachmentValidationResult {
  if (values.name.trim().length < 2) {
    return {
      isValid: false,
      error: "Attachment type name must be at least 2 characters.",
    };
  }

  const normalizedCode = normalizeAttachmentCode(values.code);

  if (normalizedCode.length < 2) {
    return {
      isValid: false,
      error: "Attachment code must be at least 2 characters.",
    };
  }

  if (!CODE_PATTERN.test(normalizedCode)) {
    return {
      isValid: false,
      error: "Attachment code can only contain letters, numbers, underscores, and hyphens.",
    };
  }

  if (values.templateFile) {
    const fileError = validateEventAttachmentFile(values.templateFile);

    if (fileError) {
      return { isValid: false, error: fileError };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Create a new dynamic event attachment type (`attachments.create`).
 */
export async function createAttachmentType(
  values: AttachmentTypeFormValues,
): Promise<ServiceResult<void>> {
  const validation = validateAttachmentTypeInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  let uploadedTemplate: UploadedTemplateResult | null = null;

  if (values.templateFile) {
    const uploadRes = await uploadAttachmentTemplateFile(supabase, values.templateFile);

    if (!uploadRes.success) {
      return uploadRes;
    }

    uploadedTemplate = uploadRes.data;
  }

  const { error } = await supabase.from("attachment_types").insert({
    name: values.name.trim(),
    code: normalizeAttachmentCode(values.code),
    category: values.category?.trim() || null,
    description: values.description?.trim() || null,
    is_required: values.isRequired,
    is_active: values.isActive,
    template_file_name: uploadedTemplate?.fileName ?? null,
    template_file_path: uploadedTemplate?.filePath ?? null,
    template_file_url: uploadedTemplate?.fileUrl ?? null,
  });

  if (error) {
    if (uploadedTemplate?.filePath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedTemplate.filePath]);
    }

    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "event attachment types",
          uniqueMessage: "An attachment type with this name or code already exists.",
        }),
      },
    };
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Update an existing event attachment type (`attachments.change`).
 */
export async function updateAttachmentType(
  attachmentTypeId: string,
  values: AttachmentTypeFormValues,
  existingTemplatePath?: string | null,
): Promise<ServiceResult<void>> {
  const validation = validateAttachmentTypeInput(values);

  if (!validation.isValid) {
    return { success: false, data: null, error: { message: validation.error } };
  }

  const supabase = createClient();
  let uploadedTemplate: UploadedTemplateResult | null = null;

  if (values.templateFile) {
    const uploadRes = await uploadAttachmentTemplateFile(supabase, values.templateFile);

    if (!uploadRes.success) {
      return uploadRes;
    }

    uploadedTemplate = uploadRes.data;
  }

  const updatePayload: {
    name: string;
    code: string;
    category: string | null;
    description: string | null;
    is_required: boolean;
    is_active: boolean;
    updated_at: string;
    template_file_name?: string | null;
    template_file_path?: string | null;
    template_file_url?: string | null;
  } = {
    name: values.name.trim(),
    code: normalizeAttachmentCode(values.code),
    category: values.category?.trim() || null,
    description: values.description?.trim() || null,
    is_required: values.isRequired,
    is_active: values.isActive,
    updated_at: new Date().toISOString(),
  };

  if (uploadedTemplate) {
    updatePayload.template_file_name = uploadedTemplate.fileName;
    updatePayload.template_file_path = uploadedTemplate.filePath;
    updatePayload.template_file_url = uploadedTemplate.fileUrl;
  } else if (values.removeTemplate) {
    updatePayload.template_file_name = null;
    updatePayload.template_file_path = null;
    updatePayload.template_file_url = null;
  }

  const { error } = await supabase
    .from("attachment_types")
    .update(updatePayload)
    .eq("id", attachmentTypeId);

  if (error) {
    if (uploadedTemplate?.filePath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedTemplate.filePath]);
    }

    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "event attachment types",
          uniqueMessage: "An attachment type with this name or code already exists.",
        }),
      },
    };
  }

  if (existingTemplatePath && (uploadedTemplate || values.removeTemplate)) {
    await supabase.storage.from(STORAGE_BUCKET).remove([existingTemplatePath]);
  }

  return { success: true, data: undefined, error: null };
}

/**
 * Delete an event attachment type (`attachments.delete`).
 */
export async function deleteAttachmentType(
  attachmentTypeId: string,
  existingTemplatePath?: string | null,
): Promise<ServiceResult<void>> {
  const supabase = createClient();
  const { error } = await supabase
    .from("attachment_types")
    .delete()
    .eq("id", attachmentTypeId);

  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: mapSupabaseMutationError(error, {
          entityLabel: "event attachment types",
        }),
      },
    };
  }

  if (existingTemplatePath) {
    await supabase.storage.from(STORAGE_BUCKET).remove([existingTemplatePath]);
  }

  return { success: true, data: undefined, error: null };
}
