"use client";

import type { CatalogFilterField } from "@/components/ui/catalog_filter_dropdown";
import type { ActivityType, EventListItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  SearchField,
} from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Plus,
  Tag,
} from "lucide-react";

import { CatalogFilterDropdown } from "@/components/ui/catalog_filter_dropdown";
import { ProposalStatusChip } from "@/components/ui/proposal_status_chip";

import { ACTIVITY_TYPE_LABELS } from "../types";

export type EventCatalogProps = {
  events: EventListItem[];
  canCreateProposal?: boolean;
};

type EventStatusFilter = "all" | "approved" | "pending" | "drafts";

const PENDING_REVIEW_STATUSES = new Set([
  "pending_adviser",
  "pending_student_affairs",
]);

export function EventCatalog({
  events,
  canCreateProposal = false,
}: EventCatalogProps) {
  const [search, setSearch] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<EventStatusFilter>("all");
  const [activityTypeFilter, setActivityTypeFilter] = React.useState("all");

  const uniqueVenues = React.useMemo(() => {
    const map = new Map<string, string>();

    events.forEach((e) => map.set(e.venueId, e.venueName));

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);

  const uniqueActivityTypes = React.useMemo(() => {
    const set = new Set<string>();

    events.forEach((e) => {
      if (e.activityType) set.add(e.activityType);
    });

    return Array.from(set).map((id) => ({
      id,
      label: ACTIVITY_TYPE_LABELS[id as ActivityType] ?? id,
    }));
  }, [events]);

  const { approvedCount, pendingCount, draftsCount, hasProposals } = React.useMemo(() => {
    let approved = 0;
    let pending = 0;
    let drafts = 0;

    for (const item of events) {
      if (item.status === "approved") {
        approved += 1;
      } else if (PENDING_REVIEW_STATUSES.has(item.status)) {
        pending += 1;
      } else {
        drafts += 1;
      }
    }

    return {
      approvedCount: approved,
      pendingCount: pending,
      draftsCount: drafts,
      hasProposals: pending > 0 || drafts > 0,
    };
  }, [events]);

  const filterFields = React.useMemo<CatalogFilterField[]>(() => {
    const fields: CatalogFilterField[] = [];

    if (hasProposals) {
      fields.push({
        id: "status",
        label: "Status",
        ariaLabel: "Filter events by status",
        value: statusFilter,
        onChange: (val) => setStatusFilter(val as EventStatusFilter),
        options: [
          { id: "all", label: `All Statuses (${events.length})` },
          { id: "approved", label: `Approved (${approvedCount})` },
          { id: "pending", label: `In Review (${pendingCount})` },
          { id: "drafts", label: `Drafts & Returned (${draftsCount})` },
        ],
      });
    }

    fields.push({
      id: "venue",
      label: "Venue",
      ariaLabel: "Filter by venue",
      value: venueFilter,
      onChange: setVenueFilter,
      options: [
        { id: "all", label: "All Campus Venues" },
        ...uniqueVenues.map((v) => ({ id: v.id, label: v.name })),
      ],
    });

    if (uniqueActivityTypes.length > 1) {
      fields.push({
        id: "activityType",
        label: "Activity Type",
        ariaLabel: "Filter by activity type",
        value: activityTypeFilter,
        onChange: setActivityTypeFilter,
        options: [
          { id: "all", label: "All Activity Types" },
          ...uniqueActivityTypes,
        ],
      });
    }

    return fields;
  }, [
    activityTypeFilter,
    approvedCount,
    draftsCount,
    events.length,
    hasProposals,
    pendingCount,
    statusFilter,
    uniqueActivityTypes,
    uniqueVenues,
    venueFilter,
  ]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return events.filter((e) => {
      const typeLabel = e.activityType
        ? (ACTIVITY_TYPE_LABELS[e.activityType as ActivityType] ?? e.activityType)
        : "";
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.organizationName.toLowerCase().includes(q) ||
        e.organizationAcronym.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q) ||
        e.purpose.toLowerCase().includes(q) ||
        typeLabel.toLowerCase().includes(q) ||
        (e.semesterName ?? "").toLowerCase().includes(q);

      const matchVenue = venueFilter === "all" || e.venueId === venueFilter;
      const matchActivityType =
        activityTypeFilter === "all" || e.activityType === activityTypeFilter;

      let matchStatus = true;

      if (statusFilter === "approved") {
        matchStatus = e.status === "approved";
      } else if (statusFilter === "pending") {
        matchStatus = PENDING_REVIEW_STATUSES.has(e.status);
      } else if (statusFilter === "drafts") {
        matchStatus =
          e.status !== "approved" && !PENDING_REVIEW_STATUSES.has(e.status);
      }

      return matchSearch && matchVenue && matchActivityType && matchStatus;
    });
  }, [events, search, venueFilter, activityTypeFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search & Unified Filter Dropdown Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search events"
          className="w-full md:w-80"
          name="event-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by title, organization, or venue…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <CatalogFilterDropdown filters={filterFields} />
      </div>

      {/* Events & Proposals Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((ev) => {
            const isApproved = ev.status === "approved";
            const isFull = ev.capacity > 0 && ev.registeredCount >= ev.capacity;
            const deadlinePassed = new Date() > new Date(ev.registrationDeadline);
            const percentFilled =
              ev.capacity > 0
                ? Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100))
                : 0;

            return (
              <Card
                key={ev.id}
                className="relative group h-full justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
              >
                {/* WHY: Split Card.Header into an identity/status bar and a full-width title row so wide status chips like Open for Registration never squeeze multi-word titles to an ellipsis. */}
                <Card.Header className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {ev.organizationLogoUrl ? (
                        <Avatar className="w-9 h-9 rounded-xl bg-accent/10 text-accent shrink-0">
                          <Avatar.Image
                            alt={ev.organizationName}
                            className="object-cover"
                            src={ev.organizationLogoUrl}
                          />
                          <Avatar.Fallback className="bg-accent/10 text-accent text-xs font-bold rounded-xl">
                            {ev.organizationAcronym.slice(0, 4)}
                          </Avatar.Fallback>
                        </Avatar>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                          {ev.organizationAcronym.slice(0, 4)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate leading-tight">
                          {ev.organizationAcronym}
                        </span>
                        <span className="text-[11px] text-muted truncate leading-tight">
                          {ev.organizationName}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isApproved ? (
                        ev.isRegistered ? (
                          <Chip
                            className="bg-success/15 text-success border border-success/30 font-semibold"
                            size="sm"
                            variant="soft"
                          >
                            <CheckCircle2 className="mr-1 inline" size={12} />
                            Pass Confirmed
                          </Chip>
                        ) : isFull ? (
                          <Chip color="danger" size="sm" variant="soft">
                            Full Capacity
                          </Chip>
                        ) : deadlinePassed ? (
                          <Chip color="default" size="sm" variant="soft">
                            Registration Closed
                          </Chip>
                        ) : (
                          <Chip color="success" size="sm" variant="soft">
                            Open for Registration
                          </Chip>
                        )
                      ) : (
                        <ProposalStatusChip status={ev.status} />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-0.5">
                    <Card.Title className="text-base font-bold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                      {ev.title}
                    </Card.Title>
                    {ev.activityType || ev.semesterName ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {ev.activityType ? (
                          <Chip
                            className="text-[11px] font-medium"
                            color="accent"
                            size="sm"
                            variant="soft"
                          >
                            <Tag className="mr-1 inline" size={11} />
                            {ACTIVITY_TYPE_LABELS[ev.activityType as ActivityType] ??
                              ev.activityType}
                          </Chip>
                        ) : null}
                        {ev.semesterName ? (
                          <Chip
                            className="text-[11px] text-muted"
                            color="default"
                            size="sm"
                            variant="soft"
                          >
                            {ev.semesterName}
                          </Chip>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </Card.Header>

                <Card.Content className="flex flex-col gap-3 flex-1">
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {ev.purpose}
                  </p>

                  <div className="flex flex-col gap-2 rounded-xl bg-default/5 p-3 border border-border/30 text-xs text-muted mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="text-accent shrink-0" size={13} />
                      <span className="truncate font-medium text-foreground">
                        {ev.venueName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-accent shrink-0" size={13} />
                        <span>
                          {new Date(ev.startTime).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          ·{" "}
                          {new Date(ev.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] shrink-0">
                        <Clock className="text-warning shrink-0" size={12} />
                        <span>
                          {isApproved
                            ? `Closes ${new Date(ev.registrationDeadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                            : `${ev.capacity} spots`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isApproved ? (
                    <div className="flex flex-col gap-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>
                          {ev.registeredCount} / {ev.capacity} spots
                        </span>
                        <span className="font-semibold text-foreground">
                          {percentFilled}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-default/20 overflow-hidden">
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
                    </div>
                  ) : null}
                </Card.Content>

                {/* UI/UX FLOW: Use concise acronym attribution and lock CTA whitespace so View Details never wraps beside long organization names. */}
                <Card.Footer className="flex items-center justify-between gap-3 pt-2.5 border-t border-border/20">
                  <span className="text-xs text-muted truncate min-w-0">
                    {isApproved
                      ? `Hosted by ${ev.organizationAcronym}`
                      : `By ${ev.creatorName ?? ev.organizationAcronym}`}
                  </span>
                  <NextLink
                    className="ml-auto shrink-0 whitespace-nowrap inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                    href={`/events/${ev.id}`}
                  >
                    {isApproved ? "View Details" : "View Proposal"}{" "}
                    <ArrowRight size={13} />
                  </NextLink>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 text-center items-center gap-3">
          <EmptyState className="flex flex-col items-center text-center gap-2">
            <Calendar className="text-muted" size={32} />
            <span className="text-base font-semibold text-foreground">
              No Events Found
            </span>
            <p className="text-xs text-muted max-w-md">
              {events.length === 0
                ? "There are currently no scheduled campus events or visible proposals."
                : "No events matched your search or filter criteria."}
            </p>
            {canCreateProposal && events.length === 0 ? (
              <NextLink href="/events/new">
                <Button size="sm" variant="primary">
                  <Plus size={15} />
                  Draft First Proposal
                </Button>
              </NextLink>
            ) : null}
          </EmptyState>
        </Card>
      )}
    </div>
  );
}
