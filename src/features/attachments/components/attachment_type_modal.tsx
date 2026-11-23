"use client";

import type { AttachmentTypeItem } from "../types";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Separator,
  Spinner,
  Switch,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import {
  ExternalLink,
  FileText,
  Paperclip,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { DangerZoneSection } from "@/components/ui/danger_zone_section";
import { validateEventAttachmentFile } from "@/utils/supabase/event_attachments";

import {
  createAttachmentType,
  normalizeAttachmentCode,
  updateAttachmentType,
  validateAttachmentTypeInput,
} from "../services/attachment_services";

export type AttachmentTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  attachmentTypeToEdit?: AttachmentTypeItem | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onRequestDelete?: () => void;
};

function AttachmentTypeModalBody({
  attachmentTypeToEdit,
  canEdit,
  canDelete,
  onClose,
  onRequestDelete,
}: Omit<AttachmentTypeModalProps, "isOpen">) {
  const router = useRouter();
  const isEditing = Boolean(attachmentTypeToEdit);

  const [name, setName] = React.useState(attachmentTypeToEdit?.name ?? "");
  const [code, setCode] = React.useState(attachmentTypeToEdit?.code ?? "");
  const [category, setCategory] = React.useState(
    attachmentTypeToEdit?.category ?? "",
  );
  const [description, setDescription] = React.useState(
    attachmentTypeToEdit?.description ?? "",
  );
  const [isRequired, setIsRequired] = React.useState(
    attachmentTypeToEdit?.isRequired ?? false,
  );
  const [isActive, setIsActive] = React.useState(
    attachmentTypeToEdit?.isActive ?? true,
  );
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = React.useState(
    Boolean(attachmentTypeToEdit),
  );
  const [templateFile, setTemplateFile] = React.useState<File | null>(null);
  const [removeExistingTemplate, setRemoveExistingTemplate] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isCodeManuallyEdited && !isEditing) {
      const generated = val
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      setCode(generated);
    }
  };

  const handleCodeChange = (val: string) => {
    setIsCodeManuallyEdited(true);
    setCode(normalizeAttachmentCode(val));
  };

  const handleTemplateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = "";

    if (!file) return;

    const fileError = validateEventAttachmentFile(file);

    if (fileError) {
      toast.danger("Invalid template file", { description: fileError });

      return;
    }

    setTemplateFile(file);
    setRemoveExistingTemplate(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name,
      code,
      category: category.trim() || null,
      description: description.trim() || null,
      isRequired,
      isActive,
      templateFile,
      removeTemplate: removeExistingTemplate,
    };

    const validation = validateAttachmentTypeInput(payload);

    if (!validation.isValid) {
      toast.danger("Validation error", { description: validation.error });

      return;
    }

    setIsSubmitting(true);
    try {
      const res =
        isEditing && attachmentTypeToEdit
          ? await updateAttachmentType(
              attachmentTypeToEdit.id,
              payload,
              attachmentTypeToEdit.templateFilePath,
            )
          : await createAttachmentType(payload);

      if (!res.success) {
        toast.danger(
          isEditing
            ? "Failed to update attachment type"
            : "Failed to create attachment type",
          { description: res.error.message },
        );

        return;
      }

      toast.success(
        isEditing ? "Attachment type updated" : "Attachment type created",
        {
          description: isEditing
            ? `Updated "${name.trim()}" (${normalizeAttachmentCode(code)}).`
            : `Added "${name.trim()}" to dynamic event attachments.`,
        },
      );
      onClose();
      router.refresh();
    } catch (err: unknown) {
      toast.danger("Unexpected error", {
        description:
          err instanceof Error ? err.message : "Could not save attachment type.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal.Dialog className="border border-border/40 shadow-lg bg-surface flex flex-col max-h-[90vh]">
      <Modal.CloseTrigger />
      <Modal.Header className="shrink-0">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            {isEditing ? <Settings size={18} /> : <Paperclip size={18} />}
          </div>
          <div>
            <Modal.Heading>
              {isEditing ? "Attachment Type Settings" : "Add Attachment Type"}
            </Modal.Heading>
            <p className="text-xs text-muted">
              {isEditing
                ? "Update document requirement rules, submission flags, and administrative actions."
                : "Define a dynamic document requirement that officers can attach to event proposals."}
            </p>
          </div>
        </div>
      </Modal.Header>

      {!isEditing || canEdit ? (
        <Form
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <Modal.Body className="flex flex-col gap-4 py-3 overflow-y-auto flex-1 min-h-0">
            <TextField
              isRequired
              name="name"
              validate={(val) => {
                if (!val || val.trim().length < 2) {
                  return "Attachment type name must be at least 2 characters.";
                }

                return null;
              }}
              value={name}
              onChange={handleNameChange}
            >
              <Label>Attachment Name</Label>
              <Input
                placeholder="e.g. Budget Proposal, Activity Concept Paper, Waiver Form"
                variant="secondary"
              />
              <FieldError />
            </TextField>

            <TextField
              isRequired
              name="code"
              validate={(val) => {
                const normalized = normalizeAttachmentCode(val || "");

                if (normalized.length < 2) {
                  return "Attachment code must be at least 2 characters.";
                }

                return null;
              }}
              value={code}
              onChange={handleCodeChange}
            >
              <Label>Reference Code</Label>
              <Input placeholder="e.g. BUDGET_PROPOSAL" variant="secondary" />
              <FieldError />
            </TextField>

            <TextField
              name="category"
              value={category}
              onChange={setCategory}
            >
              <Label>Category / Grouping (Optional)</Label>
              <Input
                placeholder="e.g. Documents, For Student Organizations, For Off-Campus Activities"
                variant="secondary"
              />
              <Description>
                Leave empty to group under &ldquo;Others&rdquo; on proposal forms.
              </Description>
            </TextField>

            <TextField
              name="description"
              value={description}
              onChange={setDescription}
            >
              <Label>Submission Guidelines</Label>
              <TextArea
                placeholder="Describe what should be included in this file (PDF, signed endorsement, etc.)…"
                rows={3}
                variant="secondary"
              />
            </TextField>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Template File (Optional)
                </span>
                <span className="text-[11px] text-muted">
                  PDF, Word, or Image · Max 10 MB
                </span>
              </div>

              <input
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                disabled={isSubmitting}
                id="attachment-type-template-input"
                type="file"
                onChange={handleTemplateFileChange}
              />

              {templateFile ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-default/5 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="text-accent shrink-0" size={14} />
                    <span className="truncate font-medium text-foreground">
                      {templateFile.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-accent">
                      Ready to upload
                    </span>
                  </div>
                  <Button
                    isIconOnly
                    aria-label="Clear selected template file"
                    isDisabled={isSubmitting}
                    size="sm"
                    variant="ghost"
                    onPress={() => setTemplateFile(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : attachmentTypeToEdit?.templateFileUrl && !removeExistingTemplate ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-default/5 px-3 py-2 text-xs">
                  <a
                    className="flex items-center gap-1.5 min-w-0 font-medium text-foreground hover:text-accent"
                    href={attachmentTypeToEdit.templateFileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FileText className="text-accent shrink-0" size={14} />
                    <span className="truncate">
                      {attachmentTypeToEdit.templateFileName || "Download template"}
                    </span>
                    <ExternalLink className="shrink-0" size={11} />
                  </a>
                  <div className="flex items-center gap-1 shrink-0">
                    <label
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface border border-border/50 hover:border-accent/50 text-foreground cursor-pointer transition-colors"
                      htmlFor="attachment-type-template-input"
                    >
                      <Upload size={12} />
                      Replace
                    </label>
                    <Button
                      isIconOnly
                      aria-label="Remove existing template"
                      className="text-danger"
                      isDisabled={isSubmitting}
                      size="sm"
                      variant="ghost"
                      onPress={() => setRemoveExistingTemplate(true)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-default/5 px-3 py-2.5 text-xs font-semibold text-foreground hover:border-accent/60 cursor-pointer transition-colors"
                    htmlFor="attachment-type-template-input"
                  >
                    <Upload size={14} />
                    Upload Blank Template File
                  </label>
                  {removeExistingTemplate && attachmentTypeToEdit?.templateFileName ? (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-warning">
                      <span>
                        &ldquo;{attachmentTypeToEdit.templateFileName}&rdquo; will be removed on save.
                      </span>
                      <button
                        className="font-semibold underline cursor-pointer"
                        type="button"
                        onClick={() => setRemoveExistingTemplate(false)}
                      >
                        Undo
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <Switch isSelected={isRequired} onChange={setIsRequired}>
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="text-sm font-medium">
                  Required for Proposal Submission
                </Label>
              </Switch.Content>
              <Description>
                Officers must upload this document before submitting an event proposal for adviser review.
              </Description>
            </Switch>

            <Switch isSelected={isActive} onChange={setIsActive}>
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="text-sm font-medium">
                  Active Attachment Type
                </Label>
              </Switch.Content>
              <Description>
                Inactive attachment types remain preserved for historical events but are hidden on new proposals.
              </Description>
            </Switch>

            {isEditing && attachmentTypeToEdit && canDelete && onRequestDelete ? (
              <>
                <Separator className="my-1" />
                <DangerZoneSection
                  actionDescription={`Permanently remove "${attachmentTypeToEdit.name}" (${attachmentTypeToEdit.code}).`}
                  actionTitle="Delete Attachment Type"
                  buttonLabel="Delete Attachment Type"
                  subtitle="Existing uploaded files on proposals will stay intact, but this requirement definition will be deleted."
                  onAction={onRequestDelete}
                />
              </>
            ) : null}
          </Modal.Body>

          <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-3 border-t border-border/30">
            <Button
              isDisabled={isSubmitting}
              size="sm"
              type="button"
              variant="ghost"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              isDisabled={
                isSubmitting ||
                name.trim().length < 2 ||
                normalizeAttachmentCode(code).length < 2
              }
              size="sm"
              type="submit"
              variant="primary"
            >
              {isSubmitting ? (
                <Spinner color="current" size="sm" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Attachment Type"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      ) : (
        <>
          <Modal.Body className="flex flex-col gap-4 py-3 overflow-y-auto flex-1 min-h-0">
            {attachmentTypeToEdit && canDelete && onRequestDelete ? (
              <DangerZoneSection
                actionDescription={`Permanently remove "${attachmentTypeToEdit.name}" (${attachmentTypeToEdit.code}).`}
                actionTitle="Delete Attachment Type"
                buttonLabel="Delete Attachment Type"
                subtitle="Existing uploaded files on proposals will stay intact, but this requirement definition will be deleted."
                onAction={onRequestDelete}
              />
            ) : null}
          </Modal.Body>
          <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-3 border-t border-border/30">
            <Button size="sm" type="button" variant="ghost" onPress={onClose}>
              Close
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal.Dialog>
  );
}

export function AttachmentTypeModal({
  isOpen,
  onClose,
  attachmentTypeToEdit,
  canEdit = true,
  canDelete = false,
  onRequestDelete,
}: AttachmentTypeModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container scroll="inside" size="md">
          {isOpen ? (
            <AttachmentTypeModalBody
              key={
                attachmentTypeToEdit
                  ? `${attachmentTypeToEdit.id}-${attachmentTypeToEdit.updatedAt}`
                  : "create-attachment-type"
              }
              attachmentTypeToEdit={attachmentTypeToEdit}
              canDelete={canDelete}
              canEdit={canEdit}
              onClose={onClose}
              onRequestDelete={onRequestDelete}
            />
          ) : null}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
