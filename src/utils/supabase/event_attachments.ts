import type { createClient } from "@/utils/supabase/client";
import type { EventAttachment, ServiceResult } from "@/types";

export const MAX_EVENT_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "attachment";
}

/**
 * Validate file size and MIME type before uploading to Supabase Storage.
 */
export function validateEventAttachmentFile(file: File): string | null {
  if (file.size <= 0) {
    return `"${file.name}" is empty.`;
  }
  if (file.size > MAX_EVENT_ATTACHMENT_BYTES) {
    return `"${file.name}" exceeds the 10 MB size limit.`;
  }
  if (file.type && !ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return `"${file.name}" has an unsupported file format. Upload PDF, Word, or image files.`;
  }

  return null;
}

/**
 * Upload a file to `organap-assets/events/{proposalId}/...` and persist its metadata row.
 */
export async function uploadEventAttachmentFile(
  supabase: ReturnType<typeof createClient>,
  params: {
    proposalId: string;
    attachmentTypeId: string | null;
    attachmentTypeName?: string | null;
    attachmentTypeCode?: string | null;
    attachmentTypeCategory?: string | null;
    uploadedBy: string;
    uploadedByName?: string | null;
    file: File;
  },
): Promise<ServiceResult<EventAttachment>> {
  const fileError = validateEventAttachmentFile(params.file);

  if (fileError) {
    return { success: false, data: null, error: { message: fileError } };
  }

  const sanitized = sanitizeFileName(params.file.name);
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const filePath = `events/${params.proposalId}/${uniquePrefix}_${sanitized}`;

  const { error: uploadError } = await supabase.storage
    .from("organap-assets")
    .upload(filePath, params.file, {
      contentType: params.file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    return {
      success: false,
      data: null,
      error: { message: uploadError.message },
    };
  }

  const { data: urlData } = supabase.storage
    .from("organap-assets")
    .getPublicUrl(filePath);

  const { data: inserted, error: insertError } = await supabase
    .from("event_attachments")
    .insert({
      proposal_id: params.proposalId,
      attachment_type_id: params.attachmentTypeId,
      file_name: params.file.name,
      file_path: filePath,
      file_url: urlData.publicUrl,
      mime_type: params.file.type || null,
      size_bytes: params.file.size,
      uploaded_by: params.uploadedBy,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from("organap-assets").remove([filePath]);

    return {
      success: false,
      data: null,
      error: { message: insertError?.message ?? "Failed to save attachment record." },
    };
  }

  return {
    success: true,
    data: {
      id: inserted.id,
      proposalId: inserted.proposal_id,
      attachmentTypeId: inserted.attachment_type_id,
      attachmentTypeName: params.attachmentTypeName ?? null,
      attachmentTypeCode: params.attachmentTypeCode ?? null,
      attachmentTypeCategory: params.attachmentTypeCategory ?? null,
      fileName: inserted.file_name,
      filePath: inserted.file_path,
      fileUrl: inserted.file_url,
      mimeType: inserted.mime_type,
      sizeBytes: inserted.size_bytes,
      uploadedBy: inserted.uploaded_by,
      uploadedByName: params.uploadedByName ?? null,
      createdAt: inserted.created_at,
    },
    error: null,
  };
}

/**
 * Remove an attachment row and delete its backing file from `organap-assets`.
 */
export async function deleteEventAttachmentFile(
  supabase: ReturnType<typeof createClient>,
  attachmentId: string,
  filePath: string,
): Promise<ServiceResult<void>> {
  const { error: deleteError } = await supabase
    .from("event_attachments")
    .delete()
    .eq("id", attachmentId);

  if (deleteError) {
    return {
      success: false,
      data: null,
      error: { message: deleteError.message },
    };
  }

  if (filePath) {
    await supabase.storage.from("organap-assets").remove([filePath]);
  }

  return { success: true, data: undefined, error: null };
}
