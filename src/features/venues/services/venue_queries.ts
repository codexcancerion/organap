// Server-side data queries for Campus Venues & Facilities (FR-07).
import type { VenueListItem, VenueDetail, VenueLinkedEvent } from "../types";

import { cache } from "react";

import { createClient } from "@/utils/supabase/server";

type VenueQueryRow = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  is_active: boolean;
  icon: string | null;
  color: string | null;
  events: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
  }[];
};

type VenueDetailQueryRow = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  is_active: boolean;
  icon: string | null;
  color: string | null;
  events: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    capacity: number;
    status: string;
    organization_id: string;
    organizations: {
      id: string;
      name: string;
      acronym: string;
    } | null;
  }[];
};

/**
 * Fetch all campus venues with live event metrics.
 */
export const getVenues = cache(async (): Promise<VenueListItem[]> => {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("venues")
    .select(`
      id,
      name,
      location,
      capacity,
      is_active,
      icon,
      color,
      events:event_proposals (id, start_time, end_time, status)
    `)
    .order("capacity", { ascending: false });

  if (error) {
    console.error("Failed to fetch venues:", error.message);

    return [];
  }

  const rows = (data ?? []) as unknown as VenueQueryRow[];

  return rows.map((row) => {
    const allEvents = row.events ?? [];
    const upcoming = allEvents.filter(
      (e) => e.end_time >= now && (e.status === "approved" || e.status === "pending_student_affairs")
    );

    return {
      id: row.id,
      name: row.name,
      location: row.location,
      capacity: row.capacity,
      isActive: row.is_active,
      icon: row.icon ?? "building-2",
      color: row.color ?? "accent",
      eventsCount: allEvents.length,
      upcomingEventsCount: upcoming.length,
    };
  });
});

/**
 * Fetch detailed venue record including all linked events scheduled at this facility.
 */
export const getVenueById = cache(async (id: string): Promise<VenueDetail | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .select(`
      id,
      name,
      location,
      capacity,
      is_active,
      icon,
      color,
      events:event_proposals (
        id,
        title,
        start_time,
        end_time,
        capacity,
        status,
        organization_id,
        organizations:organization_id (id, name, acronym)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as unknown as VenueDetailQueryRow;

  const events: VenueLinkedEvent[] = (row.events ?? [])
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .map((e) => ({
      id: e.id,
      title: e.title,
      organizationId: e.organization_id,
      organizationName: e.organizations?.name ?? "Campus Organization",
      organizationAcronym: e.organizations?.acronym ?? "ORG",
      startTime: e.start_time,
      endTime: e.end_time,
      capacity: e.capacity,
      status: e.status,
    }));

  return {
    id: row.id,
    name: row.name,
    location: row.location,
    capacity: row.capacity,
    isActive: row.is_active,
    icon: row.icon ?? "building-2",
    color: row.color ?? "accent",
    events,
  };
});
