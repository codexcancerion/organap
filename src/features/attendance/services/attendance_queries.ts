// Server-side data queries for Event Attendance Management (FR-13, FR-17).
import type { AttendanceEventItem, AttendanceRosterItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

export type AttendanceViewer = {
  id: string;
  isStaff: boolean;
  isSuperuser: boolean;
};

type AttendanceEventQueryRow = {
  id: string;
  title: string;
  organization_id: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  capacity: number;
  status: string;
  organizations: { name: string; acronym: string; logo_url: string | null } | null;
  venues: { name: string } | null;
  registrations: { id: string; status: string }[];
  attendances: { id: string }[];
};

type AttendanceRegQueryRow = {
  id: string;
  student_id: string;
  status: "confirmed" | "attended";
  qr_token: string;
  created_at: string;
  student: { full_name: string | null; school_id: string | null; email: string | null } | null;
  attendance: { check_in_at: string; check_in_method: "manual" | "qr_scanner" }[] | { check_in_at: string; check_in_method: "manual" | "qr_scanner" } | null;
};

// WHY: Resolve the officer's assigned organizations explicitly instead of relying on global
// attendance.verify permission so officers cannot open or verify another organization's event desk.
async function getOfficerOrganizationIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string[]> {
  const [membershipsRes, governedRes] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("is_officer", true),
    supabase
      .from("organizations")
      .select("id")
      .eq("governor_id", userId),
  ]);

  const ids = new Set<string>();

  for (const row of membershipsRes.data ?? []) {
    if (row.organization_id) ids.add(row.organization_id);
  }
  for (const row of governedRes.data ?? []) {
    if (row.id) ids.add(row.id);
  }

  return Array.from(ids);
}

/**
 * Fetch approved events that the user is authorized to manage attendance for.
 */
export const getAttendanceEligibleEvents = cache(async (
  viewer: AttendanceViewer
): Promise<AttendanceEventItem[]> => {
  const supabase = await createClient();

  let officerOrgIds: string[] | null = null;

  if (!viewer.isStaff && !viewer.isSuperuser) {
    officerOrgIds = await getOfficerOrganizationIds(supabase, viewer.id);

    if (officerOrgIds.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("event_proposals")
    .select(`
      id,
      title,
      organization_id,
      start_time,
      end_time,
      registration_deadline,
      capacity,
      status,
      organizations:organization_id (name, acronym, logo_url),
      venues:venue_id (name),
      registrations:event_registrations (id, status),
      attendances:attendance_records (id)
    `)
    .eq("status", "approved")
    .order("start_time", { ascending: true });

  if (officerOrgIds) {
    query = query.in("organization_id", officerOrgIds);
  }

  const { data, error } = await query;

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
      organizationId: row.organization_id,
      organizationName: row.organizations?.name ?? "Campus Group",
      organizationAcronym: row.organizations?.acronym ?? "ORG",
      organizationLogoUrl: row.organizations?.logo_url ?? null,
      status: row.status,
      registrationDeadline: row.registration_deadline,
      venueName: row.venues?.name ?? "Campus Venue",
      startTime: row.start_time,
      endTime: row.end_time,
      capacity: row.capacity,
      registeredCount: activeRegs.length,
      attendedCount,
      isWindowOpen: row.status === "approved" && now >= openMs && now <= endMs,
      isWindowClosed: now > endMs,
    };
  });
});

/**
 * Fetch complete attendance roster and event details for check-in console.
 */
export const getEventAttendanceRoster = cache(async (
  eventId: string,
  viewer?: AttendanceViewer
): Promise<{
  event: AttendanceEventItem | null;
  roster: AttendanceRosterItem[];
  canVerify: boolean;
}> => {
  const supabase = await createClient();

  const [eventRes, regsRes] = await Promise.all([
    supabase
      .from("event_proposals")
      .select(`
        id,
        title,
        organization_id,
        start_time,
        end_time,
        registration_deadline,
        capacity,
        status,
        organizations:organization_id (name, acronym, logo_url),
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
      student:student_id (id, full_name, school_id, email),
      attendance:attendance_records (id, check_in_at, check_in_method)
      `)
      .eq("proposal_id", eventId)
      .in("status", ["confirmed", "attended"])
      .order("created_at", { ascending: true }),
  ]);

  if (eventRes.error || !eventRes.data) {
    return { event: null, roster: [], canVerify: false };
  }

  const row = eventRes.data as unknown as AttendanceEventQueryRow;

  if (!["approved", "cancelled"].includes(row.status)) {
    return { event: null, roster: [], canVerify: false };
  }

  let canVerify = false;

  if (viewer) {
    if (viewer.isSuperuser || viewer.isStaff) {
      canVerify = true;
    } else {
      const officerOrgIds = await getOfficerOrganizationIds(supabase, viewer.id);

      canVerify = officerOrgIds.includes(row.organization_id);
    }
  }

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
      email: r.student?.email ?? "",
      registeredAt: r.created_at,
      qrToken: r.qr_token,
      status: r.status,
      checkInAt: att?.check_in_at ?? null,
      checkInMethod: att?.check_in_method ?? null,
    };
  });

  const event: AttendanceEventItem = {
    id: row.id,
    title: row.title,
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "Campus Group",
    organizationAcronym: row.organizations?.acronym ?? "ORG",
    organizationLogoUrl: row.organizations?.logo_url ?? null,
    status: row.status,
    registrationDeadline: row.registration_deadline,
    venueName: row.venues?.name ?? "Campus Venue",
    startTime: row.start_time,
    endTime: row.end_time,
    capacity: row.capacity,
    registeredCount: roster.length,
    attendedCount: roster.filter((r) => r.status === "attended").length,
    isWindowOpen: row.status === "approved" && now >= openMs && now <= endMs,
    isWindowClosed: now > endMs,
  };

  return { event, roster, canVerify };
});
