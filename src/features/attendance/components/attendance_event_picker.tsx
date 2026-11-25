"use client";

import type { CatalogFilterField } from "@/components/ui/catalog_filter_dropdown";
import type { AttendanceEventItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  SearchField,
} from "@heroui/react";
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Radio,
  Users,
} from "lucide-react";

import { CatalogFilterDropdown } from "@/components/ui/catalog_filter_dropdown";
import { formatDate, formatTime } from "@/utils/formatters";

export type AttendanceEventPickerProps = {
  events: AttendanceEventItem[];
};

type WindowTab = "all" | "live" | "upcoming" | "closed";

export function AttendanceEventPicker({ events }: AttendanceEventPickerProps) {
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<WindowTab>("all");
  const [orgFilter, setOrgFilter] = React.useState("all");

  const { liveCount, upcomingCount, closedCount, uniqueOrgs } = React.useMemo(() => {
    let live = 0;
    let upcoming = 0;
    let closed = 0;
    const orgMap = new Map<string, string>();

    for (const evt of events) {
      if (evt.isWindowOpen) live += 1;
      else if (evt.isWindowClosed) closed += 1;
      else upcoming += 1;

      orgMap.set(evt.organizationAcronym, evt.organizationName);
    }

    return {
      liveCount: live,
      upcomingCount: upcoming,
      closedCount: closed,
      uniqueOrgs: Array.from(orgMap.entries()).map(([acronym, name]) => ({
        id: acronym,
        label: `${acronym} - ${name}`,
      })),
    };
  }, [events]);

  const filterFields = React.useMemo<CatalogFilterField[]>(() => {
    const fields: CatalogFilterField[] = [
      {
        id: "window",
        label: "Check-In Window",
        ariaLabel: "Filter attendance events by window status",
        value: tab,
        onChange: (val) => setTab(val as WindowTab),
        options: [
          { id: "all", label: `All Windows (${events.length})` },
          { id: "live", label: `Live Now (${liveCount})` },
          { id: "upcoming", label: `Upcoming (${upcomingCount})` },
          { id: "closed", label: `Closed (${closedCount})` },
        ],
      },
    ];

    if (uniqueOrgs.length > 1) {
      fields.push({
        id: "organization",
        label: "Organization",
        ariaLabel: "Filter attendance events by organization",
        value: orgFilter,
        onChange: setOrgFilter,
        options: [{ id: "all", label: "All Organizations" }, ...uniqueOrgs],
      });
    }

    return fields;
  }, [closedCount, events.length, liveCount, orgFilter, tab, uniqueOrgs, upcomingCount]);

  const filteredEvents = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return events.filter((e) => {
      const matchesQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.organizationName.toLowerCase().includes(q) ||
        e.organizationAcronym.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (orgFilter !== "all" && e.organizationAcronym !== orgFilter) return false;

      if (tab === "live") return e.isWindowOpen;
      if (tab === "upcoming") return !e.isWindowOpen && !e.isWindowClosed;
      if (tab === "closed") return e.isWindowClosed;

      return true;
    });
  }, [events, query, tab, orgFilter]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search attendance events"
          className="w-full md:w-80"
          name="attendance-event-search"
          value={query}
          onChange={setQuery}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by event title, org, or venue…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <CatalogFilterDropdown filters={filterFields} />
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="border border-dashed border-border/60 bg-surface p-10 text-center items-center">
          <EmptyState className="flex flex-col items-center text-center gap-2">
            <Radio className="text-muted size-10" />
            <h3 className="text-base font-semibold text-foreground">
              No Events Found
            </h3>
            <p className="text-xs text-muted max-w-sm">
              {query || tab !== "all" || orgFilter !== "all"
                ? "No authorized events matched your search or check-in window filter."
                : "There are currently no approved campus events within your organization scope ready for attendance verification."}
            </p>
          </EmptyState>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filteredEvents.map((evt) => {
            const turnoutPercent =
              evt.registeredCount > 0
                ? Math.min(
                    100,
                    Math.round((evt.attendedCount / evt.registeredCount) * 100)
                  )
                : 0;

            return (
              <Card
                key={evt.id}
                className="h-full justify-between gap-3 border border-border/30 hover:border-accent/40 bg-surface p-5 transition-colors"
              >
                <Card.Header className="flex flex-col gap-2.5 p-0">
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {evt.organizationLogoUrl ? (
                        <Avatar className="w-8 h-8 rounded-xl bg-accent/10 text-accent shrink-0">
                          <Avatar.Image
                            alt={evt.organizationName}
                            className="object-cover"
                            src={evt.organizationLogoUrl}
                          />
                          <Avatar.Fallback className="bg-accent/10 text-accent text-xs font-bold rounded-xl">
                            {evt.organizationAcronym.slice(0, 4)}
                          </Avatar.Fallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                          {evt.organizationAcronym.slice(0, 4)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">
                          {evt.organizationAcronym}
                        </span>
                        <span className="text-[11px] text-muted truncate">
                          {evt.organizationName}
                        </span>
                      </div>
                    </div>

                    {evt.isWindowOpen ? (
                      <Chip color="success" size="sm" variant="soft">
                        <span className="flex items-center gap-1 font-medium">
                          <Radio className="animate-pulse" size={12} /> Live Now
                        </span>
                      </Chip>
                    ) : evt.isWindowClosed ? (
                      <Chip color="default" size="sm" variant="soft">
                        Closed
                      </Chip>
                    ) : (
                      <Chip color="accent" size="sm" variant="soft">
                        Scheduled
                      </Chip>
                    )}
                  </div>

                  <Card.Title className="font-bold text-base text-foreground line-clamp-2 leading-snug">
                    {evt.title}
                  </Card.Title>
                </Card.Header>

                <Card.Content className="p-0 flex flex-col gap-3 flex-1">
                  <div className="space-y-1.5 text-xs text-muted pt-2 border-t border-border/20">
                    <div className="flex items-center gap-2">
                      <Calendar className="shrink-0 text-accent" size={13} />
                      <span>{formatDate(evt.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="shrink-0 text-accent" size={13} />
                      <span>
                        {formatTime(evt.startTime)} – {formatTime(evt.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="shrink-0 text-accent" size={13} />
                      <span className="truncate">{evt.venueName}</span>
                    </div>
                  </div>

                  <div className="mt-auto rounded-xl bg-default/10 border border-border/20 p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted flex items-center gap-1.5">
                        <Users size={13} />
                        Turnout
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {evt.attendedCount} / {evt.registeredCount} ({turnoutPercent}%)
                      </span>
                    </div>
                    <ProgressBar
                      aria-label="Event attendance turnout"
                      color={
                        evt.isWindowOpen
                          ? "success"
                          : turnoutPercent > 0
                            ? "accent"
                            : "default"
                      }
                      size="sm"
                      value={turnoutPercent}
                    >
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                </Card.Content>

                <Card.Footer className="p-0 pt-3 border-t border-border/20 flex items-center justify-end">
                  <NextLink className="w-full" href={`/attendance/${evt.id}`}>
                    <Button
                      className="w-full font-medium"
                      size="sm"
                      variant={evt.isWindowOpen ? "primary" : "secondary"}
                    >
                      Open Check-In Desk
                      <ChevronRight size={14} />
                    </Button>
                  </NextLink>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
