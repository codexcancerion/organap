"use client";

import type { Semester } from "../types";

import React from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Separator,
  Spinner,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { CalendarRange, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { DangerZoneSection } from "@/components/ui/danger_zone_section";

import {
  createSemester,
  updateSemester,
  validateSemesterInput,
} from "../services/semester_services";

export type SemesterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  semesterToEdit?: Semester | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onRequestDelete?: () => void;
};

export function SemesterModal({
  isOpen,
  onClose,
  semesterToEdit,
  canEdit = true,
  canDelete = false,
  onRequestDelete,
}: SemesterModalProps) {
  const router = useRouter();
  const isEditing = Boolean(semesterToEdit);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(semesterToEdit?.name ?? "");
      setDescription(semesterToEdit?.description ?? "");
      setStartDate(semesterToEdit?.startDate ?? "");
      setEndDate(semesterToEdit?.endDate ?? "");
    }
  }, [isOpen, semesterToEdit]);

  const isDateRangeInvalid = Boolean(startDate && endDate && endDate <= startDate);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name,
      description: description || null,
      startDate,
      endDate,
    };

    const validation = validateSemesterInput(payload);

    if (!validation.isValid) {
      toast.danger("Validation error", { description: validation.error });

      return;
    }

    setIsSubmitting(true);
    try {
      const res =
        isEditing && semesterToEdit
          ? await updateSemester(semesterToEdit.id, payload)
          : await createSemester(payload);

      if (!res.success) {
        toast.danger(
          isEditing ? "Failed to update semester" : "Failed to create semester",
          { description: res.error.message },
        );

        return;
      }

      toast.success(isEditing ? "Semester updated" : "Semester created", {
        description: isEditing
          ? `Updated "${name.trim()}" successfully.`
          : `Added "${name.trim()}" to academic semesters.`,
      });
      onClose();
      router.refresh();
    } catch (err: unknown) {
      toast.danger("Unexpected error", {
        description: err instanceof Error ? err.message : "Could not save semester.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0">
                  {isEditing ? <Settings size={18} /> : <CalendarRange size={18} />}
                </div>
                <div>
                  <Modal.Heading>
                    {isEditing ? "Semester Settings" : "Create Semester"}
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    {isEditing
                      ? "Manage academic term details, date range, and administrative actions."
                      : "Define the academic term name, notes, and active date range."}
                  </p>
                </div>
              </div>
            </Modal.Header>

            {!isEditing || canEdit ? (
              <Form validationBehavior="native" onSubmit={handleSubmit}>
                <Modal.Body className="flex flex-col gap-4 py-3 max-h-[72vh] overflow-y-auto">
                  <TextField
                    isRequired
                    name="name"
                    validate={(val) => {
                      if (!val || val.trim().length < 2) {
                        return "Semester name must be at least 2 characters.";
                      }

                      return null;
                    }}
                    value={name}
                    onChange={setName}
                  >
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. 1st Semester AY 2026–2027"
                      variant="secondary"
                    />
                    <FieldError />
                  </TextField>

                  <TextField
                    name="description"
                    value={description}
                    onChange={setDescription}
                  >
                    <Label>Description</Label>
                    <TextArea
                      placeholder="Optional academic term notes, enrollment period, or scope…"
                      rows={3}
                      variant="secondary"
                    />
                  </TextField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextField
                      isRequired
                      name="startDate"
                      type="date"
                      value={startDate}
                      onChange={setStartDate}
                    >
                      <Label>Start Date</Label>
                      <Input variant="secondary" />
                      <FieldError />
                    </TextField>

                    <TextField
                      isRequired
                      isInvalid={isDateRangeInvalid}
                      name="endDate"
                      type="date"
                      value={endDate}
                      onChange={setEndDate}
                    >
                      <Label>End Date</Label>
                      <Input min={startDate || undefined} variant="secondary" />
                      <FieldError>
                        {isDateRangeInvalid
                          ? "End date must be after the start date."
                          : "End date is required."}
                      </FieldError>
                    </TextField>
                  </div>

                  {isEditing && semesterToEdit && canDelete && onRequestDelete ? (
                    <>
                      <Separator className="my-1" />
                      <DangerZoneSection
                        actionDescription={`Permanently remove "${semesterToEdit.name}".`}
                        actionTitle="Delete Semester"
                        buttonLabel="Delete Semester"
                        subtitle="Irreversible administrative actions for this semester."
                        onAction={onRequestDelete}
                      />
                    </>
                  ) : null}
                </Modal.Body>

                <Modal.Footer className="flex items-center justify-end gap-2 pt-3">
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
                      !startDate ||
                      !endDate ||
                      isDateRangeInvalid
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
                      "Create Semester"
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            ) : (
              <>
                <Modal.Body className="flex flex-col gap-4 py-3">
                  {semesterToEdit && canDelete && onRequestDelete ? (
                    <DangerZoneSection
                      actionDescription={`Permanently remove "${semesterToEdit.name}".`}
                      actionTitle="Delete Semester"
                      buttonLabel="Delete Semester"
                      subtitle="Irreversible administrative actions for this semester."
                      onAction={onRequestDelete}
                    />
                  ) : null}
                </Modal.Body>
                <Modal.Footer className="flex items-center justify-end gap-2 pt-3">
                  <Button size="sm" type="button" variant="ghost" onPress={onClose}>
                    Close
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
