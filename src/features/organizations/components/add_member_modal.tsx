"use client";

import type { CandidateProfile } from "../types";

import React from "react";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Separator,
  Spinner,
  Surface,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { UserPlus } from "lucide-react";

import { addOrganizationMember } from "../services/organization_services";

import { CandidateAutocomplete } from "./candidate_autocomplete";

export function AddMemberModal({
  isOpen,
  onClose,
  organizationId,
  candidates,
  existingUserIds,
  onMemberAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  candidates: CandidateProfile[];
  existingUserIds: string[];
  onMemberAdded: () => void;
}) {
  const [selectedUserId, setSelectedUserId] = React.useState<string>("");
  const [position, setPosition] = React.useState<string>("Member");
  const [isOfficer, setIsOfficer] = React.useState<boolean>(false);
  const [isAdviser, setIsAdviser] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const availableCandidates = React.useMemo(() => {
    return candidates.filter((c) => !existingUserIds.includes(c.id));
  }, [candidates, existingUserIds]);

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedUserId("");
    setPosition("Member");
    setIsOfficer(false);
    setIsAdviser(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.danger("Selection required", {
        description: "Please select a university user to add to the roster.",
      });

      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addOrganizationMember(
        organizationId,
        selectedUserId,
        position,
        isOfficer,
        isAdviser
      );

      if (!res.success) {
        toast.danger("Failed to add member", {
          description: res.error.message,
        });

        return;
      }

      toast.success("Member added", {
        description: "Successfully added member to the organization roster.",
      });
      setSelectedUserId("");
      setPosition("Member");
      setIsOfficer(false);
      setIsAdviser(false);
      onMemberAdded();
      onClose();
    } catch (err: unknown) {
      toast.danger("Error adding member", {
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container scroll="inside" size="md">
          <Modal.Dialog className="border border-border/40 shadow-xl bg-surface max-h-[88dvh]">
            <Modal.CloseTrigger />
            <Modal.Header className="shrink-0 pb-4 pr-8">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0">
                  <UserPlus size={18} />
                </div>
                <div>
                  <Modal.Heading className="text-base font-bold text-foreground">
                    Add Organization Member
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    Enroll a student or faculty member into the organization roster.
                  </p>
                </div>
              </div>
            </Modal.Header>

            <Separator className="shrink-0" />

            <Form
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
              validationBehavior="native"
              onSubmit={handleSubmit}
            >
              <Modal.Body className="flex flex-col gap-4 py-4 px-1 flex-1 min-h-0 overflow-y-auto">
                <CandidateAutocomplete
                  isRequired
                  candidates={availableCandidates}
                  description="Only active profiles not yet enrolled in this organization are shown."
                  emptyMessage="All eligible campus profiles are already on this roster."
                  label="Select User Profile"
                  placeholder="Choose a student or faculty user…"
                  searchPlaceholder="Search by name, student ID, or email…"
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                />

                <TextField
                  isRequired
                  name="position"
                  value={position}
                  onChange={setPosition}
                >
                  <Label>Position / Title</Label>
                  <Input placeholder="e.g. Committee Head, Member, Secretary" />
                  <Description>Role title displayed on the organization roster card.</Description>
                  <FieldError />
                </TextField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Surface className="rounded-2xl border border-border/40 bg-surface-secondary/40 p-3">
                    <Switch isSelected={isOfficer} onChange={setIsOfficer}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Label className="text-xs font-semibold">Officer Status</Label>
                      </Switch.Content>
                      <Description className="text-[11px]">
                        Can draft proposals &amp; check in attendees
                      </Description>
                    </Switch>
                  </Surface>

                  <Surface className="rounded-2xl border border-border/40 bg-surface-secondary/40 p-3">
                    <Switch isSelected={isAdviser} onChange={setIsAdviser}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <Label className="text-xs font-semibold">Adviser Status</Label>
                      </Switch.Content>
                      <Description className="text-[11px]">
                        Faculty oversight designation
                      </Description>
                    </Switch>
                  </Surface>
                </div>
              </Modal.Body>

              <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-4 mt-2 border-t border-border/30">
                <Button
                  isDisabled={isSubmitting}
                  size="sm"
                  type="button"
                  variant="ghost"
                  onPress={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={!selectedUserId || !position.trim() || isSubmitting}
                  isPending={isSubmitting}
                  size="sm"
                  type="submit"
                  variant="primary"
                >
                  {isSubmitting ? <Spinner color="current" size="sm" /> : null}
                  {isSubmitting ? "Adding…" : "Add to Roster"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
