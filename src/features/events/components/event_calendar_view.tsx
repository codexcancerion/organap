"use client";

import type { EventListItem } from "../types";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Chip } from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function EventCalendarView({ events }: { events: EventListItem[] }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const calendarDays = React.useMemo(() => {
    const yr = currentDate.getFullYear();
    const mth = currentDate.getMonth();
    const count = new Date(yr, mth + 1, 0).getDate();
    const days: { dayNumber: number; dateString: string; events: EventListItem[] }[] = [];

    for (let i = 1; i <= count; i++) {
      const dateStr = `${yr}-${String(mth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => {
        const eDate = new Date(e.startTime);

        return (
          eDate.getFullYear() === yr &&
          eDate.getMonth() === mth &&
          eDate.getDate() === i
        );
      });

      days.push({ dayNumber: i, dateString: dateStr, events: dayEvents });
    }

    return days;
  }, [events, currentDate]);

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface border border-border/30">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">
            {monthName} {year}
          </h2>
          <Chip size="sm" variant="soft">
            {events.length} Scheduled
          </Chip>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onPress={today}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button
              aria-label="Previous Month"
              size="sm"
              variant="ghost"
              onPress={prevMonth}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              aria-label="Next Month"
              size="sm"
              variant="ghost"
              onPress={nextMonth}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="border border-border/30 bg-surface p-3 overflow-hidden">
        {/* Weekday Row */}
        <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-muted pb-2 border-b border-border/20">
          {weekDayLabels.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-2">
          {/* Empty offset cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-24 p-1.5 rounded-xl bg-default/5 border border-transparent"
            />
          ))}

          {/* Actual days */}
          {calendarDays.map((item) => {
            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === item.dayNumber;

            return (
              <div
                key={item.dateString}
                className={`min-h-24 p-1.5 rounded-xl border flex flex-col gap-1 transition-colors ${
                  isToday
                    ? "border-accent bg-accent/5"
                    : "border-border/20 bg-surface hover:border-border/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold size-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-accent text-accent-foreground font-bold"
                        : "text-foreground"
                    }`}
                  >
                    {item.dayNumber}
                  </span>
                  {item.events.length > 0 && (
                    <span className="text-[10px] text-muted">
                      {item.events.length}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar max-h-24">
                  {item.events.map((ev) => (
                    <NextLink
                      key={ev.id}
                      className="block p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[11px] font-medium truncate transition-colors"
                      href={`/events/${ev.id}`}
                    >
                      <span className="truncate">{ev.title}</span>
                    </NextLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
