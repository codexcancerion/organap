"use client";

import type { DepartmentListItem, DepartmentPermissions } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Chip,
  SearchField,
  toast,
} from "@heroui/react";
import {
  ArrowRight,
  CalendarCheck2,
  Landmark,
  Plus,
  Settings,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";

import { deleteDepartment } from "../services/department_services";

import { DepartmentModal } from "./department_modal";

export type DepartmentCatalogProps = {
  departments: DepartmentListItem[];
  permissions: DepartmentPermissions;
};

const MAX_PROGRAM_CHIPS = 5;

export function DepartmentCatalog({
  departments,
  permissions,
}: DepartmentCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [departmentToEdit, setDepartmentToEdit] = React.useState<DepartmentListItem | null>(null);
  const [departmentToDelete, setDepartmentToDelete] = React.useState<DepartmentListItem | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return departments;

    return departments.filter((dept) => {
      const matchesDept =
        dept.name.toLowerCase().includes(q) || dept.code.toLowerCase().includes(q);
      const matchesPrograms =
        permissions.canViewPrograms &&
        dept.programs.some(
          (p) =>
            p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
        );

      return matchesDept || matchesPrograms;
    });
  }, [departments, search, permissions.canViewPrograms]);

  const handleOpenCreate = () => {
    setDepartmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenSettings = (department: DepartmentListItem) => {
    setDepartmentToEdit(department);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!departmentToDelete) return;

    const res = await deleteDepartment(departmentToDelete.id);

    if (!res.success) {
      toast.danger("Failed to delete department", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Department deleted", {
      description: `Removed ${departmentToDelete.name} (${departmentToDelete.code}).`,
    });
    setDepartmentToDelete(null);
    router.refresh();
  };

  const deleteHasPrograms = Boolean(
    departmentToDelete && departmentToDelete.programsCount > 0,
  );
  const canOpenSettings = permissions.canChange || permissions.canDelete;

  const summaryKpis = React.useMemo(() => {
    let organizationsCount = 0;
    let eventsCount = 0;
    let registrationsCount = 0;
    let attendancesCount = 0;

    for (const dept of departments) {
      const m = dept.activityMetrics;

      if (!m) continue;
      organizationsCount += m.organizationsCount;
      eventsCount += m.eventsCount;
      registrationsCount += m.registrationsCount;
      attendancesCount += m.attendancesCount;
    }

    const attendanceRate =
      registrationsCount > 0
        ? Math.round((attendancesCount / registrationsCount) * 100)
        : 0;

    return {
      organizationsCount,
      eventsCount,
      registrationsCount,
      attendancesCount,
      attendanceRate,
    };
  }, [departments]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          permissions.canCreate ? (
            <Button size="md" variant="primary" onPress={handleOpenCreate}>
              <Plus size={16} />
              Add Department
            </Button>
          ) : undefined
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {departments.length}{" "}
            {departments.length === 1 ? "Department" : "Departments"}
          </Chip>
        }
        description="Manage institutional schools and academic departments, their mapped organizations, and campus event participation."
        title="Academic Departments"
      />

      {/* Department Activity KPI Strip */}
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
            {summaryKpis.organizationsCount}
          </p>
          <p className="text-xs text-muted">Linked student organizations</p>
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
            {summaryKpis.eventsCount}
          </p>
          <p className="text-xs text-muted">Approved college activities</p>
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
            {summaryKpis.registrationsCount}
          </p>
          <p className="text-xs text-muted">Active event registrations</p>
        </Card>

        <Card className="p-4 gap-2 border border-border/40 bg-surface">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Check-Ins
            </span>
            <span className="w-8 h-8 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <UserCheck size={15} />
            </span>
          </div>
          <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {summaryKpis.attendancesCount}
          </p>
          <p className="text-xs text-muted">
            {summaryKpis.attendanceRate}% verified attendance rate
          </p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search departments"
          className="w-full md:w-80"
          name="department-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by department name, code, or program…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Departments Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((dept) => {
            const topPrograms = dept.programs.slice(0, MAX_PROGRAM_CHIPS);
            const hasMoreThanFive = dept.programs.length > MAX_PROGRAM_CHIPS;

            return (
              <Card
                key={dept.id}
                className="relative group h-full justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
              >
                <Card.Header className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                        {dept.code.slice(0, 4)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Card.Title className="truncate group-hover:text-accent transition-colors">
                          {dept.code}
                        </Card.Title>
                        <Card.Description className="line-clamp-2">
                          {dept.name}
                        </Card.Description>
                      </div>
                    </div>
                  </div>
                </Card.Header>

                <Card.Content className="flex flex-col gap-3">
                  {permissions.canViewPrograms ? (
                    topPrograms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {topPrograms.map((program) => (
                          <Chip key={program.id} size="sm" variant="soft">
                            {program.code}
                          </Chip>
                        ))}
                        {hasMoreThanFive ? (
                          <Chip
                            aria-label={`${dept.programs.length - MAX_PROGRAM_CHIPS} more programs`}
                            size="sm"
                            variant="secondary"
                          >
                            ...
                          </Chip>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        <Chip
                          className="text-muted opacity-70"
                          color="default"
                          size="sm"
                          variant="secondary"
                        >
                          No programs yet
                        </Chip>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        className="text-muted opacity-70"
                        color="default"
                        size="sm"
                        variant="secondary"
                      >
                        Programs restricted
                      </Chip>
                    </div>
                  )}

                  {dept.activityMetrics ? (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/20 text-center">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {dept.activityMetrics.eventsCount}
                        </span>
                        <span className="text-[10px] text-muted">Events</span>
                      </div>
                      <div className="flex flex-col border-x border-border/20">
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {dept.activityMetrics.registrationsCount}
                        </span>
                        <span className="text-[10px] text-muted">Passes</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {dept.activityMetrics.attendancesCount}
                        </span>
                        <span className="text-[10px] text-muted">Check-ins</span>
                      </div>
                    </div>
                  ) : null}
                </Card.Content>

                <Card.Footer className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                  {canOpenSettings ? (
                    <Button
                      isIconOnly
                      aria-label={`Settings for ${dept.name}`}
                      className="relative z-10"
                      size="sm"
                      variant="ghost"
                      onPress={() => handleOpenSettings(dept)}
                    >
                      <Settings size={15} />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">{dept.code}</span>
                  )}

                  <NextLink
                    className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                    href={`/departments/${dept.id}`}
                  >
                    View Details <ArrowRight size={13} />
                  </NextLink>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 text-center items-center gap-3">
          <Landmark className="text-muted" size={32} />
          <Card.Header className="items-center">
            <Card.Title>No Departments Found</Card.Title>
            <Card.Description className="max-w-md">
              {departments.length === 0
                ? "No academic departments have been registered yet."
                : "No departments matched your search query."}
            </Card.Description>
          </Card.Header>
          {permissions.canCreate && departments.length === 0 ? (
            <Button size="sm" variant="primary" onPress={handleOpenCreate}>
              <Plus size={15} />
              Add First Department
            </Button>
          ) : null}
        </Card>
      )}

      {(permissions.canCreate || canOpenSettings) && (
        <DepartmentModal
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          departmentToEdit={departmentToEdit}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setDepartmentToEdit(null);
          }}
          onRequestDelete={() => {
            if (!departmentToEdit) return;
            setIsModalOpen(false);
            setDepartmentToDelete(departmentToEdit);
          }}
        />
      )}

      {permissions.canDelete && (
        <ConfirmDeleteModal
          description={
            deleteHasPrograms ? (
              <>
                <strong>
                  {departmentToDelete?.name} ({departmentToDelete?.code})
                </strong>{" "}
                currently contains{" "}
                <strong>
                  {departmentToDelete?.programsCount}{" "}
                  {departmentToDelete?.programsCount === 1 ? "program" : "programs"}
                </strong>
                . Reassign or remove linked programs before deleting this department.
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{" "}
                <strong>
                  {departmentToDelete?.name} ({departmentToDelete?.code})
                </strong>
                ? This action cannot be undone.
              </>
            )
          }
          isConfirmDisabled={deleteHasPrograms}
          isOpen={Boolean(departmentToDelete)}
          title="Delete Department"
          onClose={() => setDepartmentToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
