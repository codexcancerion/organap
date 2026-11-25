"use client";

import type { ActivityType, EventDetail } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Chip,
  ProgressBar,
} from "@heroui/react";
import {
  Ban,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Tag,
  UserCheck,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";
import { EventAttachmentsCard } from "@/components/ui/event_attachments_card";
import { mergeEventRationale } from "@/utils/formatters";

import { ACTIVITY_TYPE_LABELS } from "../types";

import { CancelEventModal } from "./cancel_event_modal";

export type EventDetailCardProps = {
  event: EventDetail;
  isStaffOrSA?: boolean;
  canViewReviewRecord?: boolean;
  canManageAttendance?: boolean;
  actionSlot?: React.ReactNode;
};

export function EventDetailCard({
  event,
  isStaffOrSA = false,
  canViewReviewRecord = false,
  canManageAttendance = false,
  actionSlot,
}: EventDetailCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);

  const percentFilled =
    event.capacity > 0
      ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100))
      : 0;
  const isCancelled = event.status === "cancelled";

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          (!isCancelled && (actionSlot || isStaffOrSA || canManageAttendance)) ||
          canViewReviewRecord ? (
            <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
              <div className="flex flex-wrap items-center gap-2">
                {/* Slot for Registration action button from registrations feature */}
                {!isCancelled ? actionSlot : null}

                {!isCancelled && canManageAttendance ? (
                  <NextLink href={`/attendance/${event.id}`}>
                    <Button size="sm" variant="secondary">
                      <UserCheck size={15} />
                      Attendance Desk
                    </Button>
                  </NextLink>
                ) : null}

                {canViewReviewRecord ? (
                  <NextLink href={`/events/${event.id}?view=review`}>
                    <Button size="sm" variant="secondary">
                      <FileText size={15} />
                      Proposal &amp; Approval Record
                    </Button>
                  </NextLink>
                ) : null}
              </div>

              {/* Student Affairs cancellation action (FR-15) */}
              {!isCancelled && isStaffOrSA ? (
                <Button
                  className="text-danger hover:bg-danger/10"
                  size="sm"
                  variant="ghost"
                  onPress={() => setIsCancelModalOpen(true)}
                >
                  <Ban size={15} />
                  Cancel Event
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
        actionsLayout="stacked"
        badge={
          isCancelled ? (
            <Chip color="danger" size="sm" variant="soft">
              Cancelled
            </Chip>
          ) : (
            <Chip color="success" size="sm" variant="soft">
              <CheckCircle2 className="mr-1 inline" size={12} />
              Approved Event
            </Chip>
          )
        }
        breadcrumbs={[
          { label: "Back to Events Catalog", href: "/events" },
          { label: event.title },
        ]}
        description={`Organized by ${event.organizationName} (${event.organizationAcronym})`}
        title={event.title}
      />

      {/* Cancellation Notice Banner */}
      {isCancelled && (
        <Card className="border border-danger/30 bg-danger/10 p-5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-danger font-semibold text-sm">
            <Ban size={16} />
            <span>Event Cancelled by Student Affairs</span>
          </div>
          <p className="text-xs text-foreground/90">
            <strong>Official Reason:</strong> {event.cancellationReason ?? "Administrative cancellation."}
          </p>
        </Card>
      )}

      {/* Event Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Rationale & Attachments */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border border-border/30 bg-surface p-6 gap-4">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <FileText className="text-primary size-5" />
              <h2 className="text-base font-bold text-foreground">Event Rationale &amp; Description</h2>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {mergeEventRationale(event.purpose, event.activitiesDesc)}
            </p>
          </Card>

          {event.attachments && event.attachments.length > 0 ? (
            <EventAttachmentsCard attachments={event.attachments} />
          ) : null}
        </div>

        {/* Right Column: Event Logistics & Capacity */}
        <div className="flex flex-col gap-5">
          <Card className="border border-border/30 bg-surface p-5 gap-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              Event Logistics
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-3">
                <Tag className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {ACTIVITY_TYPE_LABELS[event.activityType as ActivityType] ?? event.activityType ?? "Seminar / Conference"}
                  </p>
                  <p className="text-muted text-[11px]">Activity Type</p>
                </div>
              </div>

              {event.semesterName ? (
                <div className="flex items-start gap-3">
                  <CalendarRange className="text-primary size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">{event.semesterName}</p>
                    <p className="text-muted text-[11px]">Academic Semester</p>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-3">
                <MapPin className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">{event.venueName}</p>
                  <p className="text-muted text-[11px]">{event.venueLocation ?? "Campus Grounds"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-primary size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(event.startTime).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-muted text-[11px]">
                    {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="text-warning size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">
                    {new Date(event.registrationDeadline).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-muted text-[11px]">Registration Deadline</p>
                </div>
              </div>
            </div>

            {/* Attendance Capacity Progress */}
            <div className="flex flex-col gap-2 pt-3 border-t border-border/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted flex items-center gap-1">
                  <Users size={13} />
                  Confirmed Registrations
                </span>
                <span className="font-bold text-foreground">
                  {event.registeredCount} / {event.capacity}
                </span>
              </div>
              <ProgressBar
                aria-label="Confirmed registrations capacity"
                color={
                  percentFilled >= 100
                    ? "danger"
                    : percentFilled >= 80
                      ? "warning"
                      : "accent"
                }
                size="sm"
                value={percentFilled}
              >
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
              <p className="text-[11px] text-muted text-right">
                {Math.max(0, event.capacity - event.registeredCount)} spots remaining
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <CancelEventModal
          eventId={event.id}
          eventTitle={event.title}
          isOpen={isCancelModalOpen}
          onOpenChange={setIsCancelModalOpen}
        />
      )}
    </div>
  );
}
