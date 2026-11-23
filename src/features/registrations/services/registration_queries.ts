// Server-side data queries for Student Event Registrations (FR-12, FR-17).
import type { StudentPassItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type AttendanceJoinRow = {
  check_in_at: string;
  check_in_method: "manual" | "qr_scanner";
};

type RegQueryRow = {
  id: string;
  proposal_id: string;
  qr_token: string;
  status: "confirmed" | "attended";
  created_at: string;
  event: {
    id: string;
    title: string;
    status: string;
    registration_deadline: string;
    start_time: string;
    end_time: string;
    organizations: { name: string; acronym: string; logo_url: string | null } | null;
    venues: { name: string } | null;
  } | null;
  attendance: AttendanceJoinRow[] | AttendanceJoinRow | null;
};

/**
 * Fetch all active and past registrations for the authenticated student.
 */
export const getStudentRegistrations = cache(async (
  studentId: string
): Promise<StudentPassItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_registrations")
    .select(`
      id,
      proposal_id,
      qr_token,
      status,
      created_at,
      event:proposal_id (
        id,
        title,
        status,
        registration_deadline,
        start_time,
        end_time,
        organizations:organization_id (name, acronym, logo_url),
        venues:venue_id (name)
      ),
      attendance:attendance_records (check_in_at, check_in_method)
    `)
    .eq("student_id", studentId)
    .in("status", ["confirmed", "attended"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch student registrations:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as RegQueryRow[];

  return rows.map((row) => {
    const att = Array.isArray(row.attendance) ? row.attendance[0] : row.attendance;

    return {
      registrationId: row.id,
      eventId: row.proposal_id,
      eventTitle: row.event?.title ?? "Campus Activity",
      eventStatus: row.event?.status ?? "approved",
      registrationDeadline: row.event?.registration_deadline ?? "",
      organizationName: row.event?.organizations?.name ?? "Campus Group",
      organizationAcronym: row.event?.organizations?.acronym ?? "ORG",
      organizationLogoUrl: row.event?.organizations?.logo_url ?? null,
      venueName: row.event?.venues?.name ?? "Campus Venue",
      startTime: row.event?.start_time ?? "",
      endTime: row.event?.end_time ?? "",
      qrToken: row.qr_token,
      status: row.status,
      registeredAt: row.created_at,
      checkInAt: att?.check_in_at ?? null,
      checkInMethod: att?.check_in_method ?? null,
    };
  });
});

/**
 * Check if the student already has an active registration for a specific event.
 */
export const getEventRegistrationStatus = cache(async (
  eventId: string,
  studentId: string
): Promise<{
  isRegistered: boolean;
  registrationId?: string;
  status?: "confirmed" | "attended";
  qrToken?: string;
  checkInAt?: string | null;
}> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_registrations")
    .select("id, status, qr_token, attendance:attendance_records(check_in_at)")
    .eq("proposal_id", eventId)
    .eq("student_id", studentId)
    .in("status", ["confirmed", "attended"])
    .maybeSingle();

  if (!data) {
    return { isRegistered: false };
  }

  const row = data as unknown as {
    id: string;
    status: "confirmed" | "attended";
    qr_token: string;
    attendance: { check_in_at: string }[] | { check_in_at: string } | null;
  };
  const att = Array.isArray(row.attendance) ? row.attendance[0] : row.attendance;

  return {
    isRegistered: true,
    registrationId: row.id,
    status: row.status,
    qrToken: row.qr_token,
    checkInAt: att?.check_in_at ?? null,
  };
});
