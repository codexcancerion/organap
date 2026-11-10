"use client";

// Create / Edit Dynamic Group Modal in OrGanap.
import type { AdminGroupListItem } from "@/features/groups/types";

import * as React from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { Shield, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { createGroup, updateGroup } from "@/features/groups/services/group_services";
import { isProtectedSystemGroup } from "@/features/groups/types";

export type GroupModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: AdminGroupListItem | null;
  onSuccess?: () => void;
};

export function GroupModal({
  isOpen,
  onOpenChange,
  groupToEdit,
  onSuccess,
}: GroupModalProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const isEditing = Boolean(groupToEdit);
  const isSystemGroup = isEditing && groupToEdit ? isProtectedSystemGroup(groupToEdit.name) : false;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (isEditing && groupToEdit) {
      const res = await updateGroup({
        groupId: groupToEdit.id,
        name: isSystemGroup ? groupToEdit.name : name,
        description: description || null,
      });

      setPending(false);

      if (!res.success) {
        toast.danger("Failed to update group", { description: res.error.message });

        return;
      }

      toast.success("Group updated", {
        description: `Group "${groupToEdit.name}" has been updated.`,
      });
    } else {
      const res = await createGroup({
        name,
        description: description || null,
      });

      setPending(false);

      if (!res.success) {
        toast.danger("Failed to create group", { description: res.error.message });

        return;
      }

      toast.success("Group created", {
        description: `Group "${name}" has been created successfully.`,
      });
    }

    onOpenChange(false);
    router.refresh();
    onSuccess?.();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="md">
          <Modal.Dialog className="border border-border/40 shadow-lg bg-surface">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Shield size={20} />
                </div>
                <Modal.Heading>
                  {isEditing ? "Edit Dynamic Group" : "Create Dynamic Group"}
                </Modal.Heading>
              </div>
            </Modal.Header>

            <Form validationBehavior="native" onSubmit={handleSubmit}>
              <Modal.Body className="flex flex-col gap-4 py-3">
                <TextField
                  defaultValue={groupToEdit?.name ?? ""}
                  isReadOnly={isSystemGroup}
                  isRequired={!isSystemGroup}
                  name="name"
                  type="text"
                  validate={(value) => {
                    if (!value || value.trim().length < 2) {
                      return "Group name must be at least 2 characters";
                    }

                    return null;
                  }}
                >
                  <Label>Group Name</Label>
                  <Input placeholder="e.g. Venue Managers, College Deans, Volunteers" />
                  <FieldError />
                </TextField>

                {isSystemGroup && (
                  <span className="text-xs text-muted -mt-2">
                    This is an essential system group and its name is protected.
                  </span>
                )}

                <TextField
                  defaultValue={groupToEdit?.description ?? ""}
                  name="description"
                  type="text"
                >
                  <Label>Description</Label>
                  <Input placeholder="Purpose and authority scope of this user group" />
                  <FieldError />
                </TextField>
              </Modal.Body>

              <Modal.Footer className="border-t border-border/30 pt-3 flex items-center justify-end gap-2">
                <Button
                  isDisabled={pending}
                  slot="close"
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={pending}
                  type="submit"
                  variant="primary"
                >
                  {pending ? (
                    <>
                      <Spinner size="sm" />
                      Saving…
                    </>
                  ) : isEditing ? (
                    "Save Changes"
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Create Group
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
