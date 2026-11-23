"use client";

import type { DepartmentSummary } from "@/types/domain";

import React from "react";
import { Button } from "@heroui/react";
import { Plus } from "lucide-react";

import { ProgramModal } from "./program_modal";

export type AddDepartmentProgramButtonProps = {
  department: DepartmentSummary;
};

/**
 * Self-contained trigger + modal for adding a program directly from a department detail page.
 * Composed via App Router page slots to preserve feature hermeticity.
 */
export function AddDepartmentProgramButton({
  department,
}: AddDepartmentProgramButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button size="sm" variant="primary" onPress={() => setIsOpen(true)}>
        <Plus size={14} />
        Add Program
      </Button>

      <ProgramModal
        departments={[department]}
        isOpen={isOpen}
        lockedDepartmentId={department.id}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
