// Server-side data queries for Approved Events feature (FR-10, FR-16).
import type { EventListItem, EventDetail } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type EventQueryRow = {
  id: string;
  title: string;
  purpose: string;
  activities_desc?: string;
  organization_id: string;
  venue_id: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  capacity: number;
  status: "approved" | "cancelled";
  cancellation_reason?: string | null;
  created_at?: string;
  organizations: { id: string; name: string; acronym: string } | null;
  venues: { id: string; name: string; location: string | null; capacity: number } | null;
  registrations: { id: string; student_id: string; status: string }[];
};

/**
 * Fetch all approved events with live confirmed registration counts.
 * Excludes unapproved proposals from student listings (FR-10).
 */
export const getApprovedEvents = cache(async (
  currentUserId?: string
): Promise<EventListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_proposals")
    .select(`
      id,
      title,
      purpose,
      organization_id,
      venue_id,
      start_time,
      end_time,
      registration_deadline,
      capacity,
      status,
      organizations:organization_id (id, name, acronym),
      venues:venue_id (id, name, location, capacity),
      registrations:event_registrations (id, student_id, status)
    `)
    .eq("status", "approved")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to fetch approved events:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as EventQueryRow[];

  return rows.map((row) => {
    const activeRegs = (row.registrations ?? []).filter(
      (r) => r.status === "confirmed" || r.status === "attended"
    );
    const isUserRegistered = currentUserId
      ? (row.registrations ?? []).some(
          (r) => r.student_id === currentUserId && r.status === "confirmed"
        )
      : false;

    return {
      id: row.id,
      title: row.title,
      purpose: row.purpose,
      organizationId: row.organization_id,
      organizationName: row.organizations?.name ?? "Campus Group",
      organizationAcronym: row.organizations?.acronym ?? "ORG",
      venueId: row.venue_id,
      venueName: row.venues?.name ?? "Campus Venue",
      venueLocation: row.venues?.location ?? null,
      venueCapacity: row.venues?.capacity ?? 0,
      startTime: row.start_time,
      endTime: row.end_time,
      registrationDeadline: row.registration_deadline,
      capacity: row.capacity,
      registeredCount: activeRegs.length,
      isRegistered: isUserRegistered,
      status: row.status,
    };
  });
});

/**
 * Fetch detail of an event by ID.
 */
export const getEventById = cache(async (
  id: string,
  currentUserId?: string
): Promise<EventDetail | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_proposals")
    .select(`
      id,
      title,
      purpose,
      activities_desc,
      organization_id,
      venue_id,
      start_time,
      end_time,
      registration_deadline,
      capacity,
      status,
      cancellation_reason,
      created_at,
      organizations:organization_id (id, name, acronym),
      venues:venue_id (id, name, location, capacity),
      registrations:event_registrations (id, student_id, status)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as EventQueryRow;

  const activeRegs = (row.registrations ?? []).filter(
    (r) => r.status === "confirmed" || r.status === "attended"
  );
  const isUserRegistered = currentUserId
    ? (row.registrations ?? []).some(
        (r) => r.student_id === currentUserId && r.status === "confirmed"
      )
    : false;

  return {
    id: row.id,
    title: row.title,
    purpose: row.purpose,
    activitiesDesc: row.activities_desc ?? "",
    organizationId: row.organization_id,
    organizationName: row.organizations?.name ?? "Campus Group",
    organizationAcronym: row.organizations?.acronym ?? "ORG",
    venueId: row.venue_id,
    venueName: row.venues?.name ?? "Campus Venue",
    venueLocation: row.venues?.location ?? null,
    venueCapacity: row.venues?.capacity ?? 0,
    startTime: row.start_time,
    endTime: row.end_time,
    registrationDeadline: row.registration_deadline,
    capacity: row.capacity,
    registeredCount: activeRegs.length,
    isRegistered: isUserRegistered,
    status: row.status,
    cancellationReason: row.cancellation_reason ?? null,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
});
