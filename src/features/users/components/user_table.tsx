"use client";

// User Roster Directory & Administration Table for OrGanap.
import type { UserGroup } from "@/types";
import type { AdminUserListItem } from "@/features/users/types";

import * as React from "react";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Table,
  TextField,
} from "@heroui/react";
import {
  Search,
  Users,
  ShieldAlert,
  Edit2,
  Filter,
} from "lucide-react";

import { UserEditModal } from "./user_edit_modal";
import { UserGroupModal } from "./user_group_modal";

export type UserTableProps = {
  users: AdminUserListItem[];
  allGroups: UserGroup[];
};

function initialsFor(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);

  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();

  return name.slice(0, 2).toUpperCase();
}

export function UserTable({ users, allGroups }: UserTableProps) {
  const [search, setSearch] = React.useState("");
  const [selectedGroup, setSelectedGroup] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [editUser, setEditUser] = React.useState<AdminUserListItem | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  const [groupUser, setGroupUser] = React.useState<AdminUserListItem | null>(null);
  const [groupModalOpen, setGroupModalOpen] = React.useState(false);

  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((user) => {
      // 1. Search Query
      if (q) {
        const nameMatch = user.displayName?.toLowerCase().includes(q);
        const idMatch = user.schoolId?.toLowerCase().includes(q);

        if (!nameMatch && !idMatch) return false;
      }

      // 2. Group Filter
      if (selectedGroup !== "all") {
        const inGroup = user.groups.some((g) => g.id === selectedGroup || g.name === selectedGroup);

        if (!inGroup) return false;
      }

      // 3. Status Filter
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;
      if (statusFilter === "staff" && !user.isStaff) return false;
      if (statusFilter === "superuser" && !user.isSuperuser) return false;

      return true;
    });
  }, [users, search, selectedGroup, statusFilter]);

  const handleOpenEdit = (user: AdminUserListItem) => {
    setEditUser(user);
    setEditModalOpen(true);
  };

  const handleOpenGroups = (user: AdminUserListItem) => {
    setGroupUser(user);
    setGroupModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-surface border border-border/40 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              User Directory & Accounts
            </h1>
            <Chip color="accent" size="sm" variant="soft">
              {users.length} Users Registered
            </Chip>
          </div>
          <p className="text-xs text-muted">
            Inspect verified campus profiles, toggle staff and account status, and assign dynamic groups.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full md:w-80">
          <TextField
            aria-label="Search users by name or ID"
            value={search}
            onChange={(val) => setSearch(val)}
          >
            <div className="relative w-full">
              <Input
                className="pl-9"
                placeholder="Search by name or Student/Staff ID…"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                size={15}
              />
            </div>
          </TextField>
        </div>

        {/* Group & Status Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Filter size={14} />
            <span>Group:</span>
          </div>
          <select
            aria-label="Filter by group"
            className="text-xs bg-surface border border-border/40 rounded-xl px-2.5 py-1.5 text-foreground focus:outline-accent"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="all">All Groups</option>
            {allGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            className="text-xs bg-surface border border-border/40 rounded-xl px-2.5 py-1.5 text-foreground focus:outline-accent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="staff">Staff Only</option>
            <option value="superuser">Superusers Only</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <Card className="border border-border/30 overflow-hidden bg-surface shadow-xs">
        <Table className="w-full">
          <Table.ScrollContainer>
            <Table.Content aria-label="Campus User Directory Table">
              <Table.Header>
                <Table.Column isRowHeader className="py-3 px-4 text-xs font-semibold text-muted">User</Table.Column>
                <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">Status</Table.Column>
                <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">Role & Groups</Table.Column>
                <Table.Column className="py-3 px-4 text-xs font-semibold text-muted text-end">Actions</Table.Column>
              </Table.Header>
              <Table.Body items={filteredUsers}>
                {(user) => (
                  <Table.Row key={user.id} className="border-t border-border/20 hover:bg-default/5 transition-colors">
                    <Table.Cell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 text-xs font-bold shrink-0" variant="soft">
                          {user.avatarUrl ? (
                            <Avatar.Image
                              alt={user.displayName ?? user.id}
                              className="object-cover"
                              src={user.avatarUrl}
                            />
                          ) : null}
                          <Avatar.Fallback className="bg-accent/15 text-accent font-semibold">
                            {initialsFor(user.displayName)}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {user.displayName || "Anonymous User"}
                          </span>
                          <span className="text-xs text-muted font-mono">
                            {user.schoolId ? `ID: ${user.schoolId}` : user.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell className="py-3 px-4">
                      {user.isActive ? (
                        <Chip className="text-[11px]" color="success" size="sm" variant="soft">
                          Active
                        </Chip>
                      ) : (
                        <Chip className="text-[11px]" color="danger" size="sm" variant="soft">
                          Inactive
                        </Chip>
                      )}
                    </Table.Cell>

                    <Table.Cell className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                        {user.isSuperuser && (
                          <Chip className="text-[10px] font-semibold" color="danger" size="sm" variant="soft">
                            <ShieldAlert className="mr-1 inline" size={10} />
                            SUPERUSER
                          </Chip>
                        )}
                        {user.isStaff && !user.isSuperuser && (
                          <Chip className="text-[10px] font-semibold" color="accent" size="sm" variant="soft">
                            STAFF
                          </Chip>
                        )}
                        {user.groups.map((group) => (
                          <Chip key={group.id} className="text-[10px]" color="default" size="sm" variant="soft">
                            {group.name}
                          </Chip>
                        ))}
                        {!user.isSuperuser && user.groups.length === 0 && (
                          <span className="text-xs text-muted italic">No groups</span>
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          aria-label={`Manage groups for ${user.displayName}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenGroups(user)}
                        >
                          <Users className="mr-1 inline" size={14} />
                          Groups
                        </Button>
                        <Button
                          aria-label={`Edit ${user.displayName}`}
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenEdit(user)}
                        >
                          <Edit2 className="mr-1 inline" size={14} />
                          Edit
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="p-10 text-center">
            <p className="text-sm text-muted">No users found matching your search or filters.</p>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      <UserEditModal
        isOpen={editModalOpen}
        user={editUser}
        onOpenChange={setEditModalOpen}
      />

      {/* Group Memberships Modal */}
      <UserGroupModal
        allGroups={allGroups}
        isOpen={groupModalOpen}
        user={groupUser}
        onOpenChange={setGroupModalOpen}
      />
    </div>
  );
}
