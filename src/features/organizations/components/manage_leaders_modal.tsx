"use client";

import type { CandidateProfile } from "../types";

import React from "react";
import {
  Alert,
  Button,
  Chip,
  Form,
  Modal,
  Separator,
  Spinner,
  Surface,
  toast,
} from "@heroui/react";
import { GraduationCap, ShieldCheck } from "lucide-react";

import { updateOrganizationLeaders } from "../services/organization_services";

import { CandidateAutocomplete } from "./candidate_autocomplete";

export function ManageLeadersModal({
  isOpen,
  onClose,
  organizationId,
  currentGovernorId,
  currentAdviserId,
  currentUserId,
  canUpdateAll,
  candidates,
  onUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  currentGovernorId: string | null;
  currentAdviserId: string | null;
  currentUserId: string | null;
  canUpdateAll: boolean;
  candidates: CandidateProfile[];
  onUpdated: () => void;
}) {
  const [governorId, setGovernorId] = React.useState<string>(currentGovernorId ?? "");
  const [adviserId, setAdviserId] = React.useState<string>(currentAdviserId ?? "");
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGovernorId(currentGovernorId ?? "");
      setAdviserId(currentAdviserId ?? "");
    }
  }, [isOpen, currentGovernorId, currentAdviserId]);

  const isCurrentGovernor = currentUserId === currentGovernorId;
  const isCurrentAdviser = currentUserId === currentAdviserId;
  const governorLocked = isCurrentGovernor && !canUpdateAll;
  const adviserLocked = isCurrentAdviser && !canUpdateAll;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (governorLocked && governorId !== currentGovernorId) {
      toast.danger("Cannot change self", {
        description:
          "As the current Governor, you cannot change your own position. Contact Student Affairs.",
      });

      return;
    }
    if (adviserLocked && adviserId !== currentAdviserId) {
      toast.danger("Cannot change self", {
        description:
          "As the current Faculty Adviser, you cannot change your own position. Contact Student Affairs.",
      });

      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateOrganizationLeaders(
        organizationId,
        governorId || null,
        adviserId || null
      );

      if (!res.success) {
        toast.danger("Failed to update leadership", {
          description: res.error.message,
        });

        return;
      }

      toast.success("Leadership updated", {
        description: "Organization Governor and Faculty Adviser updated successfully.",
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      toast.danger("Error updating leaders", {
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container scroll="inside" size="lg">
          <Modal.Dialog className="border border-border/40 shadow-xl bg-surface max-h-[88dvh]">
            <Modal.CloseTrigger />
            <Modal.Header className="shrink-0 pb-4 pr-8">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <Modal.Heading className="text-base font-bold text-foreground">
                    Update Organization Leadership
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    Designate the official Student Governor / President and Faculty Adviser.
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
                {governorLocked || adviserLocked ? (
                  <Alert status="warning">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>Safety Lock Active</Alert.Title>
                      <Alert.Description>
                        You are currently an active leader of this organization. Leaders cannot reassign or remove themselves without Student Affairs approval.
                      </Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Governor Selection */}
                  <Surface className="flex flex-col gap-3 p-4 rounded-2xl border border-border/40 bg-surface-secondary/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <ShieldCheck className="text-accent" size={14} />
                        Governor / President
                      </span>
                      {governorLocked ? (
                        <Chip color="warning" size="sm" variant="soft">
                          Locked (Self)
                        </Chip>
                      ) : null}
                    </div>

                    <CandidateAutocomplete
                      candidates={candidates}
                      description="Primary student signatory for proposals and roster oversight."
                      disabledKeys={adviserId ? [adviserId] : []}
                      isDisabled={governorLocked}
                      label="Assigned Governor"
                      placeholder="Select student governor…"
                      searchPlaceholder="Search students…"
                      value={governorId}
                      variant="secondary"
                      onChange={setGovernorId}
                    />
                  </Surface>

                  {/* Adviser Selection */}
                  <Surface className="flex flex-col gap-3 p-4 rounded-2xl border border-border/40 bg-surface-secondary/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <GraduationCap className="text-primary" size={14} />
                        Faculty Adviser
                      </span>
                      {adviserLocked ? (
                        <Chip color="warning" size="sm" variant="soft">
                          Locked (Self)
                        </Chip>
                      ) : null}
                    </div>

                    <CandidateAutocomplete
                      candidates={candidates}
                      description="Responsible for Stage 1 academic and activity endorsement."
                      disabledKeys={governorId ? [governorId] : []}
                      isDisabled={adviserLocked}
                      label="Assigned Adviser"
                      placeholder="Select faculty adviser…"
                      searchPlaceholder="Search faculty…"
                      value={adviserId}
                      variant="secondary"
                      onChange={setAdviserId}
                    />
                  </Surface>
                </div>
              </Modal.Body>

              <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-4 mt-2 border-t border-border/30">
                <Button
                  isDisabled={isSubmitting}
                  size="sm"
                  type="button"
                  variant="ghost"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={isSubmitting}
                  isPending={isSubmitting}
                  size="sm"
                  type="submit"
                  variant="primary"
                >
                  {isSubmitting ? <Spinner color="current" size="sm" /> : null}
                  {isSubmitting ? "Saving…" : "Save Leadership"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
