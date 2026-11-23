"use client";

import type { DepartmentSummary } from "@/types/domain";
import type { ProgramListItem, ProgramPermissions } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Select,
  TextField,
  toast,
} from "@heroui/react";
import {
  ArrowRight,
  GraduationCap,
  Landmark,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";

import { deleteProgram } from "../services/program_services";

import { ProgramModal } from "./program_modal";

export type ProgramCatalogProps = {
  programs: ProgramListItem[];
  departments: DepartmentSummary[];
  permissions: ProgramPermissions;
};

export function ProgramCatalog({
  programs,
  departments,
  permissions,
}: ProgramCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState<string>("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [programToEdit, setProgramToEdit] = React.useState<ProgramListItem | null>(null);
  const [programToDelete, setProgramToDelete] = React.useState<ProgramListItem | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return programs.filter((program) => {
      const matchesSearch =
        !q ||
        program.name.toLowerCase().includes(q) ||
        program.code.toLowerCase().includes(q) ||
        program.department.name.toLowerCase().includes(q) ||
        program.department.code.toLowerCase().includes(q);

      const matchesDepartment =
        departmentFilter === "all" || program.departmentId === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [programs, search, departmentFilter]);

  const handleOpenCreate = () => {
    setProgramToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenSettings = (program: ProgramListItem) => {
    setProgramToEdit(program);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!programToDelete) return;

    const res = await deleteProgram(programToDelete.id);

    if (!res.success) {
      toast.danger("Failed to delete program", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Program deleted", {
      description: `Removed ${programToDelete.name} (${programToDelete.code}).`,
    });
    setProgramToDelete(null);
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
              Add Program
            </Button>
          ) : undefined
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {programs.length} {programs.length === 1 ? "Program" : "Programs"}
          </Chip>
        }
        description="Manage institutional academic programs, acronym codes, and their assigned parent department."
        title="Academic Programs"
      />

      {/* Search & Department Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <TextField aria-label="Search programs" value={search} onChange={setSearch}>
            <div className="relative w-full">
              <Input
                className="pl-9"
                placeholder="Search by program name, code, or department…"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                size={15}
              />
            </div>
          </TextField>
        </div>

        {departments.length > 0 ? (
          <Select
            aria-label="Filter by department"
            className="w-full sm:w-64"
            value={departmentFilter}
            onChange={(val) => setDepartmentFilter(val ? String(val) : "all")}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All Departments">
                  All Departments
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {departments.map((dept) => (
                  <ListBox.Item
                    key={dept.id}
                    id={dept.id}
                    textValue={`${dept.code} — ${dept.name}`}
                  >
                    {dept.code} — {dept.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        ) : null}
      </div>

      {/* Programs Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((program) => (
            <Card
              key={program.id}
              className="relative group h-full justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
            >
              <Card.Header className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                      {program.code.slice(0, 4)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <Card.Title className="truncate group-hover:text-accent transition-colors">
                        {program.code}
                      </Card.Title>
                      <Card.Description className="line-clamp-2">
                        {program.name}
                      </Card.Description>
                    </div>
                  </div>
                </div>
              </Card.Header>

              <Card.Content className="flex flex-col gap-1.5 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5 text-foreground font-medium truncate">
                  <Landmark className="text-accent shrink-0" size={14} />
                  <span className="truncate">
                    {program.department.code} · {program.department.name}
                  </span>
                </span>
              </Card.Content>

              <Card.Footer className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                {canOpenSettings ? (
                  <Button
                    isIconOnly
                    aria-label={`Settings for ${program.name}`}
                    className="relative z-10"
                    size="sm"
                    variant="ghost"
                    onPress={() => handleOpenSettings(program)}
                  >
                    <Settings size={15} />
                  </Button>
                ) : (
                  <span className="text-xs text-muted">{program.department.code}</span>
                )}

                <NextLink
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                  href={`/programs/${program.id}`}
                >
                  View Details <ArrowRight size={13} />
                </NextLink>
              </Card.Footer>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center items-center gap-3">
          <GraduationCap className="text-muted" size={32} />
          <Card.Header className="items-center">
            <Card.Title>No Programs Found</Card.Title>
            <Card.Description className="max-w-md">
              {programs.length === 0
                ? "No academic programs have been registered yet."
                : "No programs matched your search or department filter."}
            </Card.Description>
          </Card.Header>
          {permissions.canCreate && programs.length === 0 ? (
            <Button size="sm" variant="primary" onPress={handleOpenCreate}>
              <Plus size={15} />
              Add First Program
            </Button>
          ) : null}
        </Card>
      )}

      {(permissions.canCreate || canOpenSettings) && (
        <ProgramModal
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          departments={departments}
          isOpen={isModalOpen}
          programToEdit={programToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setProgramToEdit(null);
          }}
          onRequestDelete={() => {
            if (!programToEdit) return;
            setIsModalOpen(false);
            setProgramToDelete(programToEdit);
          }}
        />
      )}

      {permissions.canDelete && (
        <ConfirmDeleteModal
          description={
            <>
              Are you sure you want to permanently delete{" "}
              <strong>
                {programToDelete?.name} ({programToDelete?.code})
              </strong>
              ? This action cannot be undone.
            </>
          }
          isOpen={Boolean(programToDelete)}
          title="Delete Program"
          onClose={() => setProgramToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
