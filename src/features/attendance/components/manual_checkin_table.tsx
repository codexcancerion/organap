"use client";

import type { AttendanceRosterItem } from "../types";

import React from "react";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  SearchField,
  Spinner,
  Table,
  toast,
} from "@heroui/react";
import { CheckCircle2, Clock, UserCheck, Users } from "lucide-react";

import { CatalogFilterDropdown } from "@/components/ui/catalog_filter_dropdown";

import { recordCheckIn } from "../services/attendance_services";

export type ManualCheckinTableProps = {
  eventId: string;
  roster: AttendanceRosterItem[];
  isWindowOpen: boolean;
  onRefresh: () => void;
};

type RosterTab = "all" | "pending" | "attended";

export function ManualCheckinTable({
  eventId,
  roster,
  isWindowOpen,
  onRefresh,
}: ManualCheckinTableProps) {
  const [search, setSearch] = React.useState("");
  const [statusTab, setStatusTab] = React.useState<RosterTab>("all");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const { pendingCount, attendedCount } = React.useMemo(() => {
    let pending = 0;
    let attended = 0;

    for (const item of roster) {
      if (item.status === "attended") attended += 1;
      else pending += 1;
    }

    return { pendingCount: pending, attendedCount: attended };
  }, [roster]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return roster.filter((item) => {
      const matchesQuery =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.schoolId.toLowerCase().includes(q) ||
        (item.email ?? "").toLowerCase().includes(q) ||
        item.qrToken.toLowerCase().includes(q);

      if (!matchesQuery) return false;

      if (statusTab === "pending") return item.status !== "attended";
      if (statusTab === "attended") return item.status === "attended";

      return true;
    });
  }, [roster, search, statusTab]);

  const handleCheckIn = async (studentId: string, studentName: string) => {
    setPendingId(studentId);
    try {
      const res = await recordCheckIn(eventId, studentId, "manual");

      if (!res.success) {
        toast.danger(res.error?.message ?? "Check-in failed");

        return;
      }

      toast.success(`Marked Present: ${studentName} (${res.data.schoolId})`);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search & Status Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search attendee roster"
          className="w-full md:w-80"
          name="roster-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by name, School ID, or passcode…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <CatalogFilterDropdown
          filters={[
            {
              id: "status",
              label: "Attendance Status",
              ariaLabel: "Filter attendee roster",
              value: statusTab,
              onChange: (val) => setStatusTab(val as RosterTab),
              options: [
                { id: "all", label: `All Registrants (${roster.length})` },
                { id: "pending", label: `Pending (${pendingCount})` },
                { id: "attended", label: `Checked In (${attendedCount})` },
              ],
            },
          ]}
        />
      </div>

      {/* Roster Table */}
      <Card className="border border-border/30 overflow-hidden bg-surface shadow-xs p-0">
        {filtered.length > 0 ? (
          <Table className="w-full">
            <Table.ScrollContainer>
              <Table.Content aria-label="Event Attendee Roster Table">
                <Table.Header>
                  <Table.Column
                    isRowHeader
                    className="py-3 px-4 text-xs font-semibold text-muted"
                  >
                    Student Attendee
                  </Table.Column>
                  <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">
                    Passcode
                  </Table.Column>
                  <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">
                    Attendance Status
                  </Table.Column>
                  <Table.Column className="py-3 px-4 text-xs font-semibold text-muted text-right">
                    Verification Action
                  </Table.Column>
                </Table.Header>
                <Table.Body>
                  {filtered.map((item) => {
                    const isAttended = item.status === "attended";
                    const isSaving = pendingId === item.studentId;

                    return (
                      <Table.Row
                        key={item.registrationId}
                        className="border-b border-border/20 last:border-0 hover:bg-default/5 transition-colors"
                      >
                        <Table.Cell className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground">
                              {item.fullName}
                            </span>
                            <span className="text-xs text-muted font-mono">
                              ID: {item.schoolId}
                              {item.email ? ` · ${item.email}` : ""}
                            </span>
                          </div>
                        </Table.Cell>

                        <Table.Cell className="py-3 px-4">
                          <span className="font-mono text-xs text-muted">
                            #{item.qrToken.slice(0, 8).toUpperCase()}
                          </span>
                        </Table.Cell>

                        <Table.Cell className="py-3 px-4">
                          {isAttended ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Chip color="success" size="sm" variant="soft">
                                <CheckCircle2 className="mr-1 inline" size={12} />
                                Present (
                                {item.checkInAt
                                  ? new Date(item.checkInAt).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" }
                                    )
                                  : "Verified"}
                                )
                              </Chip>
                              <Chip color="default" size="sm" variant="soft">
                                {item.checkInMethod === "qr_scanner"
                                  ? "QR Scan"
                                  : "Manual"}
                              </Chip>
                            </div>
                          ) : (
                            <Chip color="default" size="sm" variant="soft">
                              <Clock className="mr-1 inline" size={12} />
                              Registered
                            </Chip>
                          )}
                        </Table.Cell>

                        <Table.Cell className="py-3 px-4 text-right">
                          {isAttended ? (
                            <span className="text-xs font-medium text-success inline-flex items-center justify-end gap-1">
                              <CheckCircle2 size={14} />
                              Verified
                            </span>
                          ) : (
                            <Button
                              isDisabled={isSaving || !isWindowOpen}
                              isPending={isSaving}
                              size="sm"
                              variant="primary"
                              onPress={() =>
                                handleCheckIn(item.studentId, item.fullName)
                              }
                            >
                              {isSaving ? (
                                <Spinner color="current" size="sm" />
                              ) : (
                                <UserCheck size={14} />
                              )}
                              {isSaving ? "Saving..." : "Check In"}
                            </Button>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        ) : (
          <EmptyState className="flex flex-col items-center text-center gap-2 p-10">
            <Users className="text-muted size-8" />
            <p className="text-sm font-semibold text-foreground">
              {roster.length === 0
                ? "No Registered Students Yet"
                : "No Matching Attendees"}
            </p>
            <p className="text-xs text-muted max-w-sm">
              {roster.length === 0
                ? "Registered participants will appear here automatically once students claim an event pass."
                : "Try adjusting your search query or status filter tab."}
            </p>
          </EmptyState>
        )}
      </Card>
    </div>
  );
}
