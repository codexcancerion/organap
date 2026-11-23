"use client";

import type { EventListItem } from "../types";

import React from "react";
import NextLink from "next/link";
import { Button, Chip, Tabs } from "@heroui/react";
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  Plus,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";

import { EventCalendarView } from "./event_calendar_view";
import { EventCatalog } from "./event_catalog";

export function EventExplorerClient({
  events,
  canCreateProposal = false,
  initialView = "events",
}: {
  events: EventListItem[];
  canCreateProposal?: boolean;
  initialView?: "events" | "calendar";
}) {
  const [activeView, setActiveView] = React.useState<"events" | "calendar">(initialView);

  const approvedCount = React.useMemo(
    () => events.filter((e) => e.status === "approved").length,
    [events],
  );
  const proposalCount = events.length - approvedCount;

  const badgeText =
    proposalCount > 0
      ? `${approvedCount} Live · ${proposalCount} ${proposalCount === 1 ? "Proposal" : "Proposals"}`
      : `${events.length} ${events.length === 1 ? "Event" : "Events"}`;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <Tabs
              selectedKey={activeView}
              onSelectionChange={(key) => setActiveView(String(key) as "events" | "calendar")}
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Events view mode">
                  <Tabs.Tab className="text-xs" id="events">
                    <span className="inline-flex items-center gap-1.5">
                      <LayoutGrid size={14} />
                      Events
                    </span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab className="text-xs" id="calendar">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarIcon size={14} />
                      Calendar
                    </span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>

            {canCreateProposal ? (
              <NextLink href="/events/new">
                <Button size="md" variant="primary">
                  <Plus size={16} />
                  Draft Proposal
                </Button>
              </NextLink>
            ) : null}
          </div>
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {badgeText}
          </Chip>
        }
        description={
          proposalCount > 0 || canCreateProposal
            ? "Explore approved student organization events, campus workshops, and track active proposals."
            : "Explore approved student organization events, campus workshops, and public activities."
        }
        title="Campus Events & Proposals"
      />

      {activeView === "events" ? (
        <EventCatalog canCreateProposal={canCreateProposal} events={events} />
      ) : (
        <EventCalendarView events={events} />
      )}
    </div>
  );
}
