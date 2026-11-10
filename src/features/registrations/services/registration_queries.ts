// Server-side data queries for Student Event Registrations (FR-12, FR-17).
import type { StudentPassItem } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type RegQueryRow = {
  id: string;
  proposal_id: string;
  qr_token: string;
  status: "confirmed" | "attended";
  created_at: string;
  event: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    organizations: { name: string; acronym: string } | null;
    venues: { name: string } | null;
  } | null;
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
        start_time,
        end_time,
        organizations:organization_id (name, acronym),
        venues:venue_id (name)
      )
    `)
    .eq("student_id", studentId)
    .in("status", ["confirmed", "attended"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch student registrations:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as RegQueryRow[];

  return rows.map((row) => ({
    registrationId: row.id,
    eventId: row.proposal_id,
    eventTitle: row.event?.title ?? "Campus Activity",
    organizationName: row.event?.organizations?.name ?? "Campus Group",
    organizationAcronym: row.event?.organizations?.acronym ?? "ORG",
    venueName: row.event?.venues?.name ?? "Campus Venue",
    startTime: row.event?.start_time ?? "",
    endTime: row.event?.end_time ?? "",
    qrToken: row.qr_token,
    status: row.status,
    registeredAt: row.created_at,
  }));
});

/**
 * Check if the student already has an active registration for a specific event.
 */
export const getEventRegistrationStatus = cache(async (
  eventId: string,
  studentId: string
): Promise<{ isRegistered: boolean; registrationId?: string; status?: string }> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("proposal_id", eventId)
    .eq("student_id", studentId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!data) {
    return { isRegistered: false };
  }

  return {
    isRegistered: true,
    registrationId: data.id,
    status: data.status,
  };
});
