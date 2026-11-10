"use client";

import type { ProposalFormData } from "../types";

import React from "react";
import {
  Button,
  Card,
  Input,
  ListBox,
  Select,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import {
  Calendar,
  FileText,
  Save,
  Send,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  saveDraft,
  submitProposal,
  resubmitProposal,
  validateProposalForm,
} from "../services/proposal_services";

export type ProposalFormProps = {
  initialData?: Partial<ProposalFormData>;
  proposalId?: string;
  isRevision?: boolean;
  organizations: { id: string; name: string; acronym: string }[];
  venues: { id: string; name: string; capacity: number; location: string | null }[];
};

export function ProposalForm({
  initialData,
  proposalId,
  isRevision = false,
  organizations,
  venues,
}: ProposalFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const [formData, setFormData] = React.useState<ProposalFormData>({
    title: initialData?.title ?? "",
    organizationId: initialData?.organizationId ?? organizations[0]?.id ?? "",
    purpose: initialData?.purpose ?? "",
    activitiesDesc: initialData?.activitiesDesc ?? "",
    venueId: initialData?.venueId ?? venues[0]?.id ?? "",
    startTime: initialData?.startTime ? new Date(initialData.startTime).toISOString().slice(0, 16) : "",
    endTime: initialData?.endTime ? new Date(initialData.endTime).toISOString().slice(0, 16) : "",
    registrationDeadline: initialData?.registrationDeadline ? new Date(initialData.registrationDeadline).toISOString().slice(0, 16) : "",
    capacity: initialData?.capacity ?? 100,
  });

  const selectedVenue = venues.find((v) => v.id === formData.venueId);

  const handleSaveDraft = async () => {
    setIsPending(true);
    try {
      const res = await saveDraft(formData, proposalId);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Failed to save draft");

        return;
      }

      toast.success("Proposal draft saved successfully.");
      router.push(`/proposals/${res.data}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = async () => {
    const validation = validateProposalForm(formData);

    if (!validation.isValid) {
      toast.danger(validation.error ?? "Please complete all required fields");

      return;
    }

    setIsPending(true);
    try {
      if (isRevision && proposalId) {
        const res = await resubmitProposal(proposalId, formData);

        if (!res.success) {
          toast.danger(res.error?.message ?? "Failed to resubmit");

          return;
        }

        toast.success("Revised proposal submitted for faculty adviser review.");
        router.push(`/proposals/${proposalId}`);
      } else {
        // Save draft first then submit
        const draftRes = await saveDraft(formData, proposalId);

        if (!draftRes.success) {
          toast.danger(draftRes.error?.message ?? "Failed to save proposal");

          return;
        }

        const targetId = draftRes.data;
        const submitRes = await submitProposal(targetId);

        if (!submitRes.success) {
          toast.danger(submitRes.error?.message ?? "Submission failed");

          return;
        }

        toast.success("Proposal submitted for faculty adviser review! 🚀");
        router.push(`/proposals/${targetId}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* 1. Core Event Metadata */}
      <Card className="border border-border/30 bg-surface p-6 gap-5">
        <div className="flex items-center gap-2 border-b border-border/20 pb-3">
          <FileText className="text-primary size-5" />
          <h2 className="text-base font-semibold text-foreground">Event Overview</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-foreground">
              Event Title <span className="text-danger">*</span>
            </label>
            <TextField
              aria-label="Event Title"
              value={formData.title}
              onChange={(val) => setFormData((prev) => ({ ...prev, title: val }))}
            >
              <Input placeholder="e.g. Annual University Tech Summit 2026" />
            </TextField>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Host Student Organization <span className="text-danger">*</span>
            </label>
            <Select
              aria-label="Host Organization"
              className="w-full"
              value={formData.organizationId}
              onChange={(val) => setFormData((prev) => ({ ...prev, organizationId: String(val) }))}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {organizations.map((org) => (
                    <ListBox.Item key={org.id} id={org.id} textValue={org.name}>
                      {org.name} ({org.acronym})
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Target Campus Venue <span className="text-danger">*</span>
            </label>
            <Select
              aria-label="Target Venue"
              className="w-full"
              value={formData.venueId}
              onChange={(val) => setFormData((prev) => ({ ...prev, venueId: String(val) }))}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {venues.map((v) => (
                    <ListBox.Item key={v.id} id={v.id} textValue={v.name}>
                      {v.name} ({v.capacity} max cap)
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            {selectedVenue && (
              <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                <MapPin size={12} />
                <span>{selectedVenue.location ?? "Campus Grounds"} · Max Venue Capacity: {selectedVenue.capacity}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">
            Event Purpose & Objectives <span className="text-danger">*</span>
          </label>
          <TextArea
            aria-label="Event Purpose"
            className="w-full text-xs"
            placeholder="Clearly explain the educational, cultural, or community purpose of this proposed activity..."
            rows={3}
            value={formData.purpose}
            onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">
            Detailed Schedule of Activities <span className="text-danger">*</span>
          </label>
          <TextArea
            aria-label="Schedule of Activities"
            className="w-full text-xs"
            placeholder="Outline the sequence of activities, speeches, workshops, and intermissions..."
            rows={4}
            value={formData.activitiesDesc}
            onChange={(e) => setFormData((prev) => ({ ...prev, activitiesDesc: e.target.value }))}
          />
        </div>
      </Card>

      {/* 2. Schedule, Capacity & Deadlines */}
      <Card className="border border-border/30 bg-surface p-6 gap-5">
        <div className="flex items-center gap-2 border-b border-border/20 pb-3">
          <Calendar className="text-primary size-5" />
          <h2 className="text-base font-semibold text-foreground">Schedule & Attendance Capacity</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Event Start Time <span className="text-danger">*</span>
            </label>
            <input
              aria-label="Event Start Time"
              className="w-full text-xs bg-field border border-field-border rounded-xl px-3 py-2 text-foreground focus:outline-accent"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Event End Time <span className="text-danger">*</span>
            </label>
            <input
              aria-label="Event End Time"
              className="w-full text-xs bg-field border border-field-border rounded-xl px-3 py-2 text-foreground focus:outline-accent"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Student Registration Deadline <span className="text-danger">*</span>
            </label>
            <input
              aria-label="Registration Deadline"
              className="w-full text-xs bg-field border border-field-border rounded-xl px-3 py-2 text-foreground focus:outline-accent"
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(e) => setFormData((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
            />
            <span className="text-[11px] text-muted">Must be on or before the event start time.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Participant Target Capacity <span className="text-danger">*</span>
            </label>
            <TextField
              aria-label="Participant Capacity"
              value={String(formData.capacity)}
              onChange={(val) => {
                const num = parseInt(val, 10);

                setFormData((prev) => ({ ...prev, capacity: isNaN(num) ? 0 : num }));
              }}
            >
              <Input min={1} placeholder="100" type="number" />
            </TextField>
            {selectedVenue && formData.capacity > selectedVenue.capacity && (
              <span className="text-[11px] text-warning font-medium">
                Note: Capacity exceeds the venue standard limit ({selectedVenue.capacity}).
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          isDisabled={isPending}
          size="md"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          {!isRevision && (
            <Button
              isDisabled={isPending}
              size="md"
              variant="secondary"
              onClick={handleSaveDraft}
            >
              <Save size={16} />
              Save as Draft
            </Button>
          )}

          <Button
            isDisabled={isPending}
            size="md"
            variant="primary"
            onClick={handleSubmit}
          >
            <Send size={16} />
            {isRevision ? "Resubmit Revised Proposal" : "Submit Proposal"}
          </Button>
        </div>
      </div>
    </div>
  );
}
