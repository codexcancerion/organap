"use client";

import type { DepartmentDetail, DepartmentPermissions } from "../types";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Chip, toast } from "@heroui/react";
import {
  ArrowRight,
  CalendarCheck2,
  GraduationCap,
  Landmark,
  Settings,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { Section } from "@/components/layout/section";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";
import { ProposalStatusChip } from "@/components/ui/proposal_status_chip";

import { deleteDepartment } from "../services/department_services";

import { DepartmentModal } from "./department_modal";

export type DepartmentDetailViewProps = {
  department: DepartmentDetail;
  permissions: DepartmentPermissions;
  programsActionSlot?: React.ReactNode;
};

export function DepartmentDetailView({
  department,
  permissions,
  programsActionSlot,
}: DepartmentDetailViewProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const hasLinkedPrograms = department.programs.length > 0;
  const canOpenSettings = permissions.canChange || permissions.canDelete;

  const handleDelete = async () => {
    const res = await deleteDepartment(department.id);

    if (!res.success) {
      toast.danger("Failed to delete department", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Department deleted", {
      description: `Removed ${department.name} (${department.code}).`,
    });
    setIsDeleteOpen(false);
    router.push("/departments");
    router.refresh();
  };

  const headerActions = canOpenSettings ? (
    <Button size="sm" variant="secondary" onPress={() => setIsSettingsOpen(true)}>
      <Settings size={14} />
      Settings
    </Button>
  ) : undefined;

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      <PageHeader
        actions={headerActions}
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {department.code}
          </Chip>
        }
        breadcrumbs={[
          { label: "Back to Departments", href: "/departments" },
          { label: department.code },
        ]}
        description="Academic department directory and its affiliated degree programs."
        media={
          <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Landmark size={28} />
          </div>
        }
        meta={
          <>
            <span className="font-semibold text-foreground/80">
              Code: {department.code}
            </span>
            {permissions.canViewPrograms ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <GraduationCap size={13} />
                  {department.programs.length}{" "}
                  {department.programs.length === 1 ? "program" : "programs"}
                </span>
              </>
            ) : null}
          </>
        }
        title={department.name}
      />

      {/* Department Event & Participation KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gap-2 border border-border/40 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Mapped Orgs
            </span>
            <span className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Users size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {department.activityMetrics?.organizationsCount ?? 0}
          </p>
          <p className="text-xs text-muted">Affiliated student groups</p>
        </Card>

        <Card className="p-4 gap-2 border border-border/40 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Approved Events
            </span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarCheck2 size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {department.activityMetrics?.eventsCount ?? 0}
          </p>
          <p className="text-xs text-muted">
            {department.activityMetrics?.totalProposalsCount ?? 0} total proposals
          </p>
        </Card>

        <Card className="p-4 gap-2 border border-border/40 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Student Passes
            </span>
            <span className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Ticket size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {department.activityMetrics?.registrationsCount ?? 0}
          </p>
          <p className="text-xs text-muted">Confirmed event registrations</p>
        </Card>

        <Card className="p-4 gap-2 border border-border/40 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Verified Check-Ins
            </span>
            <span className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <UserCheck size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {department.activityMetrics?.attendancesCount ?? 0}
          </p>
          <p className="text-xs text-muted">
            {department.activityMetrics?.attendanceRate ?? 0}% attendance rate
          </p>
        </Card>
      </div>

      {/* Mapped Student Organizations */}
      {department.organizations && department.organizations.length > 0 ? (
        <Section
          badge={
            <Chip size="sm" variant="soft">
              {department.organizations.length}
            </Chip>
          }
          description={`Recognized student organizations governed under ${department.name} (${department.code}).`}
          icon={<Users className="text-accent" size={18} />}
          title="Mapped Student Organizations"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {department.organizations.map((org) => (
              <Card
                key={org.id}
                className="relative group justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
              >
                <Card.Header className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <Chip color="accent" size="sm" variant="soft">
                      {org.acronym}
                    </Chip>
                  </div>
                  <Card.Title className="text-base group-hover:text-accent transition-colors">
                    {org.name}
                  </Card.Title>
                </Card.Header>
                <Card.Footer className="pt-2 border-t border-border/20 flex justify-end">
                  <NextLink
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                    href={`/organizations/${org.id}`}
                  >
                    View Organization <ArrowRight size={13} />
                  </NextLink>
                </Card.Footer>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Department Events & Participation */}
      {department.recentEvents && department.recentEvents.length > 0 ? (
        <Section
          badge={
            <Chip size="sm" variant="soft">
              {department.recentEvents.length}
            </Chip>
          }
          description="Events and proposals organized by student organizations mapped to this department."
          icon={<CalendarCheck2 className="text-accent" size={18} />}
          title="Department Events & Participation"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {department.recentEvents.map((ev) => (
              <Card
                key={ev.id}
                className="relative group justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
              >
                <Card.Header className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap w-full">
                    <span className="text-[11px] font-semibold text-accent">
                      {ev.organizationAcronym}
                    </span>
                    <ProposalStatusChip status={ev.status} />
                  </div>
                  <Card.Title className="text-base group-hover:text-accent transition-colors line-clamp-2">
                    {ev.title}
                  </Card.Title>
                  <Card.Description className="text-xs">
                    {ev.venueName} ·{" "}
                    {new Date(ev.startTime).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Card.Description>
                </Card.Header>
                <Card.Footer className="pt-2 border-t border-border/20 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>
                    {ev.registrationsCount} passes · {ev.attendancesCount} check-ins
                  </span>
                  <NextLink
                    className="inline-flex items-center gap-1 font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                    href={`/events/${ev.id}`}
                  >
                    Open Event <ArrowRight size={13} />
                  </NextLink>
                </Card.Footer>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      <Section
        actions={programsActionSlot}
        badge={
          permissions.canViewPrograms ? (
            <Chip size="sm" variant="soft">
              {department.programs.length}
            </Chip>
          ) : undefined
        }
        description={`Degree programs hosted under ${department.name} (${department.code}).`}
        icon={<GraduationCap className="text-accent" size={18} />}
        title="Contained Programs"
      >
        {!permissions.canViewPrograms ? (
          <Card className="p-8 text-center items-center gap-2">
            <GraduationCap className="text-muted" size={28} />
            <Card.Header className="items-center">
              <Card.Title>Program Access Restricted</Card.Title>
              <Card.Description>
                Grant the <code>programs.view</code> permission to inspect programs
                within this department.
              </Card.Description>
            </Card.Header>
          </Card>
        ) : department.programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {department.programs.map((program) => (
              <Card
                key={program.id}
                className="relative group justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
              >
                <Card.Header className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 w-full">
                    <Chip size="sm" variant="soft">
                      {program.code}
                    </Chip>
                  </div>
                  <Card.Title className="text-base group-hover:text-accent transition-colors">
                    {program.name}
                  </Card.Title>
                </Card.Header>
                <Card.Footer className="pt-2 border-t border-border/20 flex justify-end">
                  <NextLink
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                    href={`/programs/${program.id}`}
                  >
                    View Program <ArrowRight size={13} />
                  </NextLink>
                </Card.Footer>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center items-center gap-2">
            <GraduationCap className="text-muted" size={28} />
            <Card.Header className="items-center">
              <Card.Title>No Programs Assigned Yet</Card.Title>
              <Card.Description>
                This department does not currently contain any degree programs.
              </Card.Description>
            </Card.Header>
          </Card>
        )}
      </Section>

      {canOpenSettings ? (
        <DepartmentModal
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          departmentToEdit={department}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onRequestDelete={() => {
            setIsSettingsOpen(false);
            setIsDeleteOpen(true);
          }}
        />
      ) : null}

      {permissions.canDelete ? (
        <ConfirmDeleteModal
          description={
            hasLinkedPrograms ? (
              <>
                <strong>
                  {department.name} ({department.code})
                </strong>{" "}
                still contains{" "}
                <strong>
                  {department.programs.length}{" "}
                  {department.programs.length === 1 ? "program" : "programs"}
                </strong>
                . Remove or reassign them before deleting this department.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{" "}
                <strong>
                  {department.name} ({department.code})
                </strong>
                ? This action cannot be undone.
              </>
            )
          }
          isConfirmDisabled={hasLinkedPrograms}
          isOpen={isDeleteOpen}
          title="Delete Department"
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
