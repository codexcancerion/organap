"use client";

import type { DateRange, DateValue, TimeValue } from "@heroui/react";
import type {
  ActivityType,
  AttachmentType,
  EventAttachment,
  ProposalFormData,
  ProposalSemesterOption,
} from "../types";

import React, { useSyncExternalStore } from "react";
import { CalendarDateTime } from "@internationalized/date";
import {
  Button,
  Calendar,
  Card,
  Chip,
  DateField,
  DatePicker,
  DateRangePicker,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  RangeCalendar,
  Select,
  TextArea,
  TextField,
  TimeField,
  toast,
} from "@heroui/react";
import {
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Paperclip,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { groupByAttachmentCategory } from "@/utils/formatters";
import { validateEventAttachmentFile } from "@/utils/supabase/event_attachments";

import { ACTIVITY_TYPE_LABELS } from "../types";
import {
  removeProposalAttachment,
  resubmitProposal,
  saveDraft,
  submitProposal,
  uploadProposalAttachment,
  validateProposalForm,
} from "../services/proposal_services";

export type ProposalFormProps = {
  initialData?: Partial<ProposalFormData>;
  proposalId?: string;
  currentStatus?: string;
  isRevision?: boolean;
  organizations: { id: string; name: string; acronym: string }[];
  venues: { id: string; name: string; capacity: number; location: string | null }[];
  semesters?: ProposalSemesterOption[];
  attachmentTypes?: AttachmentType[];
  existingAttachments?: EventAttachment[];
};

type StagedAttachment = {
  tempId: string;
  attachmentTypeId: string | null;
  attachmentTypeName: string | null;
  attachmentTypeCode: string | null;
  attachmentTypeCategory: string | null;
  file: File;
};

function mergeLegacyRationale(purpose?: string, activitiesDesc?: string): string {
  const base = (purpose ?? "").trim();
  const extra = (activitiesDesc ?? "").trim();

  if (!extra) return base;
  if (!base) return extra;
  if (base.includes(extra)) return base;

  return `${base}\n\n${extra}`;
}

function pickDefaultSemesterId(semesters: ProposalSemesterOption[]): string | null {
  if (semesters.length === 0) return null;

  const today = new Date().toISOString().slice(0, 10);
  const current = semesters.find(
    (s) => s.startDate <= today && today <= s.endDate,
  );

  return (current ?? semesters[0]).id;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toCalendarDateTime(value?: string | null): CalendarDateTime | null {
  if (!value) return null;

  const d = new Date(value);

  if (isNaN(d.getTime())) return null;

  return new CalendarDateTime(
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
  );
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function dateValueToIsoString(val: DateValue | null): string {
  if (!val) return "";

  const hour = "hour" in val ? val.hour : 0;
  const minute = "minute" in val ? val.minute : 0;

  return new Date(val.year, val.month - 1, val.day, hour, minute).toISOString();
}

export function ProposalForm({
  initialData,
  proposalId,
  currentStatus,
  isRevision = false,
  organizations,
  venues,
  semesters = [],
  attachmentTypes = [],
  existingAttachments = [],
}: ProposalFormProps) {
  const router = useRouter();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [isPending, setIsPending] = React.useState(false);
  const [uploadingSlotKey, setUploadingSlotKey] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<ProposalFormData>(() => ({
    title: initialData?.title ?? "",
    organizationId: initialData?.organizationId ?? organizations[0]?.id ?? "",
    purpose: mergeLegacyRationale(initialData?.purpose, initialData?.activitiesDesc),
    activitiesDesc: "",
    activityType: initialData?.activityType ?? "seminar",
    semesterId:
      initialData?.semesterId !== undefined
        ? initialData.semesterId
        : pickDefaultSemesterId(semesters),
    venueId: initialData?.venueId ?? venues[0]?.id ?? "",
    startTime: initialData?.startTime ?? "",
    endTime: initialData?.endTime ?? "",
    registrationDeadline: initialData?.registrationDeadline ?? "",
    capacity: initialData?.capacity ?? 100,
  }));

  const scheduleRange = React.useMemo<DateRange | null>(() => {
    const start = toCalendarDateTime(formData.startTime);
    const end = toCalendarDateTime(formData.endTime);

    if (!start || !end) return null;

    return { start, end };
  }, [formData.startTime, formData.endTime]);

  const deadlineValue = React.useMemo<CalendarDateTime | null>(
    () => toCalendarDateTime(formData.registrationDeadline),
    [formData.registrationDeadline],
  );

  const isDeadlineInvalid = Boolean(
    formData.registrationDeadline &&
      formData.startTime &&
      new Date(formData.registrationDeadline).getTime() >
        new Date(formData.startTime).getTime(),
  );

  const handleScheduleRangeChange = (range: DateRange | null) => {
    setFormData((prev) => ({
      ...prev,
      startTime: range ? dateValueToIsoString(range.start) : "",
      endTime: range ? dateValueToIsoString(range.end) : "",
    }));
  };

  const handleDeadlineChange = (val: DateValue | null) => {
    setFormData((prev) => ({
      ...prev,
      registrationDeadline: dateValueToIsoString(val),
    }));
  };

  const [uploadedAttachments, setUploadedAttachments] = React.useState<EventAttachment[]>(
    existingAttachments,
  );
  const [stagedAttachments, setStagedAttachments] = React.useState<StagedAttachment[]>([]);

  const selectedVenue = venues.find((v) => v.id === formData.venueId);

  const handleFilePicked = async (
    files: FileList | null,
    attachmentType: AttachmentType | null,
  ) => {
    if (!files || files.length === 0) return;

    const slotKey = attachmentType ? attachmentType.id : "general";
    const fileList = Array.from(files);

    for (const file of fileList) {
      const fileErr = validateEventAttachmentFile(file);

      if (fileErr) {
        toast.danger("Invalid file", { description: fileErr });
        continue;
      }

      if (proposalId) {
        setUploadingSlotKey(slotKey);
        try {
          const res = await uploadProposalAttachment({
            proposalId,
            attachmentTypeId: attachmentType?.id ?? null,
            attachmentTypeName: attachmentType?.name ?? null,
            attachmentTypeCode: attachmentType?.code ?? null,
            attachmentTypeCategory: attachmentType?.category ?? null,
            file,
          });

          if (!res.success) {
            toast.danger("Upload failed", { description: res.error.message });
            continue;
          }

          setUploadedAttachments((prev) => [...prev, res.data]);
          toast.success("Attachment uploaded", { description: file.name });
        } finally {
          setUploadingSlotKey(null);
        }
      } else {
        setStagedAttachments((prev) => [
          ...prev,
          {
            tempId: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            attachmentTypeId: attachmentType?.id ?? null,
            attachmentTypeName: attachmentType?.name ?? null,
            attachmentTypeCode: attachmentType?.code ?? null,
            attachmentTypeCategory: attachmentType?.category ?? null,
            file,
          },
        ]);
      }
    }
  };

  const handleRemoveUploaded = async (attachment: EventAttachment) => {
    const res = await removeProposalAttachment(attachment.id, attachment.filePath);

    if (!res.success) {
      toast.danger("Failed to remove attachment", { description: res.error.message });

      return;
    }

    setUploadedAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    toast.success("Attachment removed");
  };

  const handleRemoveStaged = (tempId: string) => {
    setStagedAttachments((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const uploadStagedFilesForProposal = async (targetProposalId: string): Promise<boolean> => {
    if (stagedAttachments.length === 0) return true;

    for (const item of stagedAttachments) {
      const res = await uploadProposalAttachment({
        proposalId: targetProposalId,
        attachmentTypeId: item.attachmentTypeId,
        attachmentTypeName: item.attachmentTypeName,
        attachmentTypeCode: item.attachmentTypeCode,
        attachmentTypeCategory: item.attachmentTypeCategory,
        file: item.file,
      });

      if (!res.success) {
        toast.danger(`Failed to upload "${item.file.name}"`, {
          description: res.error.message,
        });

        return false;
      }
    }

    setStagedAttachments([]);

    return true;
  };

  const getMissingRequiredAttachments = (): AttachmentType[] => {
    const requiredTypes = attachmentTypes.filter((t) => t.isRequired);

    if (requiredTypes.length === 0) return [];

    const coveredTypeIds = new Set<string>([
      ...uploadedAttachments
        .map((a) => a.attachmentTypeId)
        .filter((id): id is string => Boolean(id)),
      ...stagedAttachments
        .map((a) => a.attachmentTypeId)
        .filter((id): id is string => Boolean(id)),
    ]);

    return requiredTypes.filter((t) => !coveredTypeIds.has(t.id));
  };

  const handleSaveDraft = async () => {
    setIsPending(true);
    try {
      const res = await saveDraft(formData, proposalId, currentStatus);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Failed to save draft");

        return;
      }

      const uploadedOk = await uploadStagedFilesForProposal(res.data);

      if (!uploadedOk) {
        router.push(`/events/${res.data}/edit`);
        router.refresh();

        return;
      }

      toast.success(
        isRevision
          ? "Revision progress saved."
          : "Proposal draft saved successfully.",
      );
      router.push(`/events/${res.data}`);
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

    const missingRequired = getMissingRequiredAttachments();

    if (missingRequired.length > 0) {
      toast.danger("Missing required attachments", {
        description: `Please attach: ${missingRequired.map((m) => m.name).join(", ")}.`,
      });

      return;
    }

    setIsPending(true);
    try {
      if (isRevision && proposalId) {
        const uploadedOk = await uploadStagedFilesForProposal(proposalId);

        if (!uploadedOk) return;

        const res = await resubmitProposal(proposalId, formData);

        if (!res.success) {
          toast.danger(res.error?.message ?? "Failed to resubmit");

          return;
        }

        toast.success("Revised proposal submitted for faculty adviser review.");
        router.push(`/events/${proposalId}`);
      } else {
        const draftRes = await saveDraft(formData, proposalId);

        if (!draftRes.success) {
          toast.danger(draftRes.error?.message ?? "Failed to save proposal");

          return;
        }

        const targetId = draftRes.data;
        const uploadedOk = await uploadStagedFilesForProposal(targetId);

        if (!uploadedOk) return;

        const submitRes = await submitProposal(targetId);

        if (!submitRes.success) {
          toast.danger(submitRes.error?.message ?? "Submission failed");

          return;
        }

        toast.success("Proposal submitted for faculty adviser review!");
        router.push(`/events/${targetId}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  const activityTypeEntries = Object.entries(ACTIVITY_TYPE_LABELS) as [ActivityType, string][];
  const generalUploaded = uploadedAttachments.filter((a) => !a.attachmentTypeId);
  const generalStaged = stagedAttachments.filter((a) => !a.attachmentTypeId);
  const groupedAttachmentTypes = React.useMemo(
    () => groupByAttachmentCategory(attachmentTypes, (item) => item.category),
    [attachmentTypes],
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* 1. Core Event Metadata & Rationale */}
      <Card className="border border-border/30 bg-surface p-6 gap-5">
        <div className="flex items-center gap-2 border-b border-border/20 pb-3">
          <FileText className="text-primary size-5" />
          <h2 className="text-base font-semibold text-foreground">Event Overview &amp; Rationale</h2>
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
              Activity Type <span className="text-danger">*</span>
            </label>
            <Select
              aria-label="Activity Type"
              className="w-full"
              value={formData.activityType}
              onChange={(val) => setFormData((prev) => ({ ...prev, activityType: String(val) }))}
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {activityTypeEntries.map(([key, label]) => (
                    <ListBox.Item key={key} id={key} textValue={label}>
                      {label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">
              Academic Semester
            </label>
            <Select
              aria-label="Academic Semester"
              className="w-full"
              value={formData.semesterId ?? "none"}
              onChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  semesterId: val && String(val) !== "none" ? String(val) : null,
                }))
              }
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="none" textValue="Unassigned">
                    Unassigned
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {semesters.map((semester) => (
                    <ListBox.Item key={semester.id} id={semester.id} textValue={semester.name}>
                      {semester.name}
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

          <div className="flex flex-col gap-1.5 md:col-span-2">
            {/* INVARIANT: Gate React Aria date segments behind isMounted so SSR HTML matches client locale formatting without hydration errors. */}
            {isMounted ? (
              <DateRangePicker
                hideTimeZone
                isRequired
                className="w-full"
                endName="endTime"
                granularity="minute"
                startName="startTime"
                value={scheduleRange}
                onChange={handleScheduleRangeChange}
              >
                {({ state }) => (
                  <>
                    <Label className="text-xs font-semibold text-foreground">
                      Event Schedule (Start – End)
                    </Label>
                    <DateField.Group fullWidth variant="secondary">
                      <DateField.InputContainer>
                        <DateField.Input slot="start">
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateRangePicker.RangeSeparator />
                        <DateField.Input slot="end">
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                      </DateField.InputContainer>
                      <DateField.Suffix>
                        <DateRangePicker.Trigger>
                          <DateRangePicker.TriggerIndicator />
                        </DateRangePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>
                    {/* WHY: Cap width with !min-w-0 w-fit max-w-72 so the popover hugs the calendar grid instead of stretching across the two-column trigger width. */}
                    <DateRangePicker.Popover className="flex !min-w-0 w-fit max-w-72 flex-col gap-3 p-3">
                      <RangeCalendar aria-label="Event schedule range">
                        <RangeCalendar.Header>
                          <RangeCalendar.YearPickerTrigger>
                            <RangeCalendar.YearPickerTriggerHeading />
                            <RangeCalendar.YearPickerTriggerIndicator />
                          </RangeCalendar.YearPickerTrigger>
                          <RangeCalendar.NavButton slot="previous" />
                          <RangeCalendar.NavButton slot="next" />
                        </RangeCalendar.Header>
                        <RangeCalendar.Grid>
                          <RangeCalendar.GridHeader>
                            {(day) => (
                              <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                            )}
                          </RangeCalendar.GridHeader>
                          <RangeCalendar.GridBody>
                            {(date) => <RangeCalendar.Cell date={date} />}
                          </RangeCalendar.GridBody>
                        </RangeCalendar.Grid>
                        <RangeCalendar.YearPickerGrid>
                          <RangeCalendar.YearPickerGridBody>
                            {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                          </RangeCalendar.YearPickerGridBody>
                        </RangeCalendar.YearPickerGrid>
                      </RangeCalendar>
                      <div className="flex flex-col gap-2.5 pt-2 border-t border-border/20">
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-xs">Start Time</Label>
                          <TimeField
                            hideTimeZone
                            aria-label="Start Time"
                            granularity="minute"
                            name="startTimeClock"
                            value={state.timeRange?.start ?? null}
                            onChange={(v) =>
                              state.setTimeRange({
                                end: state.timeRange?.end as TimeValue,
                                start: v as TimeValue,
                              })
                            }
                          >
                            <TimeField.Group variant="secondary">
                              <TimeField.Input>
                                {(segment) => <TimeField.Segment segment={segment} />}
                              </TimeField.Input>
                            </TimeField.Group>
                          </TimeField>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-xs">End Time</Label>
                          <TimeField
                            hideTimeZone
                            aria-label="End Time"
                            granularity="minute"
                            name="endTimeClock"
                            value={state.timeRange?.end ?? null}
                            onChange={(v) =>
                              state.setTimeRange({
                                end: v as TimeValue,
                                start: state.timeRange?.start as TimeValue,
                              })
                            }
                          >
                            <TimeField.Group variant="secondary">
                              <TimeField.Input>
                                {(segment) => <TimeField.Segment segment={segment} />}
                              </TimeField.Input>
                            </TimeField.Group>
                          </TimeField>
                        </div>
                      </div>
                    </DateRangePicker.Popover>
                  </>
                )}
              </DateRangePicker>
            ) : (
              <>
                <span className="text-xs font-semibold text-foreground">
                  Event Schedule (Start – End) <span className="text-danger">*</span>
                </span>
                <div
                  aria-hidden="true"
                  className="h-9 w-full rounded-xl bg-field border border-field-border"
                />
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {isMounted ? (
              <DatePicker
                hideTimeZone
                isRequired
                className="w-full"
                granularity="minute"
                isInvalid={isDeadlineInvalid}
                name="registrationDeadline"
                value={deadlineValue}
                onChange={handleDeadlineChange}
              >
                {({ state }) => (
                  <>
                    <Label className="text-xs font-semibold text-foreground">
                      Student Registration Deadline
                    </Label>
                    <DateField.Group fullWidth variant="secondary">
                      <DateField.Input>
                        {(segment) => <DateField.Segment segment={segment} />}
                      </DateField.Input>
                      <DateField.Suffix>
                        <DatePicker.Trigger>
                          <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                      </DateField.Suffix>
                    </DateField.Group>
                    {isDeadlineInvalid ? (
                      <FieldError className="text-[11px]">
                        Registration deadline cannot be after the event start time.
                      </FieldError>
                    ) : (
                      <Description className="text-[11px] text-muted">
                        Must be on or before the event start time.
                      </Description>
                    )}
                    <DatePicker.Popover className="flex !min-w-0 w-fit max-w-72 flex-col gap-3 p-3">
                      <Calendar aria-label="Registration deadline">
                        <Calendar.Header>
                          <Calendar.YearPickerTrigger>
                            <Calendar.YearPickerTriggerHeading />
                            <Calendar.YearPickerTriggerIndicator />
                          </Calendar.YearPickerTrigger>
                          <Calendar.NavButton slot="previous" />
                          <Calendar.NavButton slot="next" />
                        </Calendar.Header>
                        <Calendar.Grid>
                          <Calendar.GridHeader>
                            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                          </Calendar.GridHeader>
                          <Calendar.GridBody>
                            {(date) => <Calendar.Cell date={date} />}
                          </Calendar.GridBody>
                        </Calendar.Grid>
                        <Calendar.YearPickerGrid>
                          <Calendar.YearPickerGridBody>
                            {({ year }) => <Calendar.YearPickerCell year={year} />}
                          </Calendar.YearPickerGridBody>
                        </Calendar.YearPickerGrid>
                      </Calendar>
                      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/20">
                        <Label className="text-xs">Cutoff Time</Label>
                        <TimeField
                          hideTimeZone
                          aria-label="Registration Deadline Time"
                          granularity="minute"
                          name="deadlineTimeClock"
                          value={state.timeValue}
                          onChange={(v) => state.setTimeValue(v as TimeValue)}
                        >
                          <TimeField.Group variant="secondary">
                            <TimeField.Input>
                              {(segment) => <TimeField.Segment segment={segment} />}
                            </TimeField.Input>
                          </TimeField.Group>
                        </TimeField>
                      </div>
                    </DatePicker.Popover>
                  </>
                )}
              </DatePicker>
            ) : (
              <>
                <span className="text-xs font-semibold text-foreground">
                  Student Registration Deadline <span className="text-danger">*</span>
                </span>
                <div
                  aria-hidden="true"
                  className="h-9 w-full rounded-xl bg-field border border-field-border"
                />
                <span className="text-[11px] text-muted">
                  Must be on or before the event start time.
                </span>
              </>
            )}
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">
            Event Rationale &amp; Description <span className="text-danger">*</span>
          </label>
          <TextArea
            aria-label="Event Rationale"
            className="w-full text-xs"
            placeholder="Describe the educational, cultural, or organizational rationale, key objectives, and planned sequence of activities..."
            rows={6}
            value={formData.purpose}
            onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
          />
        </div>
      </Card>

      {/* 2. Dynamic Event Attachments */}
      <Card className="border border-border/30 bg-surface p-6 gap-5">
        <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-3">
          <div className="flex items-center gap-2">
            <Paperclip className="text-primary size-5" />
            <h2 className="text-base font-semibold text-foreground">Event Attachments</h2>
          </div>
          <span className="text-[11px] text-muted">
            PDF, Word, or Image · Max 10 MB per file
          </span>
        </div>

        {/* WHY: Group slots dynamically by database category with an Others fallback and surface optional OSAS templates inline instead of hardcoding categories. */}
        {groupedAttachmentTypes.length > 0 ? (
          <div className="flex flex-col gap-5">
            {groupedAttachmentTypes.map((group) => (
              <div key={group.category} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/20">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                    {group.category}
                  </h3>
                  <Chip size="sm" variant="soft">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "slot" : "slots"}
                  </Chip>
                </div>

                <div className="flex flex-col gap-3">
                  {group.items.map((typeItem) => {
                    const slotUploaded = uploadedAttachments.filter(
                      (a) => a.attachmentTypeId === typeItem.id,
                    );
                    const slotStaged = stagedAttachments.filter(
                      (a) => a.attachmentTypeId === typeItem.id,
                    );
                    const isUploadingThisSlot = uploadingSlotKey === typeItem.id;
                    const inputId = `attachment-input-${typeItem.id}`;

                    return (
                      <div
                        key={typeItem.id}
                        className="p-4 rounded-2xl border border-border/30 bg-default/5 flex flex-col gap-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">
                                {typeItem.name}
                              </span>
                              <Chip
                                color={typeItem.isRequired ? "warning" : "default"}
                                size="sm"
                                variant="soft"
                              >
                                {typeItem.isRequired ? "Required" : "Optional"}
                              </Chip>
                              <span className="text-[11px] font-mono text-muted">
                                {typeItem.code}
                              </span>
                            </div>
                            {typeItem.description ? (
                              <p className="text-xs text-muted">{typeItem.description}</p>
                            ) : null}
                          </div>

                          <div className="shrink-0 flex items-center gap-2 flex-wrap">
                            {typeItem.templateFileUrl ? (
                              <a
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border/50 hover:border-accent/50 text-accent transition-colors"
                                download={typeItem.templateFileName || undefined}
                                href={typeItem.templateFileUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <Download size={13} />
                                Download Template
                              </a>
                            ) : null}
                            <input
                              multiple
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                              className="sr-only"
                              disabled={isPending || isUploadingThisSlot}
                              id={inputId}
                              type="file"
                              onChange={(e) => {
                                void handleFilePicked(e.target.files, typeItem);
                                e.target.value = "";
                              }}
                            />
                            <label
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border/50 hover:border-accent/50 text-foreground cursor-pointer transition-colors"
                              htmlFor={inputId}
                            >
                              <Upload size={13} />
                              {isUploadingThisSlot ? "Uploading…" : "Upload File"}
                            </label>
                          </div>
                        </div>

                        {(slotUploaded.length > 0 || slotStaged.length > 0) && (
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-border/20">
                            {slotUploaded.map((att) => (
                              <div
                                key={att.id}
                                className="flex items-center justify-between gap-2 text-xs bg-surface px-3 py-2 rounded-xl border border-border/30"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <FileText className="text-accent shrink-0" size={14} />
                                  <a
                                    className="font-medium text-foreground hover:text-accent truncate inline-flex items-center gap-1"
                                    href={att.fileUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    <span className="truncate">{att.fileName}</span>
                                    <ExternalLink size={11} />
                                  </a>
                                  {att.uploadedByName ? (
                                    <span className="text-[11px] text-muted shrink-0">
                                      · Uploaded by {att.uploadedByName}
                                    </span>
                                  ) : null}
                                  {att.sizeBytes ? (
                                    <span className="text-[11px] text-muted shrink-0">
                                      ({formatBytes(att.sizeBytes)})
                                    </span>
                                  ) : null}
                                </div>
                                <Button
                                  isIconOnly
                                  aria-label={`Remove ${att.fileName}`}
                                  className="text-danger shrink-0"
                                  size="sm"
                                  variant="ghost"
                                  onPress={() => void handleRemoveUploaded(att)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            ))}

                            {slotStaged.map((staged) => (
                              <div
                                key={staged.tempId}
                                className="flex items-center justify-between gap-2 text-xs bg-surface px-3 py-2 rounded-xl border border-accent/30"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="text-accent shrink-0" size={14} />
                                  <span className="font-medium text-foreground truncate">
                                    {staged.file.name}
                                  </span>
                                  <Chip color="accent" size="sm" variant="soft">
                                    Ready to upload
                                  </Chip>
                                </div>
                                <Button
                                  isIconOnly
                                  aria-label={`Remove ${staged.file.name}`}
                                  className="text-danger shrink-0"
                                  size="sm"
                                  variant="ghost"
                                  onPress={() => handleRemoveStaged(staged.tempId)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">
            No mandatory attachment requirements are currently configured. You may attach optional supporting files below or submit without attachments.
          </p>
        )}

        {/* Optional Supporting Files */}
        <div className="p-4 rounded-2xl border border-dashed border-border/50 bg-default/5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-foreground">
                Additional Supporting Documents (Optional)
              </span>
              <p className="text-[11px] text-muted">
                Attach supplementary schedules, posters, or reference sheets if needed.
              </p>
            </div>
            <div>
              <input
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                disabled={isPending || uploadingSlotKey === "general"}
                id="attachment-input-general"
                type="file"
                onChange={(e) => {
                  void handleFilePicked(e.target.files, null);
                  e.target.value = "";
                }}
              />
              <label
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border/50 hover:border-accent/50 text-foreground cursor-pointer transition-colors"
                htmlFor="attachment-input-general"
              >
                <Upload size={13} />
                {uploadingSlotKey === "general" ? "Uploading…" : "Attach File"}
              </label>
            </div>
          </div>

          {(generalUploaded.length > 0 || generalStaged.length > 0) && (
            <div className="flex flex-col gap-1.5 pt-2 border-t border-border/20">
              {generalUploaded.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-2 text-xs bg-surface px-3 py-2 rounded-xl border border-border/30"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <FileText className="text-accent shrink-0" size={14} />
                    <a
                      className="font-medium text-foreground hover:text-accent truncate inline-flex items-center gap-1"
                      href={att.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="truncate">{att.fileName}</span>
                      <ExternalLink size={11} />
                    </a>
                    {att.uploadedByName ? (
                      <span className="text-[11px] text-muted shrink-0">
                        · Uploaded by {att.uploadedByName}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    isIconOnly
                    aria-label={`Remove ${att.fileName}`}
                    className="text-danger shrink-0"
                    size="sm"
                    variant="ghost"
                    onPress={() => void handleRemoveUploaded(att)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {generalStaged.map((staged) => (
                <div
                  key={staged.tempId}
                  className="flex items-center justify-between gap-2 text-xs bg-surface px-3 py-2 rounded-xl border border-accent/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="text-accent shrink-0" size={14} />
                    <span className="font-medium text-foreground truncate">
                      {staged.file.name}
                    </span>
                    <Chip color="accent" size="sm" variant="soft">
                      Ready to upload
                    </Chip>
                  </div>
                  <Button
                    isIconOnly
                    aria-label={`Remove ${staged.file.name}`}
                    className="text-danger shrink-0"
                    size="sm"
                    variant="ghost"
                    onPress={() => handleRemoveStaged(staged.tempId)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 4. Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          isDisabled={isPending}
          size="md"
          variant="ghost"
          onPress={() => router.back()}
        >
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <Button
            isDisabled={isPending}
            size="md"
            variant="secondary"
            onPress={handleSaveDraft}
          >
            <Save size={16} />
            {isRevision ? "Save Progress" : "Save as Draft"}
          </Button>

          <Button
            isDisabled={isPending}
            size="md"
            variant="primary"
            onPress={handleSubmit}
          >
            <Send size={16} />
            {isRevision ? "Resubmit Revised Proposal" : "Submit Proposal"}
          </Button>
        </div>
      </div>
    </div>
  );
}
