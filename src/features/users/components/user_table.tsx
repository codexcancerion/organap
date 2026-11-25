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
  EmptyState,
  SearchField,
  Table,
} from "@heroui/react";
import {
  Building2,
  Edit2,
  ShieldAlert,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";
import { CatalogFilterDropdown } from "@/components/ui/catalog_filter_dropdown";

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
      if (q) {
        const nameMatch = user.displayName?.toLowerCase().includes(q);
        const idMatch = user.schoolId?.toLowerCase().includes(q);
        const emailMatch = user.email?.toLowerCase().includes(q);
        const orgMatch = (user.organizations ?? []).some(
          (o) =>
            o.acronym.toLowerCase().includes(q) ||
            o.name.toLowerCase().includes(q)
        );

        if (!nameMatch && !idMatch && !emailMatch && !orgMatch) return false;
      }

      if (selectedGroup !== "all") {
        const inGroup = user.groups.some(
          (g) => g.id === selectedGroup || g.name === selectedGroup
        );

        if (!inGroup) return false;
      }

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
      {/* Standard Page Header */}
      <PageHeader
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {users.length} Users Registered
          </Chip>
        }
        description="Inspect verified campus profiles, organization affiliations, staff flags, and dynamic group assignments."
        title="User Directory & Accounts"
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search users by name, ID, email, or organization"
          className="w-full md:w-80"
          name="user-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by name, ID, email, or org…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <CatalogFilterDropdown
          filters={[
            {
              id: "group",
              label: "Role Group",
              ariaLabel: "Filter by group",
              value: selectedGroup,
              onChange: setSelectedGroup,
              options: [
                { id: "all", label: "All Groups" },
                ...allGroups.map((g) => ({ id: g.id, label: g.name })),
              ],
            },
            {
              id: "status",
              label: "Account Status",
              ariaLabel: "Filter by status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { id: "all", label: "All Statuses" },
                { id: "active", label: "Active Only" },
                { id: "inactive", label: "Inactive Only" },
                { id: "staff", label: "Staff Only" },
                { id: "superuser", label: "Superusers Only" },
              ],
            },
          ]}
        />
      </div>

      {/* Roster Table */}
      <Card className="border border-border/30 overflow-hidden bg-surface shadow-xs p-0">
        {filteredUsers.length > 0 ? (
          <Table className="w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="Campus User Directory Table">
                <Table.Header>
                  <Table.Column isRowHeader className="py-3 px-4 text-xs font-semibold text-muted">
                    User
                  </Table.Column>
                  <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">
                    Status
                  </Table.Column>
                  <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">
                    Role, Groups &amp; Orgs
                  </Table.Column>
                  <Table.Column className="py-3 px-4 text-xs font-semibold text-muted text-end">
                    Actions
                  </Table.Column>
                </Table.Header>
                <Table.Body items={filteredUsers}>
                  {(user) => (
                    <Table.Row
                      key={user.id}
                      className="border-t border-border/20 hover:bg-default/5 transition-colors"
                    >
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
                            <span className="text-xs text-muted font-mono truncate">
                              {user.schoolId ? `ID: ${user.schoolId}` : user.id.slice(0, 8)}
                              {user.email ? ` · ${user.email}` : ""}
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
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
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
                          {(user.organizations ?? []).map((org) => (
                            <Chip
                              key={org.id}
                              className="text-[10px]"
                              color="accent"
                              size="sm"
                              variant="soft"
                            >
                              <Building2 className="mr-1 inline" size={10} />
                              {org.acronym}
                              {org.position ? ` · ${org.position}` : ""}
                            </Chip>
                          ))}
                          {!user.isSuperuser &&
                          user.groups.length === 0 &&
                          (user.organizations ?? []).length === 0 ? (
                            <span className="text-xs text-muted italic">No groups</span>
                          ) : null}
                        </div>
                      </Table.Cell>

                      <Table.Cell className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            aria-label={`Manage groups for ${user.displayName}`}
                            size="sm"
                            variant="ghost"
                            onPress={() => handleOpenGroups(user)}
                          >
                            <Users className="mr-1 inline" size={14} />
                            Groups
                          </Button>
                          <Button
                            aria-label={`Edit ${user.displayName}`}
                            size="sm"
                            variant="secondary"
                            onPress={() => handleOpenEdit(user)}
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
        ) : (
          <EmptyState className="flex flex-col items-center text-center gap-2 p-10">
            <Users className="text-muted size-8" />
            <p className="text-sm font-semibold text-foreground">
              No Matching Users
            </p>
            <p className="text-xs text-muted max-w-sm">
              No campus accounts matched your search query or group/status filters.
            </p>
          </EmptyState>
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
