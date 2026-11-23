import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { createClient } from "@/utils/supabase/server";

export type SearchEventHit = {
  id: string;
  title: string;
  status: string;
  subtitle: string;
  href: string;
};

export type SearchOrganizationHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type SearchVenueHit = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type GlobalSearchResponse = {
  events: SearchEventHit[];
  organizations: SearchOrganizationHit[];
  venues: SearchVenueHit[];
};

function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[%_\\,()]/g, "").trim();
}

function readRelationField<T extends string>(
  rel: Record<T, string> | Array<Record<T, string>> | null | undefined,
  field: T,
): string | null {
  if (!rel) return null;

  if (Array.isArray(rel)) {
    return rel[0]?.[field] ?? null;
  }

  return rel[field] ?? null;
}

/**
 * RLS-aware global command search endpoint spanning events/proposals,
 * active student organizations, and active campus venues.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawQuery = (request.nextUrl.searchParams.get("q") ?? "").trim();

  if (rawQuery.length < 2) {
    return NextResponse.json<GlobalSearchResponse>({
      events: [],
      organizations: [],
      venues: [],
    });
  }

  const sanitized = sanitizeSearchTerm(rawQuery);

  if (sanitized.length < 2) {
    return NextResponse.json<GlobalSearchResponse>({
      events: [],
      organizations: [],
      venues: [],
    });
  }

  const pattern = `%${sanitized}%`;
  const supabase = await createClient();

  const [eventsResult, organizationsResult, venuesResult] = await Promise.all([
    supabase
      .from("event_proposals")
      .select("id, title, status, start_time, organizations(acronym), venues(name)")
      .ilike("title", pattern)
      .order("start_time", { ascending: false })
      .limit(5),
    supabase
      .from("organizations")
      .select("id, name, acronym, category")
      .eq("is_active", true)
      .or(`name.ilike.${pattern},acronym.ilike.${pattern}`)
      .order("name", { ascending: true })
      .limit(4),
    supabase
      .from("venues")
      .select("id, name, location, capacity")
      .eq("is_active", true)
      .or(`name.ilike.${pattern},location.ilike.${pattern}`)
      .order("name", { ascending: true })
      .limit(4),
  ]);

  const events: SearchEventHit[] = eventsResult.error
    ? []
    : (eventsResult.data ?? []).map((row) => {
        const orgAcronym = readRelationField(
          row.organizations as { acronym: string } | Array<{ acronym: string }> | null,
          "acronym",
        );
        const venueName = readRelationField(
          row.venues as { name: string } | Array<{ name: string }> | null,
          "name",
        );
        const subtitleParts = [orgAcronym, venueName].filter(Boolean);

        return {
          id: row.id,
          title: row.title,
          status: row.status,
          subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : "Campus Event",
          href: `/events/${row.id}`,
        };
      });

  const organizations: SearchOrganizationHit[] = organizationsResult.error
    ? []
    : (organizationsResult.data ?? []).map((row) => ({
        id: row.id,
        title: `${row.acronym} - ${row.name}`,
        subtitle: row.category,
        href: `/organizations/${row.id}`,
      }));

  const venues: SearchVenueHit[] = venuesResult.error
    ? []
    : (venuesResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.name,
        subtitle: row.location || `Capacity ${row.capacity}`,
        href: `/venues/${row.id}`,
      }));

  return NextResponse.json<GlobalSearchResponse>({
    events,
    organizations,
    venues,
  });
}
