"use client";

import type { PermissionSummary, ProfileOverview } from "../types";

import * as React from "react";
import NextLink from "next/link";
import { Avatar, Button, Card, Chip, Surface } from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  FileText,
  IdCard,
  KeyRound,
  Mail,
  Settings,
  Shield,
  Ticket,
  CheckCircle2,
  Users,
} from "lucide-react";

import { useAuth } from "@/contexts/auth_context";
import { PageHeader } from "@/components/layout/page_header";
import { formatDate } from "@/utils/formatters";

import { ProfileForm } from "./profile_form";
import { ProfileSecurityCard } from "./profile_security_card";

function initialsFor(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();

    return name.slice(0, 2).toUpperCase();
  }

  return (email || "U").slice(0, 2).toUpperCase();
}

function groupPermissionsByModule(
  permissions: PermissionSummary[],
): Array<{ module: string; items: PermissionSummary[] }> {
  const map = new Map<string, PermissionSummary[]>();

  for (const perm of permissions) {
    const list = map.get(perm.module) ?? [];

    list.push(perm);
    map.set(perm.module, list);
  }

  return Array.from(map.entries()).map(([module, items]) => ({ module, items }));
}

export function ProfileView({ overview }: { overview: ProfileOverview }) {
  const { user: contextUser } = useAuth();
  // Prefer AuthContext user once mounted so sidebar/profile edits reflect immediately
  const activeUser = contextUser ?? overview.user;
  const [showAllPermissions, setShowAllPermissions] = React.useState(false);

  const groupedPermissions = React.useMemo(
    () => groupPermissionsByModule(overview.permissionDetails),
    [overview.permissionDetails],
  );

  const displayName =
    activeUser.displayName || activeUser.email.split("@")[0] || "Account Profile";

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          <NextLink href="/settings">
            <Button size="sm" variant="secondary">
              <Settings size={15} />
              Preferences & Settings
            </Button>
          </NextLink>
        }
        badge={
          activeUser.isSuperuser ? (
            <Chip color="danger" size="sm" variant="soft">
              Superuser
            </Chip>
          ) : activeUser.isActive ? (
            <Chip color="success" size="sm" variant="soft">
              Active Account
            </Chip>
          ) : (
            <Chip color="default" size="sm" variant="soft">
              Inactive
            </Chip>
          )
        }
        description="Manage your campus identity, avatar photo, account password, and organization memberships."
        media={
          <Avatar className="w-14 h-14 text-base font-bold rounded-2xl bg-accent/10 text-accent border border-accent/20">
            {activeUser.avatarUrl ? (
              <Avatar.Image
                alt={displayName}
                className="object-cover"
                src={activeUser.avatarUrl}
              />
            ) : null}
            <Avatar.Fallback className="bg-accent/10 text-accent font-bold">
              {initialsFor(activeUser.displayName, activeUser.email)}
            </Avatar.Fallback>
          </Avatar>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <Mail size={13} />
              {activeUser.email}
            </span>
            {activeUser.schoolId ? (
              <span className="inline-flex items-center gap-1.5">
                <IdCard size={13} />
                {activeUser.schoolId}
              </span>
            ) : null}
            {overview.createdAt ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} />
                Joined {formatDate(overview.createdAt)}
              </span>
            ) : null}
          </>
        }
        title={displayName}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Identity & Security Forms */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ProfileForm
            key={`${activeUser.id}:${activeUser.displayName ?? ""}:${activeUser.schoolId ?? ""}:${activeUser.avatarUrl ?? ""}`}
            initialAvatarUrl={activeUser.avatarUrl}
            initialDisplayName={activeUser.displayName}
            initialEmail={activeUser.email}
            initialSchoolId={activeUser.schoolId}
          />
          <ProfileSecurityCard email={activeUser.email} />
        </div>

        {/* Right Column: Activity, Organizations & RBAC Access */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Activity Overview */}
          <Card className="border border-border/40">
            <Card.Header className="flex flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Ticket size={18} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <Card.Title className="text-base font-semibold">Campus Activity</Card.Title>
                  <Card.Description>Your registrations, attendance, and proposals.</Card.Description>
                </div>
              </div>
            </Card.Header>

            <Card.Content className="grid grid-cols-3 gap-2.5">
              <NextLink href="/registrations">
                <Surface className="rounded-xl border border-border/30 hover:border-accent/40 p-3 flex flex-col gap-1 transition-colors h-full">
                  <span className="text-lg font-bold text-foreground">
                    {overview.stats.registeredCount}
                  </span>
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <Ticket className="text-accent shrink-0" size={12} />
                    Passes
                  </span>
                </Surface>
              </NextLink>

              <NextLink href="/registrations">
                <Surface className="rounded-xl border border-border/30 hover:border-accent/40 p-3 flex flex-col gap-1 transition-colors h-full">
                  <span className="text-lg font-bold text-foreground">
                    {overview.stats.attendedCount}
                  </span>
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <CheckCircle2 className="text-success shrink-0" size={12} />
                    Attended
                  </span>
                </Surface>
              </NextLink>

              <NextLink href="/events">
                <Surface className="rounded-xl border border-border/30 hover:border-accent/40 p-3 flex flex-col gap-1 transition-colors h-full">
                  <span className="text-lg font-bold text-foreground">
                    {overview.stats.proposalsCount}
                  </span>
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <FileText className="text-accent shrink-0" size={12} />
                    Proposals
                  </span>
                </Surface>
              </NextLink>
            </Card.Content>
          </Card>

          {/* My Organizations */}
          <Card className="border border-border/40">
            <Card.Header className="flex flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <Card.Title className="text-base font-semibold">My Organizations</Card.Title>
                  <Card.Description>
                    Student organizations where you hold membership or leadership.
                  </Card.Description>
                </div>
              </div>
              <Chip size="sm" variant="soft">
                {overview.organizations.length}
              </Chip>
            </Card.Header>

            <Card.Content className="flex flex-col gap-2.5">
              {overview.organizations.length > 0 ? (
                overview.organizations.map((org) => (
                  <NextLink
                    key={org.organizationId}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/30 hover:border-accent/40 hover:bg-default/10 transition-colors group"
                    href={`/organizations/${org.organizationId}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-9 h-9 rounded-xl bg-accent/10 text-accent text-xs font-bold shrink-0">
                        {org.logoUrl ? (
                          <Avatar.Image alt={org.name} className="object-cover" src={org.logoUrl} />
                        ) : null}
                        <Avatar.Fallback className="bg-accent/10 text-accent rounded-xl">
                          {org.acronym.slice(0, 4).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                          {org.name}
                        </span>
                        <span className="text-xs text-muted truncate">
                          {org.positionTitle || org.position || org.acronym}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Chip
                        color={org.isAdviser ? "warning" : org.isOfficer ? "accent" : "default"}
                        size="sm"
                        variant="soft"
                      >
                        {org.isAdviser ? "Adviser" : org.isOfficer ? "Officer" : "Member"}
                      </Chip>
                      <ArrowRight
                        className="text-muted group-hover:text-accent transition-colors"
                        size={14}
                      />
                    </div>
                  </NextLink>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/50 p-4 text-center flex flex-col items-center gap-2">
                  <p className="text-xs text-muted">
                    You are not currently listed in any student organization roster.
                  </p>
                  <NextLink href="/organizations">
                    <Button size="sm" variant="secondary">
                      Explore Organizations
                    </Button>
                  </NextLink>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Groups & Permissions */}
          <Card className="border border-border/40">
            <Card.Header className="flex flex-row items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Shield size={18} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <Card.Title className="text-base font-semibold">Groups & Permissions</Card.Title>
                  <Card.Description>
                    Dynamic RBAC groups and effective capabilities assigned to your account.
                  </Card.Description>
                </div>
              </div>
            </Card.Header>

            <Card.Content className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5">
                {activeUser.isSuperuser ? (
                  <Chip color="danger" size="sm" variant="soft">
                    System Superuser
                  </Chip>
                ) : null}
                {activeUser.isStaff ? (
                  <Chip color="accent" size="sm" variant="soft">
                    Staff Flag
                  </Chip>
                ) : null}
                {activeUser.groups.length > 0 ? (
                  activeUser.groups.map((group) => (
                    <Chip key={group} size="sm" variant="soft">
                      {group}
                    </Chip>
                  ))
                ) : !activeUser.isSuperuser ? (
                  <Chip size="sm" variant="soft">
                    Standard Campus Member
                  </Chip>
                ) : null}
              </div>

              {activeUser.isSuperuser ? (
                <p className="text-xs text-muted">
                  Superuser status grants unrestricted access across all institutional modules and administrative controls.
                </p>
              ) : groupedPermissions.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <KeyRound className="text-accent" size={13} />
                      {overview.permissionDetails.length} effective permission
                      {overview.permissionDetails.length === 1 ? "" : "s"}
                    </span>
                    {groupedPermissions.length > 3 ? (
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        onPress={() => setShowAllPermissions((prev) => !prev)}
                      >
                        {showAllPermissions ? "Show Less" : "View All"}
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    {(showAllPermissions
                      ? groupedPermissions
                      : groupedPermissions.slice(0, 3)
                    ).map(({ module, items }) => (
                      <div
                        key={module}
                        className="rounded-xl bg-surface-secondary/50 border border-border/30 p-2.5 flex flex-col gap-1.5"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          {module}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {items.map((perm) => (
                            <Chip
                              key={perm.code}
                              size="sm"
                              title={perm.name}
                              variant="secondary"
                            >
                              {perm.code}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">
                  No additional administrative permissions assigned. Standard student browsing and registration capabilities remain active.
                </p>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
