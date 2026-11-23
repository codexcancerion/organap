"use client";

// Dynamic permission assignment matrix for a group in OrGanap.
import type { Permission } from "@/types";
import type { PermissionModuleGroup } from "@/features/groups/types";

import * as React from "react";
import { Accordion, Button, Checkbox, Chip, Spinner, toast } from "@heroui/react";
import { Check, ShieldCheck, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateGroupPermissionsBatch } from "@/features/groups/services/group_services";

export type GroupPermissionMatrixProps = {
  groupId: string;
  groupName: string;
  allPermissions: Permission[];
  initialPermissionIds: string[];
  isReadOnly?: boolean;
  onSaved?: () => void;
};

const MODULE_LABELS: Record<string, string> = {
  organizations: "Student Organizations",
  venues: "Campus Venues",
  semesters: "Academic Semesters",
  departments: "Academic Departments",
  programs: "Academic Programs",
  proposals: "Event Proposals & Workflow",
  events: "Campus Events & Registration",
  attachments: "Event Attachment Types",
  attendance: "Digital Attendance & QR",
  reports: "Participation & Analytics",
  users: "User Directory & Management",
  groups: "Groups & Permissions",
  settings: "System & Policy Settings",
};

export function GroupPermissionMatrix({
  groupId,
  groupName,
  allPermissions,
  initialPermissionIds,
  isReadOnly = false,
  onSaved,
}: GroupPermissionMatrixProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(initialPermissionIds),
  );
  const [pending, setPending] = React.useState(false);

  // Group allPermissions by module
  const modules = React.useMemo<PermissionModuleGroup[]>(() => {
    const map = new Map<string, Permission[]>();

    for (const perm of allPermissions) {
      const list = map.get(perm.module) ?? [];

      list.push(perm);
      map.set(perm.module, list);
    }

    return Array.from(map.entries()).map(([module, permissions]) => ({
      module,
      moduleLabel: MODULE_LABELS[module] ?? module.toUpperCase(),
      permissions,
    }));
  }, [allPermissions]);

  const handleToggle = (permissionId: string) => {
    if (isReadOnly || pending) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });
  };

  const handleToggleModuleAll = (modulePerms: Permission[]) => {
    if (isReadOnly || pending) return;

    const allModuleSelected = modulePerms.every((p) => selectedIds.has(p.id));

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (allModuleSelected) {
        for (const p of modulePerms) next.delete(p.id);
      } else {
        for (const p of modulePerms) next.add(p.id);
      }

      return next;
    });
  };

  const handleReset = () => {
    setSelectedIds(new Set(initialPermissionIds));
  };

  const handleSave = async () => {
    setPending(true);
    const res = await updateGroupPermissionsBatch(groupId, Array.from(selectedIds));

    setPending(false);

    if (!res.success) {
      toast.danger("Failed to update permissions", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Permissions updated", {
      description: `Updated permissions for group "${groupName}".`,
    });

    router.refresh();
    onSaved?.();
  };

  const hasChanges = React.useMemo(() => {
    if (selectedIds.size !== initialPermissionIds.length) return true;
    for (const id of initialPermissionIds) {
      if (!selectedIds.has(id)) return true;
    }

    return false;
  }, [selectedIds, initialPermissionIds]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Action Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-accent" size={18} />
          <span className="text-sm font-semibold text-foreground">
            {selectedIds.size} of {allPermissions.length} permissions granted
          </span>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <Button
              isDisabled={!hasChanges || pending}
              size="sm"
              variant="ghost"
              onClick={handleReset}
            >
              <Undo2 size={14} />
              Reset
            </Button>
            <Button
              isDisabled={!hasChanges || pending}
              size="sm"
              variant="primary"
              onClick={handleSave}
            >
              {pending ? (
                <>
                  <Spinner size="sm" />
                  Saving…
                </>
              ) : (
                <>
                  <Check size={14} />
                  Save Matrix
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Module Accordions */}
      <Accordion className="w-full flex flex-col gap-2" variant="surface">
        {modules.map(({ module, moduleLabel, permissions }) => {
          const selectedInModule = permissions.filter((p) => selectedIds.has(p.id)).length;
          const allSelected = selectedInModule === permissions.length && permissions.length > 0;

          return (
            <Accordion.Item key={module} className="border border-border/30 rounded-2xl overflow-hidden" id={module}>
              <Accordion.Heading>
                <Accordion.Trigger className="px-4 py-3 hover:bg-default/10 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{moduleLabel}</span>
                    <Chip color={selectedInModule > 0 ? "accent" : "default"} size="sm" variant="soft">
                      {selectedInModule} / {permissions.length}
                    </Chip>
                  </div>
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="p-4 bg-default/5 border-t border-border/20 flex flex-col gap-3">
                  {!isReadOnly && (
                    <div className="flex justify-end pb-1">
                      <button
                        className="text-xs text-accent hover:underline font-medium"
                        type="button"
                        onClick={() => handleToggleModuleAll(permissions)}
                      >
                        {allSelected ? "Deselect All in Module" : "Select All in Module"}
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {permissions.map((perm) => {
                      const isSelected = selectedIds.has(perm.id);

                      return (
                        <div
                          key={perm.id}
                          className="flex items-start gap-3 p-2.5 rounded-xl border border-border/30 hover:border-border transition-colors bg-surface cursor-pointer select-none"
                          onClick={() => handleToggle(perm.id)}
                        >
                          <Checkbox
                            isDisabled={isReadOnly || pending}
                            isSelected={isSelected}
                            onChange={() => handleToggle(perm.id)}
                          >
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground leading-tight">
                              {perm.name}
                            </span>
                            <span className="text-[11px] font-mono text-muted mt-0.5">
                              {perm.code}
                            </span>
                            {perm.description && (
                              <span className="text-[11px] text-muted mt-1 leading-snug">
                                {perm.description}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </div>
  );
}
