// Server-side data queries for Participation & Attendance Reports (FR-14).
import type { AttendanceReportSummary, EventReportDetail, ReportAttendeeRow } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type ReportProposalRow = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  capacity: number;
  status: string;
  organizations: { name: string; acronym: string } | null;
  venues: { name: string } | null;
  registrations: { id: string; status: string }[];
  attendances: { id: string }[];
};

type AttendeeQueryRow = {
  id: string;
  student_id: string;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; school_id: string | null; email: string | null } | null;
  attendances: { id: string; verified_at: string; verification_method: "manual" | "qr_scanner" }[];
};

/**
 * Fetch report summaries for all approved/completed events.
 */
export const getAttendanceReportsList = cache(async (
  _userId: string
): Promise<AttendanceReportSummary[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_proposals")
    .select(`
      id,
      title,
      start_time,
      end_time,
      capacity,
      status,
      organizations:organization_id (name, acronym),
      venues:venue_id (name),
      registrations:event_registrations (id, status),
      attendances:attendance_records (id)
    `)
    .in("status", ["approved", "cancelled"])
    .order("start_time", { ascending: false });

  if (error) {
    console.error("Failed to fetch reports list:", error.message);

    return [];
  }

  const now = new Date().getTime();
  const rows = (data ?? []) as unknown as ReportProposalRow[];

  return rows.map((row) => {
    const startMs = new Date(row.start_time).getTime();
    const endMs = new Date(row.end_time).getTime();

    let computedStatus: "completed" | "in_progress" | "upcoming" = "upcoming";

    if (now > endMs) {
      computedStatus = "completed";
    } else if (now >= startMs && now <= endMs) {
      computedStatus = "in_progress";
    }

    const activeRegs = (row.registrations ?? []).filter(
      (r) => r.status === "confirmed" || r.status === "attended"
    );
    const totalRegistered = activeRegs.length;
    const totalAttended = (row.attendances ?? []).length;
    const attendanceRate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;
    const capacityUtilization = row.capacity > 0 ? Math.round((totalRegistered / row.capacity) * 100) : 0;

    return {
      id: row.id,
      proposalId: row.id,
      eventTitle: row.title,
      organizationName: row.organizations?.name ?? "Campus Group",
      organizationAcronym: row.organizations?.acronym ?? "ORG",
      venueName: row.venues?.name ?? "Campus Venue",
      startTime: row.start_time,
      endTime: row.end_time,
      capacity: row.capacity,
      totalRegistered,
      totalAttended,
      attendanceRate,
      capacityUtilization,
      status: computedStatus,
    };
  });
});

/**
 * Fetch detailed attendee breakdown and statistics for a specific event report.
 */
export const getEventReportDetail = cache(async (
  eventId: string
): Promise<EventReportDetail | null> => {
  const supabase = await createClient();

  const [eventRes, regsRes] = await Promise.all([
    supabase
      .from("event_proposals")
      .select(`
        id,
        title,
        start_time,
        end_time,
        capacity,
        status,
        organizations:organization_id (name, acronym),
        venues:venue_id (name),
        attendances:attendance_records (id)
      `)
      .eq("id", eventId)
      .single(),
    supabase
      .from("event_registrations")
      .select(`
        id,
        student_id,
        status,
        created_at,
        profiles:student_id (
          full_name,
          school_id,
          email
        ),
        attendances:attendance_records (
          id,
          verified_at,
          verification_method
        )
      `)
      .eq("proposal_id", eventId)
      .neq("status", "withdrawn")
      .order("created_at", { ascending: true }),
  ]);

  if (eventRes.error || !eventRes.data) {
    console.error("Failed to fetch report detail:", eventRes.error?.message);

    return null;
  }

  const row = eventRes.data as unknown as ReportProposalRow;
  const regs = (regsRes.data ?? []) as unknown as AttendeeQueryRow[];

  const attendees: ReportAttendeeRow[] = regs.map((reg) => {
    const attRecord = reg.attendances && reg.attendances.length > 0 ? reg.attendances[0] : null;

    return {
      registrationId: reg.id,
      studentId: reg.student_id,
      fullName: reg.profiles?.full_name ?? "Student",
      schoolId: reg.profiles?.school_id ?? "",
      email: reg.profiles?.email ?? "",
      registeredAt: reg.created_at,
      attended: !!attRecord || reg.status === "attended",
      attendedAt: attRecord ? attRecord.verified_at : null,
      checkInMethod: attRecord ? attRecord.verification_method : null,
    };
  });

  const now = new Date().getTime();
  const startMs = new Date(row.start_time).getTime();
  const endMs = new Date(row.end_time).getTime();

  let computedStatus: "completed" | "in_progress" | "upcoming" = "upcoming";

  if (now > endMs) {
    computedStatus = "completed";
  } else if (now >= startMs && now <= endMs) {
    computedStatus = "in_progress";
  }

  const totalRegistered = attendees.length;
  const totalAttended = attendees.filter((a) => a.attended).length;
  const attendanceRate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;
  const capacityUtilization = row.capacity > 0 ? Math.round((totalRegistered / row.capacity) * 100) : 0;

  const summary: AttendanceReportSummary = {
    id: row.id,
    proposalId: row.id,
    eventTitle: row.title,
    organizationName: row.organizations?.name ?? "Campus Group",
    organizationAcronym: row.organizations?.acronym ?? "ORG",
    venueName: row.venues?.name ?? "Campus Venue",
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    totalRegistered,
    totalAttended,
    attendanceRate,
    capacityUtilization,
    status: computedStatus,
  };

  return { summary, attendees };
});
