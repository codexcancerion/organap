"use client";

// Dynamic Groups overview and management list for OrGanap.
import type { Permission } from "@/types";
import type { AdminGroupListItem } from "@/features/groups/types";

import * as React from "react";
import {
  Button,
  Card,
  Chip,
  Modal,
  TextField,
  Input,
  toast,
} from "@heroui/react";
import {
  Shield,
  Plus,
  Users,
  KeyRound,
  Trash2,
  Settings,
  Search,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteGroup } from "@/features/groups/services/group_services";
import { isProtectedSystemGroup } from "@/features/groups/types";
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

  const handleDeleteGroup = async (group: AdminGroupListItem) => {
    if (isProtectedSystemGroup(group.name)) {
      toast.danger("Action Prohibited", {
        description: `System group "${group.name}" is essential to OrGanap and cannot be deleted.`,
      });

      return;
    }

    if (!confirm(`Are you sure you want to delete the group "${group.name}"? Members will be unassigned.`)) {
      return;
    }

    const res = await deleteGroup(group.id, group.name);

    if (!res.success) {
      toast.danger("Failed to delete group", { description: res.error.message });

      return;
    }

    toast.success("Group deleted", {
      description: `Group "${group.name}" has been removed.`,
    });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Page Header */}
      <PageHeader
        actions={
          <Button size="md" variant="primary" onClick={handleOpenCreate}>
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
        <div className="w-full sm:w-72">
          <TextField
            aria-label="Search groups"
            value={search}
            onChange={(val) => setSearch(val)}
          >
            <div className="relative w-full">
              <Input
                className="pl-9"
                placeholder="Search groups..."
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                size={15}
              />
            </div>
          </TextField>
        </div>

        <span className="text-xs text-muted">
          Showing {filteredGroups.length} of {groups.length} groups
        </span>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGroups.map((group) => {
          const isSystem = isProtectedSystemGroup(group.name);

          return (
            <Card key={group.id} className="border border-border/30 hover:border-border/60 transition-colors bg-surface">
              <Card.Header className="flex items-start gap-3 pb-2">
                <div className="p-2.5 rounded-2xl bg-accent/10 text-accent shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex flex-col min-w-0">
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
                    <p className="text-xs text-muted mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  ) : (
                    <span className="text-xs text-muted italic mt-1">No description provided</span>
                  )}
                </div>
              </Card.Header>

              <Card.Content className="pt-2">
                <div className="flex items-center gap-4 text-xs text-muted">
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

              <Card.Footer className="border-t border-border/20 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    aria-label={`Edit ${group.name}`}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(group)}
                  >
                    <Settings size={15} />
                  </Button>
                  {!isSystem && (
                    <Button
                      aria-label={`Delete ${group.name}`}
                      className="text-danger hover:bg-danger/10"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenMatrix(group)}
                >
                  <KeyRound size={14} />
                  Configure Permissions
                </Button>
              </Card.Footer>
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/60 bg-surface">
          <p className="text-sm text-muted">No dynamic groups found matching your search.</p>
        </div>
      )}

      {/* Create / Edit Group Modal */}
      <GroupModal
        groupToEdit={groupToEdit}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
      />

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
