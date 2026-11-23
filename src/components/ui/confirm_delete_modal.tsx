"use client";

import React from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmLabel?: string;
  isConfirmDisabled?: boolean;
  onConfirm: () => Promise<void>;
};

/**
 * Reusable HeroUI v3 confirmation modal for destructive institutional deletions.
 */
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  title,
  subtitle = "Permanent administrative action",
  description,
  confirmLabel = "Confirm Delete",
  isConfirmDisabled = false,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    if (isConfirmDisabled || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-danger/10 text-danger shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <Modal.Heading>{title}</Modal.Heading>
                  <p className="text-xs text-muted">{subtitle}</p>
                </div>
              </div>
            </Modal.Header>

            <Modal.Body className="py-2">
              <div className="text-sm text-foreground/80 leading-relaxed">{description}</div>
            </Modal.Body>

            <Modal.Footer className="flex items-center justify-end gap-2 pt-3">
              <Button isDisabled={isDeleting} size="sm" variant="ghost" onPress={onClose}>
                Cancel
              </Button>
              <Button
                isDisabled={isDeleting || isConfirmDisabled}
                size="sm"
                variant="danger"
                onPress={handleConfirm}
              >
                {isDeleting ? <Spinner color="current" size="sm" /> : confirmLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
