"use client";

import type { AttendanceReportSummary } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Card,
  Chip,
  Button,
  Input,
} from "@heroui/react";
import {
  Search,
  FileSpreadsheet,
  Calendar,
  Building,
  ArrowUpRight,
} from "lucide-react";

import { formatDate } from "@/utils/formatters";

export type ReportsListProps = {
  reports: AttendanceReportSummary[];
};

export function ReportsList({ reports }: ReportsListProps) {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredReports = React.useMemo(() => {
    return reports.filter((rep) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        rep.eventTitle.toLowerCase().includes(q) ||
        rep.organizationName.toLowerCase().includes(q) ||
        rep.organizationAcronym.toLowerCase().includes(q) ||
        rep.venueName.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || rep.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [reports, query, statusFilter]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:max-w-md relative">
          <Input
            aria-label="Search reports"
            className="pl-9"
            placeholder="Search reports by title, organization, or venue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" size={16} />
        </div>
        <div className="flex items-center gap-2">
          {["all", "completed", "in_progress", "upcoming"].map((s) => (
            <Button
              key={s}
              className="capitalize"
              size="sm"
              variant={statusFilter === s ? "primary" : "ghost"}
              onPress={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card className="border border-divider bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/20 text-muted mb-4">
            <FileSpreadsheet size={24} />
          </div>
          <h3 className="text-base font-semibold text-foreground">No reports found</h3>
          <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
            {query || statusFilter !== "all"
              ? "No participation reports match your filters. Try adjusting your search criteria."
              : "No campus event reports have been recorded yet."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((rep) => {
            return (
              <Card
                key={rep.id}
                className="flex flex-col justify-between border border-divider hover:border-primary/40 bg-card transition-all p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {rep.organizationAcronym}
                    </span>
                    <Chip
                      color={
                        rep.status === "completed"
                          ? "default"
                          : rep.status === "in_progress"
                          ? "success"
                          : "accent"
                      }
                      size="sm"
                      variant="soft"
                    >
                      {rep.status === "completed"
                        ? "Completed"
                        : rep.status === "in_progress"
                        ? "In Progress"
                        : "Upcoming"}
                    </Chip>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-foreground line-clamp-1">
                      {rep.eventTitle}
                    </h3>
                    <p className="text-xs text-muted line-clamp-1 mt-0.5">
                      {rep.organizationName}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="shrink-0 text-muted" size={13} />
                      <span>{formatDate(rep.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="shrink-0 text-muted" size={13} />
                      <span className="truncate">{rep.venueName}</span>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-divider text-xs">
                    <div className="p-2 rounded bg-default-100/50">
                      <span className="text-muted block text-[11px]">Turnout Rate</span>
                      <span className="text-sm font-bold text-foreground">
                        {rep.attendanceRate}%
                      </span>
                      <span className="text-[10px] text-muted block">
                        {rep.totalAttended} / {rep.totalRegistered} attended
                      </span>
                    </div>
                    <div className="p-2 rounded bg-default-100/50">
                      <span className="text-muted block text-[11px]">Capacity Used</span>
                      <span className="text-sm font-bold text-foreground">
                        {rep.capacityUtilization}%
                      </span>
                      <span className="text-[10px] text-muted block">
                        {rep.totalRegistered} / {rep.capacity} seats
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-divider flex items-center justify-end">
                  <NextLink className="w-full" href={`/reports/${rep.id}`}>
                    <Button
                      className="w-full font-medium"
                      size="sm"
                      variant="secondary"
                    >
                      View Audit Report
                      <ArrowUpRight size={14} />
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
