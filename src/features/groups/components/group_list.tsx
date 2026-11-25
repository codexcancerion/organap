"use client";

// Dynamic Groups overview and management list for OrGanap.
import type { Permission } from "@/types";
import type { AdminGroupListItem } from "@/features/groups/types";

import * as React from "react";
import {
  AlertDialog,
  Button,
  Card,
  Chip,
  EmptyState,
  Modal,
  SearchField,
  Spinner,
  toast,
} from "@heroui/react";
import {
  KeyRound,
  Lock,
  Plus,
  Settings,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteGroup } from "@/features/groups/services/group_services";
import { isSystemGroupRecord } from "@/features/groups/types";
import { PageHeader } from "@/components/layout/page_header";

import { GroupModal } from "./group_modal";
import { GroupPermissionMatrix } from "./group_permission_matrix";

export type GroupListProps = {
  groups: AdminGroupListItem[];
  allPermissions: Permission[];
};

export function GroupList({ groups, allPermissions }: GroupListProps) {
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [groupToEdit, setGroupToEdit] = React.useState<AdminGroupListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminGroupListItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Permission Matrix Modal State
  const [matrixOpen, setMatrixOpen] = React.useState(false);
  const [matrixGroup, setMatrixGroup] = React.useState<AdminGroupListItem | null>(null);

  const filteredGroups = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return groups;

    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)),
    );
  }, [groups, search]);

  const handleOpenCreate = () => {
    setGroupToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (group: AdminGroupListItem) => {
    setGroupToEdit(group);
    setModalOpen(true);
  };

  const handleOpenMatrix = (group: AdminGroupListItem) => {
    setMatrixGroup(group);
    setMatrixOpen(true);
  };

  const handleRequestDelete = (group: AdminGroupListItem) => {
    if (isSystemGroupRecord(group)) {
      toast.danger("Action Prohibited", {
        description: `System group "${group.name}" is essential to OrGanap and cannot be deleted.`,
      });

      return;
    }

    setDeleteTarget(group);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await deleteGroup(
        deleteTarget.id,
        deleteTarget.name,
        deleteTarget.isSystem,
      );

      if (!res.success) {
        toast.danger("Failed to delete group", { description: res.error.message });

        return;
      }

      toast.success("Group deleted", {
        description: `Group "${deleteTarget.name}" has been removed.`,
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Page Header */}
      <PageHeader
        actions={
          <Button size="md" variant="primary" onPress={handleOpenCreate}>
            <Plus size={16} />
            Create Group
          </Button>
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {groups.length} Groups
          </Chip>
        }
        description="Configure dynamic institutional roles and granular permission matrices for campus personnel."
        title="Dynamic Groups & Permissions"
      />

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <SearchField
          aria-label="Search groups"
          className="w-full sm:w-80"
          name="group-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search groups…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <span className="text-xs text-muted">
          Showing {filteredGroups.length} of {groups.length} groups
        </span>
      </div>

      {/* Group Cards Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {filteredGroups.map((group) => {
            const isSystem = isSystemGroupRecord(group);

            return (
              <Card
                key={group.id}
                className="border border-border/30 hover:border-border/60 transition-colors bg-surface p-4 gap-3"
              >
                <Card.Header className="flex flex-col gap-1 p-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base text-foreground truncate">
                      {group.name}
                    </span>
                    {isSystem && (
                      <Chip className="text-[10px]" color="default" size="sm" variant="soft">
                        <Lock className="mr-1 inline" size={10} />
                        System Group
                      </Chip>
                    )}
                  </div>
                  {group.description ? (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  ) : (
                    <span className="text-xs text-muted italic">No description provided</span>
                  )}
                </Card.Header>

                <Card.Content className="p-0 flex-initial">
                  <div className="flex items-center gap-4 text-xs text-muted font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="text-accent" size={14} />
                      <span>{group.memberCount} Members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="text-warning" size={14} />
                      <span>{group.permissionIds.length} Permissions</span>
                    </div>
                  </div>
                </Card.Content>

                <Card.Footer className="p-0 pt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      aria-label={`Edit ${group.name}`}
                      size="sm"
                      variant="ghost"
                      onPress={() => handleOpenEdit(group)}
                    >
                      <Settings size={15} />
                    </Button>
                    {!isSystem && (
                      <Button
                        aria-label={`Delete ${group.name}`}
                        className="text-danger hover:bg-danger/10"
                        size="sm"
                        variant="ghost"
                        onPress={() => handleRequestDelete(group)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => handleOpenMatrix(group)}
                  >
                    <KeyRound size={14} />
                    Configure Permissions
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border border-dashed border-border/60 bg-surface p-10 text-center items-center">
          <EmptyState className="flex flex-col items-center text-center gap-2">
            <Shield className="text-muted size-9" />
            <p className="text-sm font-semibold text-foreground">
              No Dynamic Groups Found
            </p>
            <p className="text-xs text-muted max-w-sm">
              No groups matched your search query. Create a new dynamic group or clear the filter.
            </p>
          </EmptyState>
        </Card>
      )}

      {/* Create / Edit Group Modal */}
      <GroupModal
        groupToEdit={groupToEdit}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
      />

      {/* Delete Group Confirmation AlertDialog */}
      <AlertDialog
        isOpen={!!deleteTarget}
        onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}
      >
        <AlertDialog.Backdrop variant="blur">
          <AlertDialog.Container size="sm">
            <AlertDialog.Dialog className="border border-danger/30 shadow-xl bg-surface">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Delete Dynamic Group?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? Members assigned to this group will lose the permissions granted solely by it.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer className="flex items-center justify-end gap-2">
                <Button
                  isDisabled={isDeleting}
                  size="sm"
                  variant="tertiary"
                  onPress={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={isDeleting}
                  isPending={isDeleting}
                  size="sm"
                  variant="danger"
                  onPress={handleConfirmDelete}
                >
                  {isDeleting ? <Spinner color="current" size="sm" /> : null}
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      {/* Permissions Matrix Modal */}
      {matrixGroup && (
        <Modal isOpen={matrixOpen} onOpenChange={setMatrixOpen}>
          <Modal.Backdrop variant="blur">
            <Modal.Container size="lg">
              <Modal.Dialog className="border border-border/40 shadow-xl bg-surface max-h-[85vh] flex flex-col">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-accent/10 text-accent">
                      <KeyRound size={20} />
                    </div>
                    <div>
                      <Modal.Heading>Permissions: {matrixGroup.name}</Modal.Heading>
                      <span className="text-xs text-muted">
                        Grant or revoke granular system permissions for this group
                      </span>
                    </div>
                  </div>
                </Modal.Header>

                <Modal.Body className="overflow-y-auto no-scrollbar py-3">
                  <GroupPermissionMatrix
                    allPermissions={allPermissions}
                    groupId={matrixGroup.id}
                    groupName={matrixGroup.name}
                    initialPermissionIds={matrixGroup.permissionIds}
                    onSaved={() => {
                      setMatrixOpen(false);
                      router.refresh();
                    }}
                  />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      )}
    </div>
  );
}
