"use client";

import type { VenueDetail, VenuePermissions } from "../types";

import React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, toast } from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Settings,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";
import { Section } from "@/components/layout/section";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";
import { ProposalStatusChip } from "@/components/ui/proposal_status_chip";

import { deleteVenue } from "../services/venue_services";
import { DEFAULT_VENUE_PERMISSIONS } from "../types";

import { VenueIconBadge } from "./venue_icon_badge";
import { VenueModal } from "./venue_modal";

export type VenueDetailViewProps = {
  venue: VenueDetail;
  permissions?: VenuePermissions;
};

export function VenueDetailView({
  venue,
  permissions = DEFAULT_VENUE_PERMISSIONS,
}: VenueDetailViewProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const now = new Date().toISOString();

  const upcomingEvents = venue.events.filter((e) => e.endTime >= now);
  const pastEvents = venue.events.filter((e) => e.endTime < now);

  const canOpenSettings = permissions.canChange || permissions.canDelete;
  const hasLinkedEvents = venue.events.length > 0;

  const handleDelete = async () => {
    const res = await deleteVenue(venue.id);

    if (!res.success) {
      toast.danger("Failed to delete venue", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Venue deleted", {
      description: `Removed "${venue.name}" from campus venues.`,
    });
    setIsDeleteOpen(false);
    router.push("/venues");
    router.refresh();
  };

  const headerActions = canOpenSettings ? (
    <Button size="sm" variant="secondary" onPress={() => setIsSettingsOpen(true)}>
      <Settings size={14} />
      Settings
    </Button>
  ) : undefined;

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* ── Unified Cardless Page Header with Breadcrumbs & Single Status Chip ── */}
      <PageHeader
        actions={headerActions}
        badge={
          <Chip
            color={venue.isActive ? "success" : "default"}
            size="sm"
            variant="soft"
          >
            {venue.isActive ? "Authorized Facility" : "Maintenance / Unavailable"}
          </Chip>
        }
        breadcrumbs={[
          { label: "Back to Venues", href: "/venues" },
          { label: venue.name },
        ]}
        description={
          venue.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} />
              {venue.location}
            </span>
          ) : (
            "Campus event facility and reservation schedule."
          )
        }
        media={
          <VenueIconBadge
            color={venue.color}
            icon={venue.icon}
            size="lg"
          />
        }
        title={venue.name}
      />

      {/* ── Venue Capacity & Booking Summary KPIs (below header) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted">Max Capacity</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-foreground">{venue.capacity}</span>
            <span className="text-xs text-muted">seating limit</span>
          </div>
        </Card>

        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted">Upcoming Bookings</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-accent">{upcomingEvents.length}</span>
            <span className="text-xs text-muted">active / pending</span>
          </div>
        </Card>

        <Card className="border border-border/30 bg-surface p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted">Total Bookings</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-extrabold text-primary">{venue.events.length}</span>
            <span className="text-xs text-muted">all recorded</span>
          </div>
        </Card>
      </div>

      {/* ── Linked Events Schedule Section ── */}
      <Section
        description={`All campus proposals and confirmed activities utilizing ${venue.name}`}
        title="Linked Event Schedule"
      >
        <div className="flex flex-col gap-6">
          {/* Upcoming Bookings */}
          <Section
            as="h3"
            badge={
              <Chip color="accent" size="sm" variant="soft">
                {upcomingEvents.length}
              </Chip>
            }
            icon={<Calendar className="text-accent" size={17} />}
            title="Upcoming & In-Review Schedule"
          >
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <NextLink key={event.id} className="block group" href={`/events/${event.id}`}>
                    <Card className="p-5 bg-surface border border-border/30 hover:border-accent/40 transition-colors flex flex-col justify-between gap-3 cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-accent">
                          {event.organizationAcronym} · {event.organizationName}
                        </span>
                        <ProposalStatusChip status={event.status} />
                      </div>
                      <h4 className="font-bold text-base text-foreground group-hover:text-accent transition-colors line-clamp-1">
                        {event.title}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted pt-2 border-t border-border/20">
                        <div className="flex items-center gap-1.5 col-span-2">
                          <Clock className="text-primary shrink-0" size={13} />
                          <span>
                            {new Date(event.startTime).toLocaleDateString()} · {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="text-primary shrink-0" size={13} />
                          <span>{event.capacity} expected</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-border/20 flex items-center justify-end text-xs text-accent font-semibold group-hover:translate-x-0.5 transition-transform">
                        View Event <ArrowRight size={13} />
                      </div>
                    </Card>
                  </NextLink>
                ))}
              </div>
            ) : (
              <Card className="border border-dashed border-border/60 bg-surface p-6 text-center text-xs text-muted">
                No upcoming events are currently booked for this facility.
              </Card>
            )}
          </Section>

          {/* Past Bookings */}
          {pastEvents.length > 0 ? (
            <Section bordered as="h3" title="Past Venue Events">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-80">
                {pastEvents.map((event) => (
                  <NextLink key={event.id} className="block group" href={`/events/${event.id}`}>
                    <Card className="p-4 bg-surface border border-border/20 flex flex-col justify-between gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted">{event.organizationAcronym}</span>
                        <ProposalStatusChip status={event.status} />
                      </div>
                      <span className="font-semibold text-sm text-foreground line-clamp-1">
                        {event.title}
                      </span>
                      <span className="text-[11px] text-muted">
                        {new Date(event.startTime).toLocaleDateString()}
                      </span>
                    </Card>
                  </NextLink>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      </Section>

      {canOpenSettings ? (
        <VenueModal
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          isOpen={isSettingsOpen}
          venueToEdit={venue}
          onClose={() => setIsSettingsOpen(false)}
          onRequestDelete={() => {
            setIsSettingsOpen(false);
            setIsDeleteOpen(true);
          }}
        />
      ) : null}

      {permissions.canDelete ? (
        <ConfirmDeleteModal
          confirmLabel="Delete Venue"
          description={
            hasLinkedEvents ? (
              <span>
                <strong>{venue.name}</strong> is referenced by{" "}
                <strong>{venue.events.length}</strong> event proposal
                {venue.events.length === 1 ? "" : "s"}. Toggle its availability status to{" "}
                <strong>Maintenance</strong> in Venue Settings instead of deleting.
              </span>
            ) : (
              <span>
                Are you sure you want to permanently remove{" "}
                <strong>{venue.name}</strong>? This action cannot be undone.
              </span>
            )
          }
          isConfirmDisabled={hasLinkedEvents}
          isOpen={isDeleteOpen}
          title="Delete Venue"
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
