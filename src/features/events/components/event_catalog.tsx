"use client";

import type { EventListItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Card,
  Chip,
  Input,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import {
  Calendar,
  MapPin,
  Search,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Filter,
} from "lucide-react";

export function EventCatalog({ events }: { events: EventListItem[] }) {
  const [search, setSearch] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("all");

  const uniqueVenues = React.useMemo(() => {
    const map = new Map<string, string>();

    events.forEach((e) => map.set(e.venueId, e.venueName));

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);

  const filtered = React.useMemo(() => {
    return events.filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.organizationName.toLowerCase().includes(search.toLowerCase()) ||
        e.venueName.toLowerCase().includes(search.toLowerCase()) ||
        e.purpose.toLowerCase().includes(search.toLowerCase());

      const matchVenue = venueFilter === "all" || e.venueId === venueFilter;

      return matchSearch && matchVenue;
    });
  }, [events, search, venueFilter]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <TextField
            aria-label="Search events"
            value={search}
            onChange={(val) => setSearch(val)}
          >
            <div className="relative w-full">
              <Input
                className="pl-9"
                placeholder="Search events by title, org, or venue…"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                size={15}
              />
            </div>
          </TextField>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Filter size={14} />
            <span>Venue:</span>
          </div>
          <Select
            aria-label="Filter by venue"
            className="w-52"
            value={venueFilter}
            onChange={(val) => setVenueFilter(String(val))}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All Campus Venues">
                  All Campus Venues
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {uniqueVenues.map((v) => (
                  <ListBox.Item key={v.id} id={v.id} textValue={v.name}>
                    {v.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {filtered.map((ev) => {
          const isFull = ev.registeredCount >= ev.capacity;
          const deadlinePassed = new Date() > new Date(ev.registrationDeadline);
          const percentFilled = Math.min(100, Math.round((ev.registeredCount / ev.capacity) * 100));

          return (
            <NextLink key={ev.id} className="block group h-full" href={`/events/${ev.id}`}>
              <Card className="border border-border/30 hover:border-accent/40 transition-colors bg-surface p-5 gap-3 h-full flex flex-col justify-between cursor-pointer">
                <Card.Header className="flex flex-col gap-1.5 p-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-accent flex items-center gap-1">
                      <Building2 size={13} />
                      {ev.organizationAcronym}
                    </span>
                    {ev.isRegistered ? (
                      <Chip className="bg-success/15 text-success border border-success/30 font-semibold" size="sm" variant="soft">
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
                    )}
                  </div>

                  <h3 className="font-bold text-base text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-muted line-clamp-2">
                    {ev.purpose}
                  </p>
                </Card.Header>

                <Card.Content className="p-0 flex-initial pt-2 border-t border-border/20 flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1.5 text-xs text-muted">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="text-primary shrink-0" size={13} />
                      <span className="truncate font-medium text-foreground">{ev.venueName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="text-primary shrink-0" size={13} />
                      <span>{new Date(ev.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {new Date(ev.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="text-warning shrink-0" size={13} />
                      <span>Closes {new Date(ev.registrationDeadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>

                  {/* Quota Progress Bar */}
                  <div className="flex flex-col gap-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span>{ev.registeredCount} / {ev.capacity} spots</span>
                      <span className="font-semibold text-foreground">{percentFilled}%</span>
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
                </Card.Content>

                <Card.Footer className="p-0 pt-2 flex items-center justify-between text-xs text-muted border-t border-border/20">
                  <span>{ev.organizationName}</span>
                  <span className="flex items-center gap-1 text-accent font-semibold group-hover:translate-x-0.5 transition-transform">
                    Details <ArrowRight size={13} />
                  </span>
                </Card.Footer>
              </Card>
            </NextLink>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border border-dashed border-border/60 bg-surface p-12 text-center flex flex-col items-center gap-2">
          <Calendar className="text-muted size-10" />
          <h3 className="text-base font-semibold text-foreground">No Approved Events Found</h3>
          <p className="text-xs text-muted max-w-sm">
            There are currently no scheduled events matching your criteria. Check back soon for new campus activities!
          </p>
        </Card>
      )}
    </div>
  );
}
