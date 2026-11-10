"use client";

import type { EventDetail } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Chip,
} from "@heroui/react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  ArrowLeft,
  Ban,
  CheckCircle2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";

import { CancelEventModal } from "./cancel_event_modal";

export type EventDetailCardProps = {
  event: EventDetail;
  isStaffOrSA?: boolean;
  actionSlot?: React.ReactNode;
};

export function EventDetailCard({
  event,
  isStaffOrSA = false,
  actionSlot,
}: EventDetailCardProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);

  const percentFilled = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));
  const isCancelled = event.status === "cancelled";

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <NextLink
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors w-fit"
        href="/events"
      >
        <ArrowLeft size={14} />
        Back to Events Catalog
      </NextLink>

      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Slot for Registration action button from registrations feature */}
            {!isCancelled && actionSlot}

            {/* Student Affairs cancellation action (FR-15) */}
            {isStaffOrSA && !isCancelled && (
              <Button
                className="text-danger hover:bg-danger/10"
                size="md"
                variant="ghost"
                onClick={() => setIsCancelModalOpen(true)}
              >
                <Ban size={16} />
                Cancel Event
              </Button>
            )}
          </div>
        }
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
        {/* Left Column: Purpose & Program */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="border border-border/30 bg-surface p-6 gap-4">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <FileText className="text-primary size-5" />
              <h2 className="text-base font-bold text-foreground">Event Purpose & Objectives</h2>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {event.purpose}
            </p>
          </Card>

          <Card className="border border-border/30 bg-surface p-6 gap-4">
            <div className="flex items-center gap-2 border-b border-border/20 pb-3">
              <Calendar className="text-primary size-5" />
              <h2 className="text-base font-bold text-foreground">Program & Activities Sequence</h2>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {event.activitiesDesc}
            </p>
          </Card>
        </div>

        {/* Right Column: Event Logistics & Capacity */}
        <div className="flex flex-col gap-5">
          <Card className="border border-border/30 bg-surface p-5 gap-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
              Event Logistics
            </h3>

            <div className="flex flex-col gap-3 text-xs">
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
              <div className="w-full h-2 rounded-full bg-default/20 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentFilled >= 100
                      ? "bg-danger"
                      : percentFilled >= 80
                        ? "bg-warning"
                        : "bg-primary"
                  }`}
                  style={{ width: `${percentFilled}%` }}
                />
              </div>
              <p className="text-[11px] text-muted text-right">
                {event.capacity - event.registeredCount} spots remaining
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
