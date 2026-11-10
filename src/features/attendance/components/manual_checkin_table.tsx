"use client";

import type { AttendanceRosterItem } from "../types";

import React from "react";
import {
  Button,
  Card,
  Chip,
  Input,
  Table,
  TextField,
  toast,
} from "@heroui/react";
import { Search, CheckCircle2, Clock, UserCheck } from "lucide-react";

import { recordCheckIn } from "../services/attendance_services";

export type ManualCheckinTableProps = {
  eventId: string;
  roster: AttendanceRosterItem[];
  isWindowOpen: boolean;
  onRefresh: () => void;
};

export function ManualCheckinTable({
  eventId,
  roster,
  isWindowOpen,
  onRefresh,
}: ManualCheckinTableProps) {
  const [search, setSearch] = React.useState("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    return roster.filter((item) => {
      return (
        item.fullName.toLowerCase().includes(search.toLowerCase()) ||
        item.schoolId.toLowerCase().includes(search.toLowerCase()) ||
        item.qrToken.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [roster, search]);

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
      {/* Search Input */}
      <div className="w-full sm:w-80">
        <TextField
          aria-label="Search attendee roster"
          value={search}
          onChange={(val) => setSearch(val)}
        >
          <div className="relative w-full">
            <Input
              className="pl-9"
              placeholder="Search by student name or School ID…"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              size={15}
            />
          </div>
        </TextField>
      </div>

      {/* Roster Table */}
      <Card className="border border-border/30 overflow-hidden bg-surface shadow-xs">
        <Table className="w-full">
          <Table.ScrollContainer>
            <Table.Content aria-label="Event Attendee Roster Table">
              <Table.Header>
                <Table.Column isRowHeader className="py-3 px-4 text-xs font-semibold text-muted">Student Attendee</Table.Column>
                <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">Passcode</Table.Column>
                <Table.Column className="py-3 px-4 text-xs font-semibold text-muted">Attendance Status</Table.Column>
                <Table.Column className="py-3 px-4 text-xs font-semibold text-muted text-right">Verification Action</Table.Column>
              </Table.Header>
              <Table.Body>
                {filtered.map((item) => {
                  const isAttended = item.status === "attended";

                  return (
                    <Table.Row key={item.registrationId} className="border-b border-border/20 last:border-0 hover:bg-default/5 transition-colors">
                      <Table.Cell className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-foreground">{item.fullName}</span>
                          <span className="text-xs text-muted font-mono">ID: {item.schoolId}</span>
                        </div>
                      </Table.Cell>

                      <Table.Cell className="py-3 px-4">
                        <span className="font-mono text-xs text-muted">
                          #{item.qrToken.slice(0, 8)}
                        </span>
                      </Table.Cell>

                      <Table.Cell className="py-3 px-4">
                        {isAttended ? (
                          <Chip className="bg-success/15 text-success border border-success/30 font-semibold" size="sm" variant="soft">
                            <CheckCircle2 className="mr-1 inline" size={12} />
                            Present ({new Date(item.checkInAt ?? "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                          </Chip>
                        ) : (
                          <Chip color="default" size="sm" variant="soft">
                            <Clock className="mr-1 inline" size={12} />
                            Registered
                          </Chip>
                        )}
                      </Table.Cell>

                      <Table.Cell className="py-3 px-4 text-right">
                        {isAttended ? (
                          <span className="text-xs font-medium text-success flex items-center justify-end gap-1">
                            <CheckCircle2 size={14} />
                            Verified
                          </span>
                        ) : (
                          <Button
                            isDisabled={pendingId === item.studentId || !isWindowOpen}
                            size="sm"
                            variant="primary"
                            onClick={() => handleCheckIn(item.studentId, item.fullName)}
                          >
                            <UserCheck size={14} />
                            {pendingId === item.studentId ? "Saving..." : "Check In"}
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

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted">
            No registered attendees found matching your query.
          </div>
        )}
      </Card>
    </div>
  );
}
