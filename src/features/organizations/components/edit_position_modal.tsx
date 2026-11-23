"use client";

import type { OrganizationMemberProfile } from "../types";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Avatar,
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
  TextField,
  toast,
} from "@heroui/react";
import { UserCheck } from "lucide-react";

import { updateMemberPosition } from "../services/organization_services";

export type EditPositionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMemberProfile | null;
  orgName: string;
};

export function EditPositionModal({
  isOpen,
  onClose,
  member,
  orgName,
}: EditPositionModalProps) {
  const router = useRouter();
  const [position, setPosition] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (member) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition(member.position || "");
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!member || !position.trim()) return;

    setIsSubmitting(true);
    const res = await updateMemberPosition(member.id, position.trim());

    setIsSubmitting(false);

    if (!res.success) {
      toast.danger("Failed to update position", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Position updated", {
      description: `${member.fullName}'s position was updated to "${res.data.position}".`,
    });
    onClose();
    router.refresh();
  };

  if (!member) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="md">
          <Modal.Dialog className="border border-border/40 shadow-lg bg-surface">
            <Modal.CloseTrigger />
            <Modal.Header>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <UserCheck size={18} />
                </div>
                <div>
                  <Modal.Heading className="text-base font-bold text-foreground">
                    Edit Member Position
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    {orgName} · Leadership &amp; Roster
                  </p>
                </div>
              </div>
            </Modal.Header>

            <Separator />

            <Form validationBehavior="native" onSubmit={handleSubmit}>
              <Modal.Body className="flex flex-col gap-4 py-4">
                <Surface className="p-3 rounded-2xl bg-surface-secondary/50 border border-border/40 flex items-center gap-3">
                  <Avatar className="w-10 h-10 rounded-xl bg-accent/15 text-accent font-bold shrink-0">
                    {member.avatarUrl ? (
                      <Avatar.Image
                        alt={member.fullName}
                        className="object-cover"
                        src={member.avatarUrl}
                      />
                    ) : null}
                    <Avatar.Fallback>
                      {member.fullName.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {member.fullName}
                    </span>
                    <span className="text-xs text-muted truncate">
                      {member.schoolId ? `ID: ${member.schoolId}` : member.email}
                    </span>
                  </div>
                </Surface>

                <TextField
                  isRequired
                  name="position"
                  value={position}
                  onChange={setPosition}
                >
                  <Label>Position Title</Label>
                  <Input placeholder="e.g. Vice President, Secretary, Committee Head…" />
                  <Description>Official title shown on the organization roster.</Description>
                  <FieldError />
                </TextField>

                <Alert status="accent">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>
                      Only the organization&apos;s Governor, Faculty Adviser, or Student Affairs staff have permission to modify roster positions.
                    </Alert.Description>
                  </Alert.Content>
                </Alert>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-2 pt-3 border-t border-border/30">
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
                  isDisabled={!position.trim() || isSubmitting}
                  isPending={isSubmitting}
                  size="sm"
                  type="submit"
                  variant="primary"
                >
                  {isSubmitting ? <Spinner color="current" size="sm" /> : null}
                  {isSubmitting ? "Saving…" : "Save Position"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
