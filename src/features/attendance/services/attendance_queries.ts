// Server-side data queries for Event Attendance Management (FR-13, FR-17).
import type { AttendanceEventItem, AttendanceRosterItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type AttendanceEventQueryRow = {
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

type AttendanceRegQueryRow = {
  id: string;
  student_id: string;
  status: "confirmed" | "attended";
  qr_token: string;
  student: { full_name: string | null; school_id: string | null } | null;
  attendance: { check_in_at: string; check_in_method: "manual" | "qr_scanner" }[] | { check_in_at: string; check_in_method: "manual" | "qr_scanner" } | null;
};

/**
 * Fetch approved events that the user is authorized to manage attendance for.
 */
export const getAttendanceEligibleEvents = cache(async (
  _userId: string
): Promise<AttendanceEventItem[]> => {
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
    .eq("status", "approved")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to fetch attendance eligible events:", error.message);

    return [];
  }

  const now = new Date().getTime();
  const rows = (data ?? []) as unknown as AttendanceEventQueryRow[];

  return rows.map((row) => {
    const startMs = new Date(row.start_time).getTime();
    const endMs = new Date(row.end_time).getTime();
    // WHY: Advance 30-minute buffer accommodates physical entrance queuing and ticket verification
    // prior to opening keynote while preventing attendance records from being created days in advance.
    const openMs = startMs - 30 * 60 * 1000;

    const activeRegs = (row.registrations ?? []).filter(
      (r) => r.status === "confirmed" || r.status === "attended"
    );
    const attendedCount = (row.attendances ?? []).length;

    return {
      id: row.id,
      title: row.title,
      organizationName: row.organizations?.name ?? "Campus Group",
      organizationAcronym: row.organizations?.acronym ?? "ORG",
      venueName: row.venues?.name ?? "Campus Venue",
      startTime: row.start_time,
      endTime: row.end_time,
      capacity: row.capacity,
      registeredCount: activeRegs.length,
      attendedCount,
      isWindowOpen: now >= openMs && now <= endMs,
      isWindowClosed: now > endMs,
    };
  });
});

/**
 * Fetch complete attendance roster and event details for check-in console.
 */
export const getEventAttendanceRoster = cache(async (
  eventId: string
): Promise<{
  event: AttendanceEventItem | null;
  roster: AttendanceRosterItem[];
}> => {
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
        qr_token,
        status,
        created_at,
        student:student_id (id, full_name, school_id),
        attendance:attendance_records (id, check_in_at, check_in_method)
      `)
      .eq("proposal_id", eventId)
      .in("status", ["confirmed", "attended"])
      .order("created_at", { ascending: true }),
  ]);

  if (eventRes.error || !eventRes.data) {
    return { event: null, roster: [] };
  }

  const row = eventRes.data as unknown as AttendanceEventQueryRow;
  const now = new Date().getTime();
  const startMs = new Date(row.start_time).getTime();
  const endMs = new Date(row.end_time).getTime();
  const openMs = startMs - 30 * 60 * 1000;

  const rosterRows = (regsRes.data ?? []) as unknown as AttendanceRegQueryRow[];

  const roster: AttendanceRosterItem[] = rosterRows.map((r) => {
    const att = Array.isArray(r.attendance) ? r.attendance[0] : r.attendance;

    return {
      registrationId: r.id,
      studentId: r.student_id,
      schoolId: r.student?.school_id ?? "N/A",
      fullName: r.student?.full_name ?? "Student Attendee",
      qrToken: r.qr_token,
      status: r.status,
      checkInAt: att?.check_in_at ?? null,
      checkInMethod: att?.check_in_method ?? null,
    };
  });

  const event: AttendanceEventItem = {
    id: row.id,
    title: row.title,
    organizationName: row.organizations?.name ?? "Campus Group",
    organizationAcronym: row.organizations?.acronym ?? "ORG",
    venueName: row.venues?.name ?? "Campus Venue",
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    registeredCount: roster.length,
    attendedCount: roster.filter((r) => r.status === "attended").length,
    isWindowOpen: now >= openMs && now <= endMs,
    isWindowClosed: now > endMs,
  };

  return { event, roster };
});
