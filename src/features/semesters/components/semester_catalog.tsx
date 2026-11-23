"use client";

import type { Semester, SemesterPermissions, SemesterStatus } from "../types";

import React from "react";
import {
  Button,
  Card,
  Chip,
  Input,
  TextField,
  toast,
} from "@heroui/react";
import {
  Calendar,
  CalendarRange,
  Clock,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";
import { formatCalendarDate } from "@/utils/formatters";

import { deleteSemester, getSemesterStatus } from "../services/semester_services";

import { SemesterModal } from "./semester_modal";

const STATUS_META: Record<
  SemesterStatus,
  { label: string; color: "success" | "accent" | "default" }
> = {
  active: { label: "Active Term", color: "success" },
  upcoming: { label: "Upcoming", color: "accent" },
  completed: { label: "Completed", color: "default" },
};

const FILTER_OPTIONS: { key: "all" | SemesterStatus; label: string }[] = [
  { key: "all", label: "All Terms" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

function formatTermDuration(startDate: string, endDate: string): string {
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  if (!sy || !sm || !sd || !ey || !em || !ed) return "";
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const days = Math.max(1, Math.round((endUtc - startUtc) / 86_400_000));

  return `${days} ${days === 1 ? "day" : "days"}`;
}

export type SemesterCatalogProps = {
  semesters: Semester[];
  permissions: SemesterPermissions;
};

export function SemesterCatalog({ semesters, permissions }: SemesterCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | SemesterStatus>("all");

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [semesterToEdit, setSemesterToEdit] = React.useState<Semester | null>(null);
  const [semesterToDelete, setSemesterToDelete] = React.useState<Semester | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return semesters.filter((semester) => {
      const matchesSearch =
        !q ||
        semester.name.toLowerCase().includes(q) ||
        (semester.description ?? "").toLowerCase().includes(q);

      const status = getSemesterStatus(semester.startDate, semester.endDate);
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [semesters, search, statusFilter]);

  const handleOpenCreate = () => {
    setSemesterToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenSettings = (semester: Semester) => {
    setSemesterToEdit(semester);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!semesterToDelete) return;

    const res = await deleteSemester(semesterToDelete.id);

    if (!res.success) {
      toast.danger("Failed to delete semester", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Semester deleted", {
      description: `Removed "${semesterToDelete.name}".`,
    });
    setSemesterToDelete(null);
    router.refresh();
  };

  const canOpenSettings = permissions.canChange || permissions.canDelete;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          permissions.canCreate ? (
            <Button size="md" variant="primary" onPress={handleOpenCreate}>
              <Plus size={16} />
              Create Semester
            </Button>
          ) : undefined
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {semesters.length} {semesters.length === 1 ? "Semester" : "Semesters"}
          </Chip>
        }
        description="Configure official academic semesters, term descriptions, and start/end schedule boundaries."
        title="Academic Semesters"
      />

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <TextField aria-label="Search semesters" value={search} onChange={setSearch}>
            <div className="relative w-full">
              <Input
                className="pl-9"
                placeholder="Search semesters by name or description…"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                size={15}
              />
            </div>
          </TextField>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {FILTER_OPTIONS.map((option) => (
            <Button
              key={option.key}
              className="shrink-0 text-xs"
              size="sm"
              variant={statusFilter === option.key ? "primary" : "ghost"}
              onPress={() => setStatusFilter(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Semesters Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((semester) => {
            const status = getSemesterStatus(semester.startDate, semester.endDate);
            const statusMeta = STATUS_META[status];
            const duration = formatTermDuration(semester.startDate, semester.endDate);

            return (
              <Card key={semester.id} className="h-full justify-between gap-3">
                <Card.Header className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <CalendarRange size={18} />
                      </div>
                      <Card.Title className="truncate">{semester.name}</Card.Title>
                    </div>
                    <Chip
                      className="shrink-0"
                      color={statusMeta.color}
                      size="sm"
                      variant="soft"
                    >
                      {statusMeta.label}
                    </Chip>
                  </div>
                  <Card.Description className="line-clamp-2">
                    {semester.description || "No description provided."}
                  </Card.Description>
                </Card.Header>

                <Card.Content className="flex flex-col gap-2 text-xs text-muted">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      Start Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCalendarDate(semester.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={13} />
                      End Date
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCalendarDate(semester.endDate)}
                    </span>
                  </div>
                </Card.Content>

                <Card.Footer className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <Clock size={13} />
                    {duration}
                  </span>

                  {canOpenSettings ? (
                    <Button
                      isIconOnly
                      aria-label={`Settings for ${semester.name}`}
                      className="ml-auto"
                      size="sm"
                      variant="ghost"
                      onPress={() => handleOpenSettings(semester)}
                    >
                      <Settings size={15} />
                    </Button>
                  ) : null}
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 text-center items-center gap-3">
          <CalendarRange className="text-muted" size={32} />
          <Card.Header className="items-center">
            <Card.Title>No Semesters Found</Card.Title>
            <Card.Description className="max-w-md">
              {semesters.length === 0
                ? "No academic semesters have been configured yet."
                : "No academic semesters match your current search or filter."}
            </Card.Description>
          </Card.Header>
          {permissions.canCreate && semesters.length === 0 ? (
            <Button size="sm" variant="primary" onPress={handleOpenCreate}>
              <Plus size={15} />
              Create First Semester
            </Button>
          ) : null}
        </Card>
      )}

      {(permissions.canCreate || canOpenSettings) && (
        <SemesterModal
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          isOpen={isModalOpen}
          semesterToEdit={semesterToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setSemesterToEdit(null);
          }}
          onRequestDelete={() => {
            if (!semesterToEdit) return;
            setIsModalOpen(false);
            setSemesterToDelete(semesterToEdit);
          }}
        />
      )}

      {permissions.canDelete && (
        <ConfirmDeleteModal
          description={
            <>
              Are you sure you want to permanently delete{" "}
              <strong>{semesterToDelete?.name}</strong>? This action cannot be undone.
            </>
          }
          isOpen={Boolean(semesterToDelete)}
          title="Delete Semester"
          onClose={() => setSemesterToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
