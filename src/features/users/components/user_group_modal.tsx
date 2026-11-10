"use client";

// Dynamic Group Memberships assignment modal for a user in OrGanap.
import type { UserGroup } from "@/types";
import type { AdminUserListItem } from "@/features/users/types";

import * as React from "react";
import {
  Button,
  Checkbox,
  Modal,
  toast,
} from "@heroui/react";
import { Users, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  assignUserToGroup,
  removeUserFromGroup,
} from "@/features/users/services/user_services";

export type UserGroupModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUserListItem | null;
  allGroups: UserGroup[];
  onSuccess?: () => void;
};

export function UserGroupModal({
  isOpen,
  onOpenChange,
  user,
  allGroups,
  onSuccess,
}: UserGroupModalProps) {
  const router = useRouter();
  const [pendingGroupIds, setPendingGroupIds] = React.useState<Set<string>>(new Set());

  if (!user) return null;

  const userGroupIds = new Set(user.groups.map((g) => g.id));

  const handleToggle = async (group: UserGroup) => {
    const isCurrentlyMember = userGroupIds.has(group.id);

    setPendingGroupIds((prev) => new Set(prev).add(group.id));

    if (isCurrentlyMember) {
      const res = await removeUserFromGroup(user.id, group.id);

      setPendingGroupIds((prev) => {
        const next = new Set(prev);

        next.delete(group.id);

        return next;
      });

      if (!res.success) {
        toast.danger("Failed to remove group", { description: res.error.message });

        return;
      }

      toast.success("Group membership removed", {
        description: `Removed "${user.displayName}" from group "${group.name}".`,
      });
    } else {
      const res = await assignUserToGroup(user.id, group.id);

      setPendingGroupIds((prev) => {
        const next = new Set(prev);

        next.delete(group.id);

        return next;
      });

      if (!res.success) {
        toast.danger("Failed to assign group", { description: res.error.message });

        return;
      }

      toast.success("Group membership assigned", {
        description: `Added "${user.displayName}" to group "${group.name}".`,
      });
    }

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
                  <Users size={20} />
                </div>
                <div>
                  <Modal.Heading>Manage Group Memberships</Modal.Heading>
                  <span className="text-xs text-muted">
                    User: {user.displayName || user.schoolId || user.id}
                  </span>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body className="py-3 flex flex-col gap-2.5">
              <span className="text-xs text-muted">
                Select the dynamic groups this campus member belongs to. Group permissions will apply immediately.
              </span>

              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar pt-1">
                {allGroups.map((group) => {
                  const isMember = userGroupIds.has(group.id);
                  const isToggling = pendingGroupIds.has(group.id);

                  return (
                    <div
                      key={group.id}
                      className="flex items-start gap-3 p-3 rounded-2xl border border-border/30 hover:border-border/60 transition-colors bg-default/5 cursor-pointer select-none"
                      onClick={() => !isToggling && handleToggle(group)}
                    >
                      <Checkbox
                        isDisabled={isToggling}
                        isSelected={isMember}
                        onChange={() => !isToggling && handleToggle(group)}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Shield className="text-accent shrink-0" size={14} />
                          <span className="text-sm font-semibold text-foreground truncate">
                            {group.name}
                          </span>
                        </div>
                        {group.description && (
                          <span className="text-xs text-muted mt-0.5 leading-snug">
                            {group.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {allGroups.length === 0 && (
                  <p className="text-xs text-muted italic p-4 text-center">
                    No dynamic groups have been created yet.
                  </p>
                )}
              </div>
            </Modal.Body>

            <Modal.Footer className="border-t border-border/30 pt-3 flex items-center justify-end">
              <Button slot="close" variant="primary">
                Done
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
