"use client";

import type { AttendanceEventItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Card,
  Chip,
  Button,
  Input,
} from "@heroui/react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  ChevronRight,
  Radio,
} from "lucide-react";

import { formatDate, formatTime } from "@/utils/formatters";

export type AttendanceEventPickerProps = {
  events: AttendanceEventItem[];
};

export function AttendanceEventPicker({ events }: AttendanceEventPickerProps) {
  const [query, setQuery] = React.useState("");

  const filteredEvents = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return events;

    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.organizationName.toLowerCase().includes(q) ||
        e.organizationAcronym.toLowerCase().includes(q) ||
        e.venueName.toLowerCase().includes(q)
    );
  }, [events, query]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-md relative">
          <Input
            aria-label="Search events"
            className="pl-9"
            placeholder="Search by event title, organization, or venue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
        </div>
        <p className="text-xs text-muted self-start sm:self-center">
          Showing {filteredEvents.length} of {events.length} eligible events
        </p>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="border border-divider bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/20 text-muted mb-4">
            <Radio size={24} />
          </div>
          <h3 className="text-base font-semibold text-foreground">No events found</h3>
          <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
            {query
              ? "No events match your search term. Try a different query."
              : "There are currently no approved campus events ready for attendance verification."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((evt) => {
            const turnoutPercent =
              evt.registeredCount > 0
                ? Math.round((evt.attendedCount / evt.registeredCount) * 100)
                : 0;

            return (
              <Card
                key={evt.id}
                className="flex flex-col justify-between border border-divider hover:border-primary/40 bg-card transition-all p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {evt.organizationAcronym}
                    </span>
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

                  <div>
                    <h3 className="font-semibold text-base text-foreground line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-1 mt-0.5">
                      {evt.organizationName}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="shrink-0 text-muted" size={13} />
                      <span>{formatDate(evt.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="shrink-0 text-muted" size={13} />
                      <span>
                        {formatTime(evt.startTime)} - {formatTime(evt.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="shrink-0 text-muted" size={13} />
                      <span className="truncate">{evt.venueName}</span>
                    </div>
                  </div>

                  <div className="mt-2 rounded-lg bg-default-100/50 p-2.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted flex items-center gap-1.5">
                        <Users size={13} />
                        Turnout
                      </span>
                      <span className="font-semibold text-foreground">
                        {evt.attendedCount} / {evt.registeredCount} ({turnoutPercent}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-default-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, turnoutPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-divider flex items-center justify-end">
                  <NextLink className="w-full" href={`/attendance/${evt.id}`}>
                    <Button
                      className="w-full font-medium"
                      size="sm"
                      variant={evt.isWindowOpen ? "primary" : "secondary"}
                    >
                      Open Desk
                      <ChevronRight size={14} />
                    </Button>
                  </NextLink>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
