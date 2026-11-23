"use client";

import type { DepartmentSummary, Program } from "@/types/domain";

import React from "react";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { GraduationCap, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { DangerZoneSection } from "@/components/ui/danger_zone_section";

import {
  createProgram,
  updateProgram,
  validateProgramInput,
} from "../services/program_services";

export type ProgramModalProps = {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentSummary[];
  programToEdit?: Program | null;
  lockedDepartmentId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onRequestDelete?: () => void;
};

export function ProgramModal({
  isOpen,
  onClose,
  departments,
  programToEdit,
  lockedDepartmentId,
  canEdit = true,
  canDelete = false,
  onRequestDelete,
}: ProgramModalProps) {
  const router = useRouter();
  const isEditing = Boolean(programToEdit);

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(programToEdit?.name ?? "");
      setCode(programToEdit?.code ?? "");
      setDepartmentId(
        lockedDepartmentId ??
          programToEdit?.departmentId ??
          departments[0]?.id ??
          "",
      );
    }
  }, [isOpen, programToEdit, lockedDepartmentId, departments]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = { name, code, departmentId };
    const validation = validateProgramInput(payload);

    if (!validation.isValid) {
      toast.danger("Validation error", { description: validation.error });

      return;
    }

    setIsSubmitting(true);
    try {
      const res =
        isEditing && programToEdit
          ? await updateProgram(programToEdit.id, payload)
          : await createProgram(payload);

      if (!res.success) {
        toast.danger(
          isEditing ? "Failed to update program" : "Failed to create program",
          { description: res.error.message },
        );

        return;
      }

      const normalizedCode = code.trim().toUpperCase();

      toast.success(isEditing ? "Program updated" : "Program created", {
        description: isEditing
          ? `Updated ${name.trim()} (${normalizedCode}).`
          : `Added ${name.trim()} (${normalizedCode}).`,
      });
      onClose();
      router.refresh();
    } catch (err: unknown) {
      toast.danger("Unexpected error", {
        description: err instanceof Error ? err.message : "Could not save program.",
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
                  {isEditing ? <Settings size={18} /> : <GraduationCap size={18} />}
                </div>
                <div>
                  <Modal.Heading>
                    {isEditing ? "Program Settings" : "Create Program"}
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    {isEditing
                      ? "Manage degree program details, parent department, and administrative actions."
                      : "Register an academic program assigned to a single parent department."}
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
                        return "Program name must be at least 2 characters.";
                      }

                      return null;
                    }}
                    value={name}
                    onChange={setName}
                  >
                    <Label>Program Name</Label>
                    <Input
                      placeholder="e.g. Bachelor of Science in Computer Science"
                      variant="secondary"
                    />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    name="code"
                    validate={(val) => {
                      if (!val || val.trim().length < 1) {
                        return "Program code (acronym) is required.";
                      }

                      return null;
                    }}
                    value={code}
                    onChange={(val) => setCode(val.toUpperCase())}
                  >
                    <Label>Code (Acronym)</Label>
                    <Input placeholder="e.g. BSCS" variant="secondary" />
                    <FieldError />
                  </TextField>

                  <Select
                    fullWidth
                    isRequired
                    isDisabled={Boolean(lockedDepartmentId) || departments.length === 0}
                    name="departmentId"
                    placeholder="Select parent department"
                    value={departmentId || null}
                    variant="secondary"
                    onChange={(val) => setDepartmentId(val ? String(val) : "")}
                  >
                    <Label>Department (1 Required)</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {departments.map((dept) => (
                          <ListBox.Item
                            key={dept.id}
                            id={dept.id}
                            textValue={`${dept.code} — ${dept.name}`}
                          >
                            {dept.code} — {dept.name}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    {departments.length === 0 ? (
                      <Description>
                        Create an academic department first before registering a program.
                      </Description>
                    ) : null}
                    <FieldError />
                  </Select>

                  {isEditing && programToEdit && canDelete && onRequestDelete ? (
                    <>
                      <Separator className="my-1" />
                      <DangerZoneSection
                        actionDescription={`Permanently remove ${programToEdit.name} (${programToEdit.code}).`}
                        actionTitle="Delete Program"
                        buttonLabel="Delete Program"
                        subtitle="Irreversible administrative actions for this program."
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
                      !code.trim() ||
                      !departmentId
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
                      "Create Program"
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            ) : (
              <>
                <Modal.Body className="flex flex-col gap-4 py-3">
                  {programToEdit && canDelete && onRequestDelete ? (
                    <DangerZoneSection
                      actionDescription={`Permanently remove ${programToEdit.name} (${programToEdit.code}).`}
                      actionTitle="Delete Program"
                      buttonLabel="Delete Program"
                      subtitle="Irreversible administrative actions for this program."
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
