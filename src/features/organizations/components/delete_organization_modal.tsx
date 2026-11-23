"use client";

import React from "react";
import {
  AlertDialog,
  Button,
  Spinner,
  toast,
} from "@heroui/react";
import { useRouter } from "next/navigation";

import { deleteOrganization } from "../services/organization_services";

export function DeleteOrganizationModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
  onDeleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteOrganization(organizationId);

      if (!res.success) {
        toast.danger("Failed to delete organization", {
          description: res.error.message,
        });

        return;
      }

      toast.success("Organization deleted", {
        description: `Successfully de-recognized and removed ${organizationName}.`,
      });
      onClose();
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/organizations");
      }
      router.refresh();
    } catch (err: unknown) {
      toast.danger("Error deleting organization", {
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && !isDeleting && onClose()}
    >
      <AlertDialog.Backdrop variant="blur">
        <AlertDialog.Container size="sm">
          <AlertDialog.Dialog className="border border-danger/30 shadow-xl bg-surface">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Delete Organization</AlertDialog.Heading>
            </AlertDialog.Header>

            <AlertDialog.Body>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Are you sure you want to permanently delete <strong>{organizationName}</strong>? This action cannot be undone and will remove associated rosters and events.
              </p>
            </AlertDialog.Body>

            <AlertDialog.Footer className="flex items-center justify-end gap-2">
              <Button
                isDisabled={isDeleting}
                size="sm"
                type="button"
                variant="tertiary"
                onPress={onClose}
              >
                Cancel
              </Button>
              <Button
                isDisabled={isDeleting}
                isPending={isDeleting}
                size="sm"
                type="button"
                variant="danger"
                onPress={handleDelete}
              >
                {isDeleting ? <Spinner color="current" size="sm" /> : null}
                {isDeleting ? "Deleting…" : "Confirm Delete"}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
