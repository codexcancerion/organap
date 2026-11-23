"use client";

import type { Department } from "@/types/domain";

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
  TextField,
  toast,
} from "@heroui/react";
import { Landmark, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { DangerZoneSection } from "@/components/ui/danger_zone_section";

import {
  createDepartment,
  updateDepartment,
  validateDepartmentInput,
} from "../services/department_services";

export type DepartmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  departmentToEdit?: Department | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onRequestDelete?: () => void;
};

export function DepartmentModal({
  isOpen,
  onClose,
  departmentToEdit,
  canEdit = true,
  canDelete = false,
  onRequestDelete,
}: DepartmentModalProps) {
  const router = useRouter();
  const isEditing = Boolean(departmentToEdit);

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(departmentToEdit?.name ?? "");
      setCode(departmentToEdit?.code ?? "");
    }
  }, [isOpen, departmentToEdit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = { name, code };
    const validation = validateDepartmentInput(payload);

    if (!validation.isValid) {
      toast.danger("Validation error", { description: validation.error });

      return;
    }

    setIsSubmitting(true);
    try {
      const res =
        isEditing && departmentToEdit
          ? await updateDepartment(departmentToEdit.id, payload)
          : await createDepartment(payload);

      if (!res.success) {
        toast.danger(
          isEditing ? "Failed to update department" : "Failed to create department",
          { description: res.error.message },
        );

        return;
      }

      const normalizedCode = code.trim().toUpperCase();

      toast.success(isEditing ? "Department updated" : "Department created", {
        description: isEditing
          ? `Updated ${name.trim()} (${normalizedCode}).`
          : `Added ${name.trim()} (${normalizedCode}).`,
      });
      onClose();
      router.refresh();
    } catch (err: unknown) {
      toast.danger("Unexpected error", {
        description: err instanceof Error ? err.message : "Could not save department.",
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
                  {isEditing ? <Settings size={18} /> : <Landmark size={18} />}
                </div>
                <div>
                  <Modal.Heading>
                    {isEditing ? "Department Settings" : "Create Department"}
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    {isEditing
                      ? "Manage department details, acronym code, and administrative actions."
                      : "Define an academic department or school and its acronym code."}
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
                        return "Department name must be at least 2 characters.";
                      }

                      return null;
                    }}
                    value={name}
                    onChange={setName}
                  >
                    <Label>Department Name</Label>
                    <Input
                      placeholder="e.g. School of Accountancy, Management, Computing and Information Studies"
                      variant="secondary"
                    />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    name="code"
                    validate={(val) => {
                      if (!val || val.trim().length < 1) {
                        return "Department code (acronym) is required.";
                      }

                      return null;
                    }}
                    value={code}
                    onChange={(val) => setCode(val.toUpperCase())}
                  >
                    <Label>Code (Acronym)</Label>
                    <Input placeholder="e.g. SAMCIS" variant="secondary" />
                    <FieldError />
                  </TextField>

                  {isEditing && departmentToEdit && canDelete && onRequestDelete ? (
                    <>
                      <Separator className="my-1" />
                      <DangerZoneSection
                        actionDescription={`Permanently remove ${departmentToEdit.name} (${departmentToEdit.code}).`}
                        actionTitle="Delete Department"
                        buttonLabel="Delete Department"
                        subtitle="Irreversible administrative actions for this department."
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
                    isDisabled={isSubmitting || name.trim().length < 2 || !code.trim()}
                    size="sm"
                    type="submit"
                    variant="primary"
                  >
                    {isSubmitting ? (
                      <Spinner color="current" size="sm" />
                    ) : isEditing ? (
                      "Save Changes"
                    ) : (
                      "Create Department"
                    )}
                  </Button>
                </Modal.Footer>
              </Form>
            ) : (
              <>
                <Modal.Body className="flex flex-col gap-4 py-3">
                  {departmentToEdit && canDelete && onRequestDelete ? (
                    <DangerZoneSection
                      actionDescription={`Permanently remove ${departmentToEdit.name} (${departmentToEdit.code}).`}
                      actionTitle="Delete Department"
                      buttonLabel="Delete Department"
                      subtitle="Irreversible administrative actions for this department."
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
