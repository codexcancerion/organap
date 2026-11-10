"use client";

// Edit User Profile & Administrative Flags Modal for OrGanap.
import type { AdminUserListItem } from "@/features/users/types";

import * as React from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { UserCheck, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateUserProfile } from "@/features/users/services/user_services";
import { useAuth } from "@/contexts/auth_context";

export type UserEditModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserListItem | null;
  onSuccess?: () => void;
};

export function UserEditModal({
  isOpen,
  onOpenChange,
  user,
  onSuccess,
}: UserEditModalProps) {
  const router = useRouter();
  const { isSuperuser: actingUserIsSuperuser } = useAuth();

  const [pending, setPending] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);
  const [isStaff, setIsStaff] = React.useState(false);
  const [isSuperuser, setIsSuperuser] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(user.isActive);
       
      setIsStaff(user.isStaff);
       
      setIsSuperuser(user.isSuperuser);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const displayName = String(formData.get("displayName") ?? "").trim();
    const schoolId = String(formData.get("schoolId") ?? "").trim();

    const res = await updateUserProfile({
      userId: user.id,
      displayName,
      schoolId: schoolId || null,
      isActive,
      isStaff,
      ...(actingUserIsSuperuser ? { isSuperuser } : {}),
    });

    setPending(false);

    if (!res.success) {
      toast.danger("Failed to update user", { description: res.error.message });

      return;
    }

    toast.success("User updated", {
      description: `Account profile for "${displayName || user.id}" has been updated.`,
    });

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
                  <UserCheck size={20} />
                </div>
                <div>
                  <Modal.Heading>Edit User Profile</Modal.Heading>
                  <span className="text-xs text-muted">
                    ID: {user.id.slice(0, 8)}…
                  </span>
                </div>
              </div>
            </Modal.Header>

            <Form validationBehavior="native" onSubmit={handleSubmit}>
              <Modal.Body className="flex flex-col gap-4 py-3">
                <TextField
                  isRequired
                  defaultValue={user.displayName ?? ""}
                  name="displayName"
                  type="text"
                  validate={(val) => {
                    if (!val || val.trim().length < 2) {
                      return "Name must be at least 2 characters";
                    }

                    return null;
                  }}
                >
                  <Label>Full Name</Label>
                  <Input placeholder="Juan Dela Cruz" />
                  <FieldError />
                </TextField>

                <TextField
                  defaultValue={user.schoolId ?? ""}
                  name="schoolId"
                  type="text"
                >
                  <Label>School / Student ID</Label>
                  <Input placeholder="e.g. 2026-00123" />
                  <FieldError />
                </TextField>

                <div className="p-3.5 rounded-2xl bg-default/10 border border-border/20 flex flex-col gap-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Administrative Flags
                  </span>

                  <Switch isSelected={isActive} onChange={setIsActive}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <div className="flex flex-col">
                        <Label>Active Account</Label>
                        <span className="text-xs text-muted">Allow user to sign in and interact with OrGanap</span>
                      </div>
                    </Switch.Content>
                  </Switch>

                  <Switch isSelected={isStaff} onChange={setIsStaff}>
                    <Switch.Content>
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <div className="flex flex-col">
                        <Label>Staff Access</Label>
                        <span className="text-xs text-muted">Grants access to administration modules</span>
                      </div>
                    </Switch.Content>
                  </Switch>

                  {actingUserIsSuperuser ? (
                    <Switch isSelected={isSuperuser} onChange={setIsSuperuser}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <div className="flex flex-col">
                          <Label className="text-danger flex items-center gap-1">
                            <ShieldAlert size={14} />
                            Superuser Status
                          </Label>
                          <span className="text-xs text-muted">Bypasses all permission checks globally</span>
                        </div>
                      </Switch.Content>
                    </Switch>
                  ) : null}
                </div>
              </Modal.Body>

              <Modal.Footer className="border-t border-border/30 pt-3 flex items-center justify-end gap-2">
                <Button isDisabled={pending} slot="close" type="button" variant="ghost">
                  Cancel
                </Button>
                <Button isDisabled={pending} type="submit" variant="primary">
                  {pending ? (
                    <>
                      <Spinner size="sm" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
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
