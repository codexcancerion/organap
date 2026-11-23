"use client";

import type { DepartmentDetail, DepartmentPermissions } from "../types";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Chip, toast } from "@heroui/react";
import {
  ArrowRight,
  GraduationCap,
  Landmark,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { Section } from "@/components/layout/section";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";

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
