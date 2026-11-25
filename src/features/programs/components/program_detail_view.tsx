"use client";

import type { DepartmentSummary } from "@/types/domain";
import type { ProgramListItem, ProgramPermissions } from "../types";

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

import { deleteProgram } from "../services/program_services";

import { ProgramModal } from "./program_modal";

export type ProgramDetailViewProps = {
  program: ProgramListItem;
  departments: DepartmentSummary[];
  permissions: ProgramPermissions;
};

export function ProgramDetailView({
  program,
  departments,
  permissions,
}: ProgramDetailViewProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const canOpenSettings = permissions.canChange || permissions.canDelete;

  const handleDelete = async () => {
    const res = await deleteProgram(program.id);

    if (!res.success) {
      toast.danger("Failed to delete program", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Program deleted", {
      description: `Removed ${program.name} (${program.code}).`,
    });
    setIsDeleteOpen(false);
    router.push("/programs");
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
            {program.code}
          </Chip>
        }
        breadcrumbs={[
          { label: "Back to Programs", href: "/programs" },
          { label: program.code },
        ]}
        description="Academic degree program profile and parent department mapping."
        media={
          <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <GraduationCap size={28} />
          </div>
        }
        meta={
          <>
            <span className="font-semibold text-foreground/80">
              Code: {program.code}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Department: {program.department.name} ({program.department.code})
            </span>
          </>
        }
        title={program.name}
      />

      {/* Governing Department Event & Participation KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 gap-2 border border-border/40 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Affiliated Orgs
            </span>
            <span className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Users size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {program.activityMetrics?.organizationsCount ?? 0}
          </p>
          <p className="text-xs text-muted">Under {program.department.code}</p>
        </Card>

        <Card className="p-4 gap-2 border border-border/40 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Dept Events
            </span>
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CalendarCheck2 size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {program.activityMetrics?.eventsCount ?? 0}
          </p>
          <p className="text-xs text-muted">
            {program.activityMetrics?.totalProposalsCount ?? 0} total proposals
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
            {program.activityMetrics?.registrationsCount ?? 0}
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
            {program.activityMetrics?.attendancesCount ?? 0}
          </p>
          <p className="text-xs text-muted">
            {program.activityMetrics?.attendanceRate ?? 0}% attendance rate
          </p>
        </Card>
      </div>

      <Section
        description="Each academic program belongs to a single governing department."
        icon={<Landmark className="text-accent" size={18} />}
        title="Parent Department"
      >
        <Card
          className={
            permissions.canViewDepartments
              ? "relative group max-w-xl gap-3 hover:border-accent/40 transition-colors cursor-pointer"
              : "max-w-xl gap-3"
          }
        >
          <Card.Header className="flex flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                {program.department.code.slice(0, 4)}
              </div>
              <div className="flex flex-col min-w-0">
                <Card.Title className="truncate group-hover:text-accent transition-colors">
                  {program.department.name}
                </Card.Title>
                <Card.Description>Code: {program.department.code}</Card.Description>
              </div>
            </div>
            <Chip size="sm" variant="soft">
              1 Department
            </Chip>
          </Card.Header>
          {permissions.canViewDepartments ? (
            <Card.Footer className="pt-2 border-t border-border/20 flex justify-end">
              <NextLink
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                href={`/departments/${program.department.id}`}
              >
                View Department &amp; Programs <ArrowRight size={13} />
              </NextLink>
            </Card.Footer>
          ) : null}
        </Card>
      </Section>

      {program.recentEvents && program.recentEvents.length > 0 ? (
        <Section
          badge={
            <Chip size="sm" variant="soft">
              {program.recentEvents.length}
            </Chip>
          }
          description={`Campus events and proposals hosted by organizations under ${program.department.name} (${program.department.code}).`}
          icon={<CalendarCheck2 className="text-accent" size={18} />}
          title="Department Events & Participation"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {program.recentEvents.map((ev) => (
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

      {canOpenSettings ? (
        <ProgramModal
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          departments={departments}
          isOpen={isSettingsOpen}
          programToEdit={program}
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
            <>
              Are you sure you want to permanently delete{" "}
              <strong>
                {program.name} ({program.code})
              </strong>
              ? This action cannot be undone.
            </>
          }
          isOpen={isDeleteOpen}
          title="Delete Program"
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
