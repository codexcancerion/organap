"use client";

import type { EventListItem } from "../types";

import React from "react";
import { Button } from "@heroui/react";
import { LayoutGrid, Calendar as CalendarIcon } from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";

import { EventCatalog } from "./event_catalog";
import { EventCalendarView } from "./event_calendar_view";

export function EventExplorerClient({
  events,
  initialView = "catalog",
}: {
  events: EventListItem[];
  initialView?: "catalog" | "calendar";
}) {
  const [activeView, setActiveView] = React.useState<"catalog" | "calendar">(initialView);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-border/30">
            <Button
              className={activeView === "catalog" ? "shadow-xs" : ""}
              size="sm"
              variant={activeView === "catalog" ? "primary" : "ghost"}
              onClick={() => setActiveView("catalog")}
            >
              <LayoutGrid size={15} />
              Catalog
            </Button>
            <Button
              className={activeView === "calendar" ? "shadow-xs" : ""}
              size="sm"
              variant={activeView === "calendar" ? "primary" : "ghost"}
              onClick={() => setActiveView("calendar")}
            >
              <CalendarIcon size={15} />
              Calendar
            </Button>
          </div>
        }
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            {events.length} Events Live
          </span>
        }
        description="Explore approved student organization events, campus workshops, and public activities."
        title="Approved Campus Events"
      />

      {activeView === "catalog" ? (
        <EventCatalog events={events} />
      ) : (
        <EventCalendarView events={events} />
      )}
    </div>
  );
}
